src/graphql/
├── index.ts             # Merges everything together
├── base/                # Shared types (JSON, TicketRequest, SessionResponse)
├── auth/                # Login, Sessions, OTPs
├── user/                # Roles, Permissions, User Management
└── location/            # Locations, Billing, Plans

```
### 1. Base Module (Shared Types & Utilities)
This holds the scalar types, generic responses, and shared inputs like TicketRequest that multiple domains rely on.
**src/graphql/base/typeDefs.ts**

export const baseTypeDefs = `
  scalar JSON 

  type SessionResponse {
    success: Boolean!
    message: String
    data: JSON
  }

  input TicketRequest {
    type: String!
    sessionKey: String
    cognitoUserId: String
    userPoolId: String
    queryString: String
    guestSessionKey: String
    email: String
    phone: String
    firstName: String
    lastName: String
    roleName: String
    permissionName: String
    roleId: Int
    permissionId: Int
    userId: Int
    adminUseOnly: Boolean
    adminGrantOnly: Boolean
    locationName: String
    locationId: Int
    parentLocationId: Int
    locationFunctionId: Int
    productionId: Int
    locationProductionId: Int
    eventSeriesId: Int
    seatMapId: Int
    locationEventId: Int
    eventDate: String
  }

  type Query {
    hello(type: String!): String!
    sayHelloWorld(type: String!): String!
    test: String!
  }
`;

**src/graphql/base/resolvers.ts**

import { sayHello, sayHelloWorld } from "../../../service/helloService";

export const baseResolvers = {
  Query: {
    hello: async (_: any, { type }: any, ctx: any) => {
      ctx.logger.info("Executing Query: Hello");
      const response = await sayHello(type, ctx.token, ctx.logger);
      return JSON.stringify(response);
    },
    sayHelloWorld: async (_: any, { type }: any, ctx: any) => {
      ctx.logger.info("Executing Query: Welcome");
      const response = await sayHelloWorld(type, ctx.logger);
      return JSON.stringify(response);
    },
  },
};

### 2. Auth Module

Handles everything related to logging in, sessions, and OTPs.
**src/graphql/auth/typeDefs.ts**


export const authTypeDefs = `
  type AuthToken {
    userId: String!
    token: String!
    idToken: String!
    refreshToken: String!
    sessionKey: String!
  }

  type CustomerResponse {
    status: String
    message: String
    accessToken: String
    refreshToken: String
    idToken: String
    expiresIn: Int
    username: String
    enabled: Boolean
    cognitoUserId: String
    isNewUser: Boolean
    tokenType: String
    sessionKey: String
  }

  input StartSession {
    type: String!
    queryString: String!
    cognitoUserId: String
  }

  input EmailOtp {
    email: String
    otp: String 
  }

  type Query {
    getClientUser(request: EmailOtp): CustomerResponse
    getCustomerProfile: SessionResponse
    getClientProfile: SessionResponse
  }

  type Mutation {
    login(userName: String!, password: String!): AuthToken!
    refreshAuth(userId: String!, token: String!): AuthToken!
    startSession(request: StartSession): SessionResponse
    endSession(request: TicketRequest): SessionResponse
    sendOtp(request: EmailOtp): CustomerResponse
    verifyOtp(request: EmailOtp): CustomerResponse
  }
