import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs';
import { resolvers, Context } from './graphql/resolvers';
import { testConnection, initializeDatabase } from './utils/database';
import { verifyToken } from './utils/auth';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  // Test database connection
  await testConnection();

  // Initialize database tables
  await initializeDatabase();

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // GraphQL endpoint with authentication context
  // @ts-ignore - Type mismatch between Apollo Server and Express types
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token) {
          try {
            const user = verifyToken(token);
            return { user };
          } catch (error) {
            return {};
          }
        }

        return {};
      },
    }),
  );

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'Node.js GraphQL API',
      version: '1.0.0',
      endpoints: {
        graphql: '/graphql',
        health: '/health',
      },
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
