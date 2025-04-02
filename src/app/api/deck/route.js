import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, description, userId } = await request.json();

    // Validate input
    if (!name || !userId) {
      return NextResponse.json({ message: 'Name and userId are required' }, { status: 400 });
    }

    // Create the deck in the database
    const newDeck = await prisma.deck.create({
      data: {
        name,
        description: description || null, // Optional field
        userId,
        createdAt: new Date(), // Ensure createdAt is set
        updatedAt: new Date(), // Ensure updatedAt is set
      },
    });

    return NextResponse.json({ message: 'Deck created successfully', deck: newDeck }, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
