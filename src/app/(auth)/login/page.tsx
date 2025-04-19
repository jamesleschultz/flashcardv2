"use client";

import React from 'react';
import { provider, auth } from "@/config/firebase-config"; 
import { signInWithPopup } from "firebase/auth";
import { useRouter } from 'next/navigation';

export default function Login () { 
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
            console.log("Sign-in successful, navigating to dashboard...");
            router.push('/dashboard');
        } catch (error) {
            console.error("Error signing in with popup:", error);
        }
    };

    return (
        <div>
            <h1 className="text-2xl">Login Page</h1>
            <p>Please sign in to continue.</p>
            <button onClick={handleSignIn}>
                Sign in with Google!
            </button>
        </div>
    );
}
