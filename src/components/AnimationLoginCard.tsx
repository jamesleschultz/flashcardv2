// src/components/AnimatedLoginCard.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Removed AnimatePresence - not needed here
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, RotateCcwSquare, Milestone } from 'lucide-react';

interface AnimatedLoginCardProps {
  onSignInClick: () => Promise<void>;
}

export default function AnimatedLoginCard({ onSignInClick }: AnimatedLoginCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await onSignInClick();
    } catch (error) {
      console.error("Sign-in failed from card component:", error);
      setIsSigningIn(false);
    }
  };

  return (
    // 1. Perspective Container (MUST have perspective property)
    <div className="w-[300px] h-[400px] perspective"> {/* Explicit width/height */}

      {/* 2. Rotating Container (MUST have transform-style: preserve-3d) */}
      <motion.div
        className="relative w-full h-full transform-style-3d" // Relative positioning for children
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* 3. Front Face (MUST have absolute positioning & backface-hidden) */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full backface-hidden" // Positioned absolutely
          style={{ rotateY: 0 }} // Ensure correct initial state if needed
        >
          <Card className="flex flex-col items-center justify-center w-full h-full text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40">
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <Milestone className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-semibold text-card-foreground">Welcome!</h2>
              <p className="text-muted-foreground">Ready to learn?</p>
              <Button onClick={handleFlip} variant="outline" className="mt-4">
                <RotateCcwSquare className="mr-2 h-4 w-4" /> Reveal Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Back Face (MUST have absolute positioning & backface-hidden) */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full backface-hidden" // Positioned absolutely
          style={{ rotateY: 180 }} // Rotated 180 degrees initially
        >
          <Card className="flex flex-col items-center justify-center w-full h-full text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40">
            <CardContent className="flex flex-col items-center justify-center gap-6">
               <LogIn className="w-12 h-12 text-green-600 dark:text-green-400" />
               <p className="text-lg font-medium text-card-foreground">Sign in</p>
               <Button onClick={handleSignIn} disabled={isSigningIn} className="w-full">
                 {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
               </Button>
               <Button onClick={handleFlip} variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground">Flip Back</Button>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div> {/* End Rotating Container */}
    </div> // End Perspective Container
  );
}