// Example: In your ProtectedRoute component (or similar)
// app/(protected)/ProtectedRoute.jsx (adjust path)

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config'; // Your client-side Firebase auth instance
import { Skeleton } from "@/components/ui/skeleton"
import Navbar from '@/components/Navbar';

function ProtectedRoute({ children }: any) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false); // Prevent multiple syncs per session/load

  useEffect(() => {
    // This function attempts to sync the user data with your backend DB
    const syncUserData = async () => {
      // Only proceed if:
      // - We have a user object from Firebase
      // - Auth state is not loading
      // - We are not already in the process of syncing
      // - We haven't already tried syncing in this component lifecycle/session
      if (user && !loading && !isSyncing && !hasSynced) {
        console.log("ProtectedRoute (Simplified): User detected, attempting sync:", user.uid);
        setIsSyncing(true);
        setHasSynced(true); // Mark that we are attempting/have attempted sync

        // Prepare the data payload directly from the user object
        const userDataPayload = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          avatarUrl: user.photoURL, // Make sure field name matches API expectation
        };
        console.log("ProtectedRoute (Simplified): Sending payload:", userDataPayload);

        try {
          // Call your simplified API route
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              // No Authorization header needed in this simplified version
              'Content-Type': 'application/json',
            },
            // Send the user data in the request body
            body: JSON.stringify(userDataPayload),
          });
          
          console.log(`ProtectedRoute (Simplified): API Response Status: ${response.status}`);
          const data = await response.json();
          console.log("ProtectedRoute (Simplified): API Response Data:", data);

          if (!response.ok) {
            console.error('ProtectedRoute (Simplified): User sync API call failed:', data.message || 'Unknown error');
            // Consider how to handle failure - maybe allow retry?
            // setHasSynced(false); // Uncomment to allow retry on next interaction/reload
          } else {
            console.log("ProtectedRoute (Simplified): User sync successful or user already exists.");
          }

        } catch (error) {
          console.error('ProtectedRoute (Simplified): Error during user sync fetch:', error);
          // Consider how to handle fetch errors (network issues etc)
          // setHasSynced(false); // Uncomment to allow retry
        } finally {
          setIsSyncing(false); // Mark sync attempt as finished
        }
      }
    };

    syncUserData(); // Execute the sync logic

    // --- Redirect logic (remains the same) ---
    if (!loading && !user && !isSyncing) {
      console.log("ProtectedRoute (Simplified): No user found, redirecting to /login");
      router.push('/login'); // Adjust path if needed
    }
    // --- Handle Auth errors (remains the same) ---
    if (error) {
      console.error("ProtectedRoute (Simplified): Firebase Auth hook error:", error);
      router.push('/login');
    }

  }, [user, loading, error, router, isSyncing, hasSynced]); // Dependencies

  // --- Rendering logic (remains mostly the same) ---
  if (loading || isSyncing) {
    return(
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8">
      {/* Optional: Constrain width and center */}
      <div className="container mx-auto max-w-6xl">
       {/* Top Bar / Header Skeleton */}
       <Skeleton className="h-16 w-full rounded-lg mb-8" />

       {/* Main layout (e.g., content + sidebar) */}
       <div className="flex flex-col md:flex-row gap-8">

         {/* Main Content Area Skeleton */}
         <div className="flex-grow flex flex-col space-y-5">
           <Skeleton className="h-40 w-full rounded-xl" /> {/* Main feature block */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-11/12 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-5/6 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
           </div>
            <Skeleton className="h-20 w-full rounded-xl" /> {/* Another block */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-11/12 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
           </div>
         </div>

         {/* Sidebar Skeleton (only shows beside on md+) */}
         <div className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0 flex flex-col space-y-5">
           <Skeleton className="h-28 w-full rounded-xl" />
            <div className="space-y-3">
               <Skeleton className="h-5 w-full rounded-md" />
               <Skeleton className="h-5 w-5/6 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="space-y-3">
               <Skeleton className="h-5 w-full rounded-md" />
            </div>
         </div>

       </div>
     </div>
   </div>
    )  // Updated loading text slightly
  }

  if (user) {
    // Render children only if user exists AND loading/syncing is complete
    return <>
    <Navbar />  
    {children}
    </>;
  }

  // Fallback rendering while redirecting or if auth errored
  return (
  <div>Redirecting...</div>
  ) // Or null
}

export default ProtectedRoute;

// Remember to wrap your protected routes/layout with this ProtectedRoute component.