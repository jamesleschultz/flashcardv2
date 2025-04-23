import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { firebaseAdminAuth } from "@/lib/firebase-admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Firebase",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const decodedToken = await firebaseAdminAuth.verifyIdToken(credentials.idToken);
          if (!decodedToken?.uid) return null;

          let user = await prisma.user.findUnique({ where: { id: decodedToken.uid } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,

                avatarUrl: decodedToken.picture, 
              },
            });
          } else {
            // Update existing user
            if (user.name !== decodedToken.name || user.email !== decodedToken.email || user.avatarUrl !== decodedToken.picture) {
                 user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                       name: decodedToken.name,
                       email: decodedToken.email,
                       avatarUrl: decodedToken.picture,
                    }
                 });
            }
          }

          if (!user) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,

          };

        } catch (error) {
          console.error("Firebase ID Token Verification Failed:", error);
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
      // Persist essential info to token
      if (user?.id) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {

      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token?.name && session.user) {
         session.user.name = token.name as string;
      }
       if (token?.email && session.user) {
         session.user.email = token.email as string;
       }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };