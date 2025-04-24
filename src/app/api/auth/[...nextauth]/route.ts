// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';

// --- Import the centralized authOptions ---
import { authOptions } from '@/lib/authOptions'; // Adjust path if needed

// --- Initialize NextAuth Handler ---
// Pass the imported authOptions to the NextAuth function
const handler = NextAuth(authOptions);

// --- Export the handler for both GET and POST requests ---
// This is the ONLY thing this file should export
export { handler as GET, handler as POST };