// app/api/user/sync/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust import path if needed

export async function POST(request) {
  console.log("API Route /api/user/sync (Simplified) reached"); // Server-side log

  try {
    const userData = await request.json();
    console.log("API Sync (Simplified): Received data from client:", userData);

    // 2. Extract required fields (perform basic validation)
    const { uid, email, name, avatarUrl } = userData;

    if (!uid) {
      console.error("API Sync (Simplified): UID missing in request body");
      return NextResponse.json({ message: 'Missing UID in request body' }, { status: 400 });
    }

    // 3. Check if user exists in *your* database using the provided UID
    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (existingUser) {
      // 4a. User already exists - Nothing to do for creation.
      console.log(`API Sync (Simplified): User ${uid} already exists in DB.`);
      // Optionally, you *could* update fields here based on client data,
      // but remember this data isn't verified.
      return NextResponse.json({ message: 'User already exists', userId: uid }, { status: 200 });

    } else {
      // 4b. User does NOT exist - create the user using client-provided data
      console.log(`API Sync (Simplified): User ${uid} not found in DB. Creating...`);

      // Validate potentially null fields before creation if necessary
      const dataToCreate = {
          id: uid,
          email: email || null, // Use null if email is undefined/null
          name: name || null,
          avatarUrl: avatarUrl || null, // Ensure field name matches schema ('avatar_url')
      };

      const newUser = await prisma.user.create({
        data: dataToCreate,
      });
      console.log(`API Sync (Simplified): Successfully created user ${uid} in DB.`);
      return NextResponse.json({ message: 'User created successfully', userId: newUser.id }, { status: 201 });
    }

  } catch (error) {
    // Handle potential JSON parsing errors or Prisma errors
    console.error("API Sync (Simplified): Internal Server Error:", error);
    // Check if it's a Prisma-specific error for more details if needed
     if (error.code) { // Prisma errors often have codes
         console.error("Prisma Error Code:", error.code);
     }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}