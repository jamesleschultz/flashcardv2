import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, description, userId } = await request.json();

    // Check if the request is coming from an authenticated user
    console.log(name, description, userId);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    
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


    // Trigger revalidation or notify clients
    return NextResponse.json({ 
      message: 'Deck created successfully', 
      deck: newDeck 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch decks from the database
    const decks = await prisma.deck.findMany();
    return NextResponse.json(decks, { status: 200 });
  } catch (error) {
    console.error("Error fetching decks:", error);

    // Return a meaningful error response
    return NextResponse.json(
      { message: "Failed to fetch decks. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    // Validate the deckId
    if (!deckId) {
      return NextResponse.json(
        { message: 'deckId is required' },
        { status: 400 }
      );
    }

    // Delete the deck from the database
    await prisma.deck.delete({
      where: { id: deckId },
    });

    return NextResponse.json(
      { message: 'Deck deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { message: 'Failed to delete deck. Please try again later.' },
      { status: 500 }
    );
  }
}
