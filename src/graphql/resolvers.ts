import { pool } from '../utils/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export interface Context {
  user?: {
    userId: number;
    username: string;
    email: string;
  };
}

export const resolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [context.user.userId]);

      return result.rows[0];
    },

    // Get user by ID
    user: async (_: any, { id }: { id: number }) => {
      const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    },

    // Get all users
    users: async () => {
      const result = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');

      return result.rows;
    },

    // Get post by ID
    post: async (_: any, { id }: { id: number }) => {
      const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        throw new Error('Post not found');
      }

      return result.rows[0];
    },

    // Get all posts (optionally filter by published status)
    posts: async (_: any, { published }: { published?: boolean }) => {
      let query = 'SELECT * FROM posts';
      const params: any[] = [];

      if (published !== undefined) {
        query += ' WHERE published = $1';
        params.push(published);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    },

    // Get posts by current user
    myPosts: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const result = await pool.query('SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC', [context.user.userId]);

      return result.rows;
    },

    // Get comments for a post
    comments: async (_: any, { postId }: { postId: number }) => {
      const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC', [postId]);

      return result.rows;
    },
  },

  Mutation: {
    // Register new user
    register: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const result = await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at', [username, email, hashedPassword]);

      const user = result.rows[0];

      // Generate token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return {
        token,
        user,
      };
    },

    // Login user
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      // Find user
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      };
    },

    // Create post
    createPost: async (_: any, { title, content, published = false }: { title: string; content: string; published?: boolean }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const result = await pool.query('INSERT INTO posts (title, content, published, author_id) VALUES ($1, $2, $3, $4) RETURNING *', [title, content, published, context.user.userId]);

      return result.rows[0];
    },

    // Update post
    updatePost: async (_: any, { id, title, content, published }: { id: number; title?: string; content?: string; published?: boolean }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if post belongs to user
      const postCheck = await pool.query('SELECT author_id FROM posts WHERE id = $1', [id]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postCheck.rows[0].author_id !== context.user.userId) {
        throw new Error('Not authorized to update this post');
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount}`);
        params.push(title);
        paramCount++;
      }

      if (content !== undefined) {
        updates.push(`content = $${paramCount}`);
        params.push(content);
        paramCount++;
      }

      if (published !== undefined) {
        updates.push(`published = $${paramCount}`);
        params.push(published);
        paramCount++;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await pool.query(query, params);
      return result.rows[0];
    },

    // Delete post
    deletePost: async (_: any, { id }: { id: number }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if post belongs to user
      const postCheck = await pool.query('SELECT author_id FROM posts WHERE id = $1', [id]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postCheck.rows[0].author_id !== context.user.userId) {
        throw new Error('Not authorized to delete this post');
      }

      await pool.query('DELETE FROM posts WHERE id = $1', [id]);

      return true;
    },

    // Create comment
    createComment: async (_: any, { postId, content }: { postId: number; content: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if post exists
      const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      const result = await pool.query('INSERT INTO comments (content, post_id, author_id) VALUES ($1, $2, $3) RETURNING *', [content, postId, context.user.userId]);

      return result.rows[0];
    },

    // Delete comment
    deleteComment: async (_: any, { id }: { id: number }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if comment belongs to user
      const commentCheck = await pool.query('SELECT author_id FROM comments WHERE id = $1', [id]);

      if (commentCheck.rows.length === 0) {
        throw new Error('Comment not found');
      }

      if (commentCheck.rows[0].author_id !== context.user.userId) {
        throw new Error('Not authorized to delete this comment');
      }

      await pool.query('DELETE FROM comments WHERE id = $1', [id]);

      return true;
    },
  },

  // Field resolvers
  User: {
    posts: async (parent: any) => {
      const result = await pool.query('SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC', [parent.id]);
      return result.rows;
    },
    createdAt: (parent: any) => parent.created_at,
  },

  Post: {
    author: async (parent: any) => {
      const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [parent.author_id]);
      return result.rows[0];
    },
    comments: async (parent: any) => {
      const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC', [parent.id]);
      return result.rows;
    },
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at,
  },

  Comment: {
    author: async (parent: any) => {
      const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [parent.author_id]);
      return result.rows[0];
    },
    post: async (parent: any) => {
      const result = await pool.query('SELECT * FROM posts WHERE id = $1', [parent.post_id]);
      return result.rows[0];
    },
    createdAt: (parent: any) => parent.created_at,
  },
};
