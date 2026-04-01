import gql from 'graphql-tag';

const typeDefs = gql`

  # ─────────────────────────────────────────────────
  # TYPE — Defines the shape of a HelloWorld object
  # This matches what Spring Boot returns from the DB
  # ─────────────────────────────────────────────────
  type HelloWorld {
    id: String!           # Unique identifier  (! means required/non-null)
    message: String!  # The hello message  (! means required/non-null)
  }


  # ─────────────────────────────────────────────────
  # QUERY — Read operations (like GET in REST)
  # ─────────────────────────────────────────────────
  type Query {

    # Returns a list of ALL HelloWorld records
    helloWorlds: [HelloWorld!]!

    # Returns ONE HelloWorld by its ID
    helloWorld(id: String!): HelloWorld

  }


  # ─────────────────────────────────────────────────
  # MUTATION — Write operations (like POST in REST)
  # ──────────────────────────────────────���──────────
  type Mutation {

    # Creates a new HelloWorld record
    # Takes 'message' as input, returns the created record
    createHelloWorld(message: String!): HelloWorld!

  }

`;

export default typeDefs;