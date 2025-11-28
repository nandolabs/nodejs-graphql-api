# Node.js GraphQL API

A production-ready GraphQL API built with Apollo Server v5, Express, PostgreSQL, and TypeScript. Features JWT authentication, authorization, CRUD operations, and Docker deployment.

## 🚀 Features

- **Modern GraphQL API** with Apollo Server v5 (latest stable version)
- **JWT Authentication** with bcrypt password hashing
- **Authorization** with token-based access control
- **PostgreSQL Database** with connection pooling
- **TypeScript** for type safety and better developer experience
- **Docker** support with multi-stage builds for production deployment
- **Field Resolvers** for efficient relationship loading
- **CRUD Operations** for users, posts, and comments
- **Health Check** endpoint for monitoring

## 🛠️ Tech Stack

- **Runtime**: Node.js 22 (LTS)
- **Framework**: Express 4.21.1
- **GraphQL**: Apollo Server 5.2.0 (non-deprecated, actively maintained)
- **Database**: PostgreSQL 16
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Language**: TypeScript 5.9.3
- **Development**: nodemon, ts-node
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- **Node.js** >= 20 (recommend v22.17.0)
- **PostgreSQL** 16
- **npm** 10+
- **Docker** (optional, for containerized deployment)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nandolabs/nodejs-graphql-api.git
cd nodejs-graphql-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=graphql_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 4. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE graphql_db;

# Exit psql
\q
```

The application will automatically create the required tables on startup.

### 5. Run the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

The API will be available at `http://localhost:4000/graphql`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services (PostgreSQL + API)
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
```

### Manual Docker Build

```bash
# Build image
docker build -t nodejs-graphql-api .

# Run container (ensure PostgreSQL is accessible)
docker run -p 4000:4000 --env-file .env nodejs-graphql-api
```

## 📡 API Documentation

### GraphQL Endpoint

- **URL**: `http://localhost:4000/graphql`
- **Apollo Studio**: Available at the GraphQL endpoint for interactive testing

### Health Check

```bash
curl http://localhost:4000/health
```

Response: `{"status":"OK"}`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## 📚 GraphQL Schema

### Types

#### User
```graphql
type User {
  id: ID!
  username: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}
```

#### Post
```graphql
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
```

#### Comment
```graphql
type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: String!
}
```

#### AuthPayload
```graphql
type AuthPayload {
  token: String!
  user: User!
}
```

### Queries

#### Get Current User (Authenticated)
```graphql
query {
  me {
    id
    username
    email
    posts {
      id
      title
    }
  }
}
```

#### Get All Users
```graphql
query {
  users {
    id
    username
    email
  }
}
```

#### Get User by ID
```graphql
query {
  user(id: "1") {
    id
    username
    posts {
      id
      title
    }
  }
}
```

#### Get All Posts
```graphql
query {
  posts {
    id
    title
    content
    published
    author {
      username
    }
    createdAt
  }
}
```

#### Get Published Posts Only
```graphql
query {
  posts(published: true) {
    id
    title
    author {
      username
    }
  }
}
```

#### Get My Posts (Authenticated)
```graphql
query {
  myPosts {
    id
    title
    published
    createdAt
  }
}
```

#### Get Post by ID
```graphql
query {
  post(id: "1") {
    id
    title
    content
    author {
      username
    }
    comments {
      id
      content
      author {
        username
      }
    }
  }
}
```

#### Get Comments for a Post
```graphql
query {
  comments(postId: "1") {
    id
    content
    author {
      username
    }
    createdAt
  }
}
```

### Mutations

