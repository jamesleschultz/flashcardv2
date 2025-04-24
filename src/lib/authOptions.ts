// src/lib/authOptions.ts
// Centralized configuration for NextAuth

import { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma"; // Adjust path if needed
import { firebaseAdminAuth } from "@/lib/firebase-admin"; // Adjust path if needed

// Extend Session type (often done in next-auth.d.ts but can be here too)
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Ensure ID is always present
    } & DefaultSession["user"]; // Keep default name, email, image (image will be null)
  }
}
// Extend JWT type (optional but good practice)
declare module "next-auth/jwt" {
    interface JWT {
        sub?: string; // User ID stored here
    }
}


// Define and EXPORT authOptions here
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "FirebaseCredentials",
            credentials: {
                idToken: { label: "Firebase ID Token", type: "text" },
            },
            async authorize(credentials) {
                console.log("AuthOptions: Authorizing...");
                if (!credentials?.idToken) {
                    console.error("AuthOptions: No ID token provided.");
                    return null;
                }

                try {
                    const decodedToken = await firebaseAdminAuth.verifyIdToken(credentials.idToken);
                    if (!decodedToken?.uid) {
                        console.error("AuthOptions: Invalid token or UID missing.");
                        return null;
                    }
                    console.log("AuthOptions: Token verified, UID:", decodedToken.uid);

                    let user = await prisma.user.findUnique({ where: { id: decodedToken.uid } });

                    if (!user) {
                        console.log("AuthOptions: Creating new user:", decodedToken.uid);
                        user = await prisma.user.create({
                            data: {
                                id: decodedToken.uid,
                                email: decodedToken.email,
                                name: decodedToken.name,
                                avatarUrl: decodedToken.picture, // Map Firebase pic to your avatarUrl
                                emailVerified: decodedToken.email_verified ? new Date() : null,
                                // No 'image' field needed here
                            },
                        });
                    } else {
                        console.log("AuthOptions: User found:", user.id);
                        // Update if name, email, or avatarUrl differ
                        if (user.name !== decodedToken.name || user.email !== decodedToken.email || user.avatarUrl !== decodedToken.picture) {
                             console.log("AuthOptions: Updating user info...");
                             user = await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                   name: decodedToken.name,
                                   email: decodedToken.email,
                                   avatarUrl: decodedToken.picture, // Update your field
                                   emailVerified: decodedToken.email_verified ? (user.emailVerified ?? new Date()) : null,
                                }
                             });
                        }
                    }

                    if (!user) {
                        console.error("AuthOptions: Failed to find/create user.");
                        return null;
                    }

                    // Return necessary fields for callbacks (id is crucial)
                    // name/email are useful for jwt/session callbacks
                    console.log("AuthOptions: Authorize returning user:", { id: user.id, name: user.name, email: user.email });
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        // NO image field returned
                    };

                } catch (error) {
                    console.error("AuthOptions: Error during authorize:", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            // Add user ID ('sub') to the token on initial sign in
            if (user?.id) {
                token.sub = user.id;
            }
            // Name/email might be added automatically by NextAuth from authorize return
            return token;
        },
        async session({ session, token }) {
            // Add user ID from token's 'sub' claim to the session.user object
            if (token?.sub && session.user) {
                // Use type assertion to assure TypeScript 'id' exists based on declaration
                (session.user as { id: string }).id = token.sub;
            }
            // Ensure name/email are on session if needed (often automatic with JWT)
            // if (token?.name && session.user) session.user.name = token.name as string;
            // if (token?.email && session.user) session.user.email = token.email as string;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};