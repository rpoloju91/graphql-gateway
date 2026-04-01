import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import 'dotenv/config';

import typeDefs from './schema/typeDefs.js';
import resolvers from './resolvers/helloWorldResolver.js';


// ─────────────��───────────────────────────────────
// Step 1: Create the Apollo Server
// Pass in the schema (typeDefs) and logic (resolvers)
// introspection: true → enables Apollo Sandbox UI
// ─────────────────────────────────────────────────
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});


// ─────────────────────────────────────────────────
// Step 2: Start the server on the port from .env
// ─────────────────────────────────────────────────
const { url } = await startStandaloneServer(server, {
  listen: { port: Number(process.env.PORT) || 4000 },
});


// ─────────────────────────────────────────────────
// Step 3: Log startup info
// ─────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║   🚀  Apollo GraphQL Server Started      ║');
console.log('╠══════════════════════════════════════════╣');
console.log(`║   GraphQL Endpoint : ${url}           ║`);
console.log(`║   Apollo Sandbox   : ${url}           ║`);
console.log('╚══════════════════════════════════════════╝');
console.log('');
