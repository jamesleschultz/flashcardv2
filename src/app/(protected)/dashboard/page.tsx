"use client"

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import Login from '@/app/(auth)/login/page';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export default function Dashboard (){

    const [user, loading, error] = useAuthState(auth)
    console.log('Current user:', user);

    const handleSignOut = () => {
        signOut(auth).catch((error) => {
          console.error("Sign out error:", error);
        });
      };
    
      const router = useRouter();

      const handleRoute = () => {
          router.push('/deckpage')
      }
  

    return (
        <div>
            <h1>Dashboard</h1>
            <div>
            {user ? (
            <>
                <p>Welcome, {user.displayName || user.email}!</p>
                <p>User ID: {user.uid}</p>
                <button onClick={handleSignOut}>Sign Out</button>
            </>
            ) : (
            <div>
                <p>You are not signed in.</p>
                <Login />
            </div>
            )}
        </div>
        <button onClick={handleRoute}>To deckpage</button>
      </div>
    )
}