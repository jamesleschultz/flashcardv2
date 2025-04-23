"use client";

import React, { useState } from 'react';
import { provider, auth } from "@/config/firebase-config"; 
import { signInWithPopup } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        try {

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const idToken = await user.getIdToken();

            const nextAuthResponse = await signIn('credentials', {
                idToken,
                redirect: false,
            });

            if (nextAuthResponse?.ok && !nextAuthResponse.error) {
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(nextAuthResponse?.error || "NextAuth sign-in failed.");
                setIsSigningIn(false);
            }
        } catch (firebaseError: any) {
            setError(`Login failed: ${firebaseError.message}`);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
             <div>
                <h1 className="text-2xl mb-4 text-center">Login</h1>
                <Button onClick={handleSignIn} disabled={isSigningIn}>
                    {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
                </Button>
                {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}