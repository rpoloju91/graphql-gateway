import {
  fetchAllHelloWorlds,
  fetchHelloWorldById,
  postHelloWorld,
} from '../datasources/springBootAPI.js';


const resolvers = {

  // ─────────────────────────────────────────────────
  // QUERY RESOLVERS
  // These handle read requests from the frontend
  // ────────────────────────────��────────────────────
  Query: {

    // Handles: query { helloWorlds { id message } }
    // Calls Spring Boot GET /api/hello
    helloWorlds: async () => {
      console.log('📥 Query: helloWorlds called');
      return await fetchAllHelloWorlds();
    },

    // Handles: query { helloWorld(id: "1") { id message } }
    // Calls Spring Boot GET /api/hello/{id}
    // _ is the parent object (unused here, but required by Apollo)
    // { id } is the argument passed in the query
    helloWorld: async (_, { id }) => {
      console.log(`📥 Query: helloWorld called with id=${id}`);
      return await fetchHelloWorldById(id);
    },

  },


  // ─────────────────────────────────────────────────
  // MUTATION RESOLVERS
  // These handle write requests from the frontend
  // ─────────────────────────────────────────────────
  Mutation: {

    // Handles: mutation { createHelloWorld(message: "Hi!") { id message } }
    // Calls Spring Boot POST /api/hello
    // _ is the parent object (unused here, but required by Apollo)
    // { message } is the argument passed in the mutation
    createHelloWorld: async (_, { message }) => {
      console.log(`📤 Mutation: createHelloWorld called with message="${message}"`);
      return await postHelloWorld(message);
    },

  },

};

export default resolvers;