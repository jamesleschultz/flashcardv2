'use client'

import { useRouter } from 'next/navigation';


export default function Deckpage() {
    const router = useRouter();

    const handleRoute = () => {
        router.push('/dashboard')
    }



    return(
        <div>
            <h1>DECK PAGE</h1>
            <button onClick={handleRoute}>To dashboard</button>
        </div>
    )
}