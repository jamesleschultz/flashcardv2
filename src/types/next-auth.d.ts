// src/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Add the ID property
    } & DefaultSession["user"]; // Include default properties
  }

  // Also augment the User type used in the session callback parameter
  interface User extends DefaultUser {
    // id: string; // The DefaultUser might already include id, but ensuring it or adding others
  }
}