#### Register New User
```graphql
mutation {
  register(
    username: "johndoe"
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Login
```graphql
mutation {
  login(
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Create Post (Authenticated)
```graphql
mutation {
  createPost(
    title: "My First Post"
    content: "This is the content of my post"
    published: true
  ) {
    id
    title
    content
    published
    author {
      username
    }
    createdAt
  }
}
```

#### Update Post (Authenticated, Owner Only)
```graphql
mutation {
  updatePost(
    id: "1"
    title: "Updated Title"
    content: "Updated content"
    published: false
  ) {
    id
    title
    content
    published
    updatedAt
  }
}
```

#### Delete Post (Authenticated, Owner Only)
```graphql
mutation {
  deletePost(id: "1") {
    id
    title
  }
}
```

#### Create Comment (Authenticated)
```graphql
mutation {
  createComment(
    postId: "1"
    content: "Great post!"
  ) {
    id
    content
    author {
      username
    }
    post {
      title
    }
    createdAt
  }
}
```

#### Delete Comment (Authenticated, Owner Only)
```graphql
mutation {
  deleteComment(id: "1") {
    id
  }
}
```

## 🧪 Testing Examples with cURL

### Register a New User
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(username: \"testuser\", email: \"test@example.com\", password: \"password123\") { token user { id username email } } }"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"test@example.com\", password: \"password123\") { token user { id username email } } }"
  }'
```

### Create a Post (with Authentication)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "mutation { createPost(title: \"My Post\", content: \"Post content\", published: true) { id title author { username } } }"
  }'
```

### Query Posts
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { posts { id title content author { username } } }"
  }'
```

### Get Current User (with Authentication)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query { me { id username email posts { id title } } }"
  }'
```

## 🗄️ Database Schema

The application automatically creates three tables:

### `users`
- `id` - Serial primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Bcrypt hashed password
- `created_at` - Timestamp

### `posts`
- `id` - Serial primary key
- `title` - Post title
- `content` - Post content
- `author_id` - Foreign key to users
- `published` - Boolean published status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `comments`
- `id` - Serial primary key
- `content` - Comment content
- `post_id` - Foreign key to posts
- `author_id` - Foreign key to users
- `created_at` - Timestamp

All foreign keys have `ON DELETE CASCADE` for referential integrity.

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Authorization**: Protected mutations and queries require valid JWT tokens
- **Ownership Verification**: Users can only update/delete their own content
- **Environment Variables**: Sensitive configuration stored in `.env` file

## 📁 Project Structure

```
nodejs-graphql-api/
├── src/
│   ├── graphql/
│   │   ├── typeDefs.ts      # GraphQL schema definitions
│   │   └── resolvers.ts     # GraphQL resolvers with auth logic
│   ├── utils/
│   │   ├── database.ts      # PostgreSQL connection pool
│   │   └── auth.ts          # JWT and bcrypt utilities
│   └── index.ts             # Express + Apollo Server setup
├── dist/                    # Compiled JavaScript (after build)
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker Compose configuration
└── README.md
```

## 🚨 Error Handling

The API provides clear error messages for common scenarios:

- **Authentication Required**: `"Authentication required"`
- **Invalid Credentials**: `"Invalid credentials"`
- **User Already Exists**: `"User with this email/username already exists"`
- **Not Found**: `"Post not found"` / `"User not found"`
- **Unauthorized**: `"Not authorized to perform this action"`

## 🔄 Development Workflow

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload on file changes)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Docker development
docker-compose up --build
```

## 📊 Performance Features

- **Connection Pooling**: PostgreSQL connection pool (max 20 connections)
- **Field Resolvers**: Efficient lazy loading of relationships
- **Indexed Queries**: Database indexes on foreign keys
- **JWT Caching**: Tokens cached for duration of request

## 🐛 Troubleshooting

### Node Version Error
**Error**: `EBADENGINE Unsupported engine`  
**Solution**: Upgrade to Node.js 20 or higher (recommend v22)

```bash
nvm install 22
nvm use 22
```

### Database Connection Error
**Error**: `password authentication failed for user "postgres"`  
**Solution**: 
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Set PostgreSQL password:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
```

### Port Already in Use
**Error**: `Port 4000 is already in use`  
**Solution**: Change the `PORT` in `.env` or kill the process using port 4000

```bash
# Find process
lsof -i :4000

# Kill process
kill -9 <PID>
```

## 📝 License

ISC

## 👤 Author

**NandoLabs**
- GitHub: [@nandolabs](https://github.com/nandolabs)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

*This project is part of the NandoLabs portfolio, showcasing production-ready GraphQL API development with Node.js, TypeScript, and Apollo Server.*
