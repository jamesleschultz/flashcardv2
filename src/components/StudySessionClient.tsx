// src/components/StudySessionClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcwSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';

interface Flashcard { id: string; question: string; answer: string; deckId: string; userId: string; }
interface StudySessionClientProps { initialFlashcards: Flashcard[]; deckId: string; onSessionComplete?: () => void; }

function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) { randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--; [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]]; }
  return newArray;
}


export default function StudySessionClient({ initialFlashcards, deckId, onSessionComplete }: StudySessionClientProps) {
  const shuffledDeck = useMemo(() => shuffleArray(initialFlashcards), [initialFlashcards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  const currentCard = !sessionFinished ? shuffledDeck[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionFinished(false);
  }, [deckId, initialFlashcards]);


  const handleFlip = () => { if (!sessionFinished) setIsFlipped(!isFlipped); };

  const handleNextCard = () => {
    if (currentIndex < shuffledDeck.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionFinished(true);
      if (onSessionComplete) onSessionComplete();
    }
  };

  const totalCards = shuffledDeck.length;
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-6">

      {/* Progress Bar and Counter */}
      {!sessionFinished && totalCards > 0 && (
         <div className="w-full space-y-2">
             <Progress value={progressPercent} className="w-full h-2" />
             <p className="text-sm text-center text-muted-foreground">
                Card {currentIndex + 1} of {totalCards} ({progressPercent}%)
             </p>
         </div>
      )}

      {/* Card Area */}
      <div className="w-full h-[350px] sm:h-[400px] perspective">
          <AnimatePresence initial={false} mode="wait">
            {sessionFinished ? (
                <motion.div key="completion" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.4 }} className="w-full h-full">
                    <Card className="flex flex-col items-center justify-center w-full h-full text-center p-6 border-2 border-green-500 bg-background shadow-lg">
                        <CardContent className="flex flex-col items-center justify-center gap-4">
                             <CheckCircle className="w-16 h-16 text-green-500" />
                             <h2 className="text-2xl font-semibold text-foreground">All Done!</h2>
                             <p className="text-muted-foreground">
                                You&#39ve reviewed all cards in this session.
                             </p>
                        </CardContent>
                     </Card>
                 </motion.div>
            ) : currentCard ? (
                <motion.div key={currentCard.id} className="relative w-full h-full transform-style-3d" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                    {/* Front Face (Question) */}
                    <motion.div className="absolute top-0 left-0 w-full h-full backface-hidden" style={{ rotateY: 0 }}>
                        <Card className="flex flex-col w-full h-full p-6 bg-card border shadow-md text-center overflow-hidden">
                            <CardHeader className="pt-0 px-0 pb-4 items-center"> <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">QUESTION</CardTitle> </CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center px-0 pb-0 overflow-y-auto"> <p className="text-xl md:text-2xl font-semibold text-card-foreground">{currentCard.question}</p> </CardContent>
                        </Card>
                    </motion.div>
                    {/* Back Face (Answer) */}
                    <motion.div className="absolute top-0 left-0 w-full h-full backface-hidden" style={{ rotateY: 180 }}>
                         <Card className="flex flex-col w-full h-full p-6 bg-card border shadow-md text-center overflow-hidden">
                             <CardHeader className="pt-0 px-0 pb-4 items-center"> <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">ANSWER</CardTitle> </CardHeader>
                             <CardContent className="flex-grow flex items-center justify-center px-0 pb-0 overflow-y-auto"> <p className="text-lg md:text-xl text-card-foreground">{currentCard.answer}</p> </CardContent>
                         </Card>
                    </motion.div>
                </motion.div>
             ) : (
                 <p>Loading card...</p>
             )}
          </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {!sessionFinished && currentCard && (
         <div className="flex justify-center items-center w-full space-x-4 pt-4">
              <Button onClick={handleFlip} variant="secondary" className="w-1/3"> <RotateCcwSquare className="mr-2 h-4 w-4" /> {isFlipped ? 'Show Question' : 'Show Answer'} </Button>
              {isFlipped && ( <Button onClick={handleNextCard} variant="default" className="w-1/3"> Next Card <ArrowRight className="ml-2 h-4 w-4" /> </Button> )}
              {!isFlipped && <div className="w-1/3"></div>} {/* Placeholder */}
         </div>
      )}

      {/* Back Button */}
       {sessionFinished && (
           <div className="pt-4">
               <Button asChild variant="outline"> <Link href={`/deck/${deckId}`}>Back to Deck Details</Link> </Button>
           </div>
        )}
    </div>
  );
}