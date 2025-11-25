export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users: [User!]!
    
    # Post queries
    post(id: ID!): Post
    posts(published: Boolean): [Post!]!
    myPosts: [Post!]!
    
    # Comment queries
    comments(postId: ID!): [Comment!]!
  }

  type Mutation {
    # Authentication
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Post mutations
    createPost(title: String!, content: String!, published: Boolean): Post!
    updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
    deletePost(id: ID!): Boolean!
    
    # Comment mutations
    createComment(postId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }
`;
