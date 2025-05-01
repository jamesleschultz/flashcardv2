// src/app/(auth)/login/page.tsx
"use client";

import React, { useState } from 'react';
import { provider, auth } from "@/config/firebase-config"; // Ensure correct path
import { signInWithPopup, User } from "firebase/auth"; // Import User type
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Import NextAuth client signIn
import AnimatedLoginCard from '@/components/AnimationLoginCard';

export default function LoginPage() {
    const router = useRouter();
    // State ONLY for displaying errors related to the overall login process
    const [error, setError] = useState<string | null>(null);
    // --- REMOVED isSigningIn state ---
    // const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = async () => {
        // --- REMOVED setIsSigningIn(true) ---
        setError(null); // Clear previous errors on new attempt
        try {
            console.log("Login Page: Attempting Firebase Google sign-in popup...");
            // 1. Sign in with Firebase Popup
            const result = await signInWithPopup(auth, provider);
            const user: User | null = result.user;

            if (!user) {
                throw new Error("Firebase sign-in did not return a user object.");
            }
            console.log("Login Page: Firebase Sign-in successful, user:", user.displayName);

            // 2. Get Firebase ID Token
            const idToken = await user.getIdToken();
             if (!idToken) {
                 throw new Error("Could not retrieve Firebase ID Token from user.");
            }
            console.log("Login Page: Firebase ID Token obtained.");

            // 3. Sign in to NextAuth
            console.log("Login Page: Calling NextAuth signIn with credentials...");
            const nextAuthResponse = await signIn('credentials', {
                idToken,
                redirect: false, // Handle redirect manually
            });
            console.log("Login Page: NextAuth signIn response:", nextAuthResponse);

            // 4. Handle NextAuth Response
            if (nextAuthResponse?.ok && !nextAuthResponse.error) {
                 console.log("Login Page: NextAuth sign-in successful. Redirecting...");
                 router.push('/dashboard');
                 router.refresh();
            } else {
                 throw new Error(nextAuthResponse?.error || "NextAuth sign-in failed.");
            }

        } catch (err: unknown) {
             console.error("Login Page: Error during handleSignIn:", err);
             const message = err instanceof Error ? err.message : "An unknown login error occurred.";
             // Handle specific user-facing errors nicely
             const displayError = message.includes('popup-closed-by-user') || message.includes('cancelled')
                ? 'Sign-in cancelled.'
                : message.includes('auth/network-request-failed')
                ? 'Network error. Please check connection.'
                : `Login failed. Please try again.`; // Generic fallback
             setError(displayError);
             // --- REMOVED setIsSigningIn(false) ---
             // Re-throw so the card knows the promise rejected (optional, depends on card logic)
             // throw err;
        }
    };

    return (
        // Centering container
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
            {/* Wrapper for card and error message */}
            <div className="flex flex-col items-center">
                {/* Render the animated card, passing only the click handler */}
                {/* NO isSigningIn prop needed */}
                <AnimatedLoginCard onSignInClick={handleSignIn} />

                {/* Display overall error message below card */}
                {error && (
                    <p className="mt-4 text-center text-sm font-medium text-destructive">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}