import { PrismaClient } from '@prisma/client';

// Extend the global object type for TypeScript checking
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single Prisma Client instance and attach it to `globalThis` in development
const prismaInstance = globalThis.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Enable logging for debugging
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaInstance;
  console.log("--- Prisma Client instance attached to globalThis ---");
} else {
  console.log("--- Prisma Client instance created for production ---");
}

export default prismaInstance;