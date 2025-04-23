import { PrismaClient } from '@prisma/client';

// Declare global type for Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use 'let' for prismaInstance if you reassign, or 'const' if initialization logic guarantees assignment
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
      // Optional: Add production-specific logging/options
      // log: ['error'],
  });
} else {
  // Check if the instance already exists on the global object
  if (!global.prisma) {
    console.log("Development: Creating new Prisma Client instance."); // Add log
    global.prisma = new PrismaClient({
        // Optional: Add development-specific logging
         log: ['query', 'info', 'warn', 'error'],
    });
  } else {
       console.log("Development: Reusing existing Prisma Client instance."); // Add log
  }
  // Assign the global instance to the exported variable
  prisma = global.prisma;
}

// Export the initialized instance
export default prisma;