// src/components/AnimatedLoginCard.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Import Loader2 icon for spinning animation
import { LogIn, RotateCcwSquare, Milestone, Loader2 } from 'lucide-react';

export interface AnimatedLoginCardProps {
  onSignInClick: () => Promise<void>;
  // Removed isSigningIn from props, manage internally for indicator logic
  // isSigningIn: boolean;
}

// Removed isSigningIn from destructured props
export default function AnimatedLoginCard({ onSignInClick }: AnimatedLoginCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  // Keep isSigningIn state internal to this component
  const [isSigningIn, setIsSigningIn] = useState(false);
  // State for potential errors shown on the card itself
  const [signInError, setSignInError] = useState<string | null>(null);


  const handleFlip = () => {
     // Don't allow flipping while signing in
     if (!isSigningIn) {
         setIsFlipped(!isFlipped);
         setSignInError(null); // Clear error when flipping
     }
  };

  const handleSignIn = async () => {
    if (isSigningIn) return; // Prevent double clicks

    setIsSigningIn(true);
    setSignInError(null); // Clear previous errors
    try {
      await onSignInClick();
      // If onSignInClick is successful, navigation should happen in the parent.
      // We might not even reach the line below if navigation is fast.
      // setIsSigningIn(false); // Not strictly needed if navigating away
    } catch (error: unknown) {
      console.error("Sign-in failed from card component:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during sign in.";
      // Set error state to display on the card
      setSignInError(message.includes('popup-closed-by-user') ? 'Sign-in cancelled.' : message);
      setIsSigningIn(false); // Re-enable button on failure
    }
  };

  return (
    <div className="w-[300px] h-[400px] perspective">
      <motion.div
        className="relative w-full h-full transform-style-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* --- Front Face --- */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full backface-hidden"
          style={{ rotateY: 0 }}
        >
          {/* Card content remains the same */}
          <Card className="flex flex-col items-center justify-center w-full h-full text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40">
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <Milestone className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-semibold text-card-foreground">Welcome!</h2>
              <p className="text-muted-foreground">Ready to learn?</p>
              <Button onClick={handleFlip} variant="outline" className="mt-4" disabled={isSigningIn}>
                <RotateCcwSquare className="mr-2 h-4 w-4" /> Reveal Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* --- Back Face --- */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full backface-hidden"
          style={{ rotateY: 180 }}
        >
          {/* Use relative positioning here to allow absolute positioning of the overlay */}
          <Card className="relative flex flex-col items-center justify-center w-full h-full text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 overflow-hidden">
            {/* Main Content of the Back Face */}
            <CardContent className="flex flex-col items-center justify-center gap-6 z-10"> {/* Ensure content is above overlay */}
               <LogIn className="w-12 h-12 text-green-600 dark:text-green-400" />
               <p className="text-lg font-medium text-card-foreground">Sign in</p>
               <Button onClick={handleSignIn} disabled={isSigningIn} className="w-full">
                 {/* Show only icon when signing in */}
                 {isSigningIn ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                 ) : (
                    'Sign in with Google'
                 )}
               </Button>
               {/* Display error message if sign-in failed */}
               {signInError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{signInError}</p>}
               <Button onClick={handleFlip} variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" disabled={isSigningIn}>
                   Flip Back
                </Button>
            </CardContent>

            {/* --- Loading/Signing In Overlay --- */}
            {/* This overlay appears on top when isSigningIn is true */}
            {isSigningIn && (
                 <motion.div
                    key="signin-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    // Absolute positioning to cover the card content, slightly transparent background
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm font-medium text-foreground">Signing in...</p>
                 </motion.div>
            )}
             {/* --- End Loading Overlay --- */}

          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}