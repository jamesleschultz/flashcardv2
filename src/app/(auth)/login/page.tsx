// pages/login.js or app/login/page.jsx (or similar)

"use client"; // <--- ADD THIS AT THE VERY TOP

import React from 'react'; // Import React if using JSX
import { provider, auth } from "@/config/firebase-config"; // Assuming this path is correct
import { signInWithPopup } from "firebase/auth";
import { useRouter } from 'next/navigation'; // <--- CHANGE THIS IMPORT

export default function Login () { // Remove async unless you explicitly need it for something *else* inside
    const router = useRouter(); // This now uses the hook from next/navigation

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
            // Successful sign-in, now navigate
            console.log("Sign-in successful, navigating to dashboard...");
            router.push('/dashboard'); // Navigate to the dashboard page (or wherever you want)
        } catch (error) {
            console.error("Error signing in with popup:", error);
            // Handle login errors (e.g., show a message to the user)
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

// Make sure you have a corresponding page for the route you're pushing to,
// e.g., app/dashboard/page.jsx or pages/dashboard.js