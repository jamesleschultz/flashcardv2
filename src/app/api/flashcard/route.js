import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

//TODO: add userID to each flashcard when creating it

export async function POST(request) {
    try {
        const { question, answer, deckId, userId } = await request.json();
        console.log(request.json())
        // Check if the request is coming from an authenticated user
        console.log(userId);
        if (!userId) {
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        // Validate input
        if (!question || !answer || !deckId) {
          return NextResponse.json({ message: 'Question, answer and deckId are required' }, { status: 400 });
        }
    
        // Create the flashcard in the database
        const newFlashcard = await prisma.flashcard.create({
          data: {
            question,
            answer,
            deckId,
            userId,
            createdAt: new Date(), // Ensure createdAt is set
            updatedAt: new Date(), // Ensure updatedAt is set
          },
        });
    
        // Trigger revalidation or notify clients
        return NextResponse.json({ 
          message: 'Flashcard created successfully', 
          flashcard: newFlashcard 
        }, { status: 201 });
      } catch (error) {
        console.error("Error creating flashcard:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }
    }

    export async function GET(request) {
        try {
            // Extract the deckId from the query parameters
            const { searchParams } = new URL(request.url);
            console.log(searchParams);
            const deckId = searchParams.get('deckId');
            console.log(deckId);
    
            // Validate the deckId
            if (!deckId) {
                return NextResponse.json(
                    { message: 'deckId is required' },
                    { status: 400 }
                );
            }
    
            // Fetch flashcards associated with the given deckId
            const flashcards = await prisma.flashcard.findMany({
                where: { deckId },
            });
    
            // If no flashcards are found, return a 404 response
            if (!flashcards || flashcards.length === 0) {
                return NextResponse.json(
                    { message: 'No flashcards found for this deck.' },
                    { status: 404 }
                );
            }
    
            // Return the flashcards
            return NextResponse.json(flashcards, { status: 200 });
        } catch (error) {
            console.error('Error fetching flashcards:', error);
    
            // Return a meaningful error response
            return NextResponse.json(
                { message: 'Failed to fetch flashcards. Please try again later.' },
                { status: 500 }
            );
        }
    }


    export async function PUT(request) {
        try {
          const { flashcardId, question, answer, userId } = await request.json();
      
          // Validate input
          if (!flashcardId || !userId) {
            return NextResponse.json({ message: 'Flashcard ID and userId are required' }, { status: 400 });
          }
      
          // Check ownership
          const flashcard = await prisma.flashcard.findUnique({
            where: { id: flashcardId },
          });
      
          if (!flashcard) {
            return NextResponse.json({ message: 'Flashcard not found' }, { status: 404 });
          }
      
          if (flashcard.userId !== userId) {
            return NextResponse.json({ message: 'Forbidden: You do not own this flashcard.' }, { status: 403 });
          }
      
          // Update the flashcard
          const updatedFlashcard = await prisma.flashcard.update({
            where: { id: flashcardId },
            data: {
              question: question || flashcard.question,
              answer: answer || flashcard.answer,
              updatedAt: new Date(),
            },
          });
      
          return NextResponse.json({
            message: 'Flashcard updated successfully',
            flashcard: updatedFlashcard,
          }, { status: 200 });
        } catch (error) {
          console.error("Error updating flashcard:", error);
          return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        }
      }