`;


**src/graphql/auth/resolvers.ts**

import { login, refreshToken } from "../../../service/authService";
import { sendOtp, verifyOtp } from "../../../service/customerOtpService";
import { endSession, startSession } from "../../../service/loginSession";
import { getClientUser } from "../../../service/UserRegisterService";
import { getCustomerProfile, getClientProfile } from "../../../service/adminService";

export const authResolvers = {
  Query: {
    getCustomerProfile: async (_: any, args: any, ctx: any) => {
      ctx.logger.info("Fetch Customer Profile");
      return await getCustomerProfile(ctx.token, ctx.logger);
    },
    getClientProfile: async (_: any, args: any, ctx: any) => {
      ctx.logger.info("Fetch Client Profile");
      return await getClientProfile(ctx.token, ctx.logger);
    },
    getClientUser: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Client User", { request });
      return await getClientUser(request, ctx);
    },
  },
  Mutation: {
    login: async (_: any, { userName, password }: any, ctx: any) => {
      ctx.logger.info("Logging user", { userName, tenantId: ctx.tenantId });
      return await login(userName, password, ctx.logger, ctx.tenantId);
    },
    refreshAuth: async (_: any, { userId, token }: any, ctx: any) => {
      ctx.logger.info("Refreshing token..", { ctx });
      return await refreshToken(userId, token, ctx.logger, ctx.tenantId);
    },
    startSession: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Logging User", { request });
      return await startSession(request, ctx.token, ctx.logger);
    },
    endSession: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("End Session", { request });
      return await endSession(request, ctx.token, ctx.logger);
    },
    sendOtp: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Send OTP to Email", { request });
      return await sendOtp(request, ctx);
    },
    verifyOtp: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Verify OTP", { request });
      return await verifyOtp(request, ctx);
    },
  },
};

### 3. User & Role Module
Handles RBAC (Role-Based Access Control) and User Management.
**src/graphql/user/typeDefs.ts**

export const userTypeDefs = `
  input CreateClientUser {
    email: String!
    phone: String!
    firstName: String!
    lastName: String!
  }

  input CreateRole {
    type: String!
    roleName: String!
  }

  input AssignRole {
    type: String!
    userId: Int!
    roleId: Int!
  }

  input LinkPermission {
    type: String!
    roleId: Int!
    permissionId: Int!
  }

  input UpsertUser {
    type: String!
    email: String
    dateOfBirth: String
    phone: String
    firstName: String!
    lastName: String!
  }

  type Query {
    getMyPermissions(request: TicketRequest): SessionResponse
  }

  type Mutation {
    upsertUser(request: UpsertUser): SessionResponse
    createRole(request: CreateRole): SessionResponse
    deleteUser(request: TicketRequest): SessionResponse
    assignRole(request: AssignRole): SessionResponse
    definePermission(request: TicketRequest): SessionResponse
    deletePermission(request: TicketRequest): SessionResponse
    linkPermission(request: LinkPermission): SessionResponse
    createClientUser(request: CreateClientUser): CustomerResponse
    deleteClientUser(request: EmailOtp): CustomerResponse
  }
`;

**src/graphql/user/resolvers.ts**

import {
  assignRole,
  createRole,
  definePermission,
  deletePermission,
  deleteUser,
  getMyPermissions,
  linkPermission,
  upsertUser,
} from "../../../service/adminService";
import { createClientUser, deleteClientUser } from "../../../service/UserRegisterService";

export const userResolvers = {
  Query: {
    getMyPermissions: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Permissions", { request });
      return await getMyPermissions(request, ctx.token, ctx.logger);
    },
  },
  Mutation: {
    upsertUser: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Upsert User", { request });
      if (["client", "superadmin", "global"].includes(request.type.toLowerCase()) && !request.email) {
        throw new Error("email is required for client, super admin and global types");
      }
      return await upsertUser(request, ctx.token, ctx.logger);
    },
    createRole: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Create Role", { request });
      return await createRole(request, ctx.token, ctx.logger);
    },
    deleteUser: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Delete User", { request });
      return await deleteUser(request, ctx.token, ctx.logger);
    },
    assignRole: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Assign role to User", { request });
      return await assignRole(request, ctx.token, ctx.logger);
    },
    definePermission: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Define a Permission", { request });
      return await definePermission(request, ctx.token, ctx.logger);
    },
    deletePermission: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Delete Permission", { request });
      return await deletePermission(request, ctx.token, ctx.logger);
    },
    linkPermission: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Assign Permission to Role", { request });
      return await linkPermission(request, ctx.token, ctx.logger);
    },
    createClientUser: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Client Admin create User", { request });
      return await createClientUser(request, ctx);
    },
    deleteClientUser: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Client Admin delete User", { request });
      return await deleteClientUser(request, ctx);
    },
  },
};

### 4. Location Module
Handles all location and billing functionality.
**src/graphql/location/typeDefs.ts**
export const locationTypeDefs = `
  input AddLocation {
    type: String!
    locationName: String!
    parentLocationId: Int
  }

  input DeleteLocation {
    type: String!
    locationId: Int!
    clientPlanId: Int
  }

  input PaymentProvider {
    type: String!
    locationId: Int!
    paymentProviderId: Int!
  }

  input LocationFunction {
    type: String!
    locationId: Int!
    functionTypeId: Int!
    isEnabled: Boolean
  }

  input ClientBilling {
    type: String!
    locationId: Int!
    merchantId: Int!
  }

  input MoveLocation {
    type: String!
    locationId: Int!
    parentLocationId: Int!
  } 

  type Mutation {
    addLocation(request: AddLocation): SessionResponse
    addClientLocation(request: AddLocation): SessionResponse
    removeLocation(request: DeleteLocation): SessionResponse
    getLocationDescendents(request: DeleteLocation): SessionResponse
    getLocationFunctions(request: DeleteLocation): SessionResponse
    getLocationPlan(request: DeleteLocation): SessionResponse
    getClientPlan(request: DeleteLocation): SessionResponse
    getClientLocationBilling(request: DeleteLocation): SessionResponse
    getClientPaymentProvider(request: DeleteLocation): SessionResponse
    updatePlan(request: DeleteLocation): SessionResponse
    updatePaymentProvider(request: PaymentProvider): SessionResponse
    updateClientBilling(request: ClientBilling): SessionResponse
    upsertLocationFunction(request: LocationFunction): SessionResponse
    moveLocation(request: MoveLocation): SessionResponse
  }
