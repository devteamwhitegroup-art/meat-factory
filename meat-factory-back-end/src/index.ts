import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import cors from 'cors';
import { resolvers } from './schema/resolver';
import { mergedGQLSchema } from './schema/typeDefs';
import http from 'http';
import config from './config/index';
import { connectDatabase } from './config/db-connection';
import { authDirectiveTransformer } from './schema/directives/auth.directive';
import { makeExecutableSchema } from '@graphql-tools/schema';
import router from './routes';
const { PORT } = config;

const app = express();
const httpServer = http.createServer(app);

(async () => {
  try {
    //Rest API Implementation
    app.use(cors());
    app.use(router);

    //Graphql Implementation
    let schema = makeExecutableSchema({
      typeDefs: mergedGQLSchema,
      resolvers
    });

    schema = await authDirectiveTransformer(schema);

    const server = new ApolloServer<{ token: string }>({
      schema,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
    });
    await server.start();

    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          return {
            token: (req.headers['authorization'] as string) || ''
          };
        }
      })
    );

    Promise.all([httpServer.listen({ port: PORT }), connectDatabase()]).then(
      () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}`);
      }
    );
  } catch (error) {
    console.log(error.message || 'An error occurred while starting the server');
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
