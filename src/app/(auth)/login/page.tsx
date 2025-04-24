"use client";

import React, { useState } from 'react';
import { provider, auth } from "@/config/firebase-config"; 
import { signInWithPopup } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AnimatedLoginCard from '@/components/AnimationLoginCard';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        try {
            // Sign in with Firebase
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Get Firebase ID token
            const idToken = await user.getIdToken();

            // Sign in with NextAuth using credentials provider
            const nextAuthResponse = await signIn('credentials', {
                idToken,
                redirect: false,
            });

            if (nextAuthResponse?.ok && !nextAuthResponse.error) {
                // Redirect to dashboard on successful login
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(nextAuthResponse?.error || "NextAuth sign-in failed.");
                setIsSigningIn(false);
            }
        } catch (error) {
            console.error("Error signing in:", error);
            let message = "An unknown error occurred.";
            if (error instanceof Error) {
                message = error.message;
            }
            setError(`Login failed: ${message}`);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <AnimatedLoginCard onSignInClick={handleSignIn} isSigningIn={isSigningIn} />
            {error && (
                <p className="mt-4 text-center text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}