`;

**src/graphql/location/resolvers.ts**

import {
  addClientLocation, addLocation, getClientLocationBilling, getClientPaymentProvider,
  getLocationDescendents, getLocationFunctions, getLocationPlan, moveLocation,
  removeLocation, updateClientBilling, updatePaymentProvider, updatePlan, upsertLocationFunction
} from "../../../service/locationService";

export const locationResolvers = {
  Mutation: {
    addLocation: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Add Location", { request });
      return await addLocation(request, ctx.token, ctx.logger);
    },
    addClientLocation: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Add Client Location", { request });
      return await addClientLocation(request, ctx.token, ctx.logger);
    },
    removeLocation: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Remove Location", { request });
      return await removeLocation(request, ctx.token, ctx.logger);
    },
    getLocationDescendents: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Location & Descendents", { request });
      return await getLocationDescendents(request, ctx.token, ctx.logger);
    },
    getLocationFunctions: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Location Functions", { request });
      return await getLocationFunctions(request, ctx.token, ctx.logger);
    },
    getLocationPlan: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Location Plans", { request });
      return await getLocationPlan(request, ctx.token, ctx.logger);
    },
    getClientPlan: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Client Plans", { request });
      return await getLocationPlan(request, ctx.token, ctx.logger);
    },
    getClientPaymentProvider: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Client Payment Provider", { request });
      return await getClientPaymentProvider(request, ctx.token, ctx.logger);
    },
    getClientLocationBilling: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Fetch Location Billing", { request });
      return await getClientLocationBilling(request, ctx.token, ctx.logger);
    },
    updatePlan: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Client Plan Updated", { request });
      return await updatePlan(request, ctx.token, ctx.logger);
    },
    updateClientBilling: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Client Billing Updated", { request });
      return await updateClientBilling(request, ctx.token, ctx.logger);
    },
    updatePaymentProvider: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Payment Provider Updated", { request });
      return await updatePaymentProvider(request, ctx.token, ctx.logger);
    },
    upsertLocationFunction: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Upsert Location Function", { request });
      return await upsertLocationFunction(request, ctx.token, ctx.logger);
    },
    moveLocation: async (_: any, { request }: any, ctx: any) => {
      ctx.logger.info("Move Location", { request });
      return await moveLocation(request, ctx.token, ctx.logger);
    },
  },
};

### 5. The Merger (index.ts)
This file gathers all your scattered files, stitches them together seamlessly, and exports the final schema configuration that you can plug right into your Apollo Server setup.
*Note: You will need the @graphql-tools/merge and optionally @graphql-tools/schema packages installed (npm install @graphql-tools/merge @graphql-tools/schema).*

**src/graphql/index.ts**

import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

// Import TypeDefs
import { baseTypeDefs } from "./base/typeDefs";
import { authTypeDefs } from "./auth/typeDefs";
import { userTypeDefs } from "./user/typeDefs";
import { locationTypeDefs } from "./location/typeDefs";

// Import Resolvers
import { baseResolvers } from "./base/resolvers";
import { authResolvers } from "./auth/resolvers";
import { userResolvers } from "./user/resolvers";
import { locationResolvers } from "./location/resolvers";

// 1. Merge Type Definitions
export const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  authTypeDefs,
  userTypeDefs,
  locationTypeDefs,
]);

// 2. Merge Resolvers
export const resolvers = mergeResolvers([
  baseResolvers,
  authResolvers,
  userResolvers,
  locationResolvers,
]);

// 3. Create the final Executable Schema (Optional, depending on your setup)

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

```
