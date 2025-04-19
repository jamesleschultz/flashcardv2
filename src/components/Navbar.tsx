import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '@/config/firebase-config';
import { Button } from "./ui/button";
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { signOut } from 'firebase/auth';

export default function Navbar() {
    const [authUser, authLoading, authError] = useAuthState(auth);
    const router = useRouter();
    const pathname = usePathname(); // Get the current route

    // Determine button text and navigation based on the current route
    const isOnPDFUploader = pathname === '/pdf-uploader';
    const buttonText = isOnPDFUploader ? 'Dashboard' : 'PDF Uploader';
    const handleNavigation = () => {
        router.push(isOnPDFUploader ? '/dashboard' : '/pdf-uploader');
    };

    const handleSignOut = () => {
        signOut(auth).catch((error) => {
            console.error("Sign out error:", error);
        });
        router.push('/');
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex justify-between mb-6"> {/* Header section */}
                <h1 className="text-3xl font-bold">TabTutor</h1>
                <div className='flex justify-end'>
                    <Button className='mr-4' onClick={handleNavigation}>{buttonText}</Button>
                    {authUser && (
                        <div className="flex items-center gap-4">
                            <span>Welcome, {authUser.displayName || authUser.email}!</span>
                            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}