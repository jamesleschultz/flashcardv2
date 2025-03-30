import { provider, auth } from "@/config/firebase-config"
import { signInWithPopup } from "firebase/auth"

export default async function Login () {

    const signInWithGoogle = async () => {
        const result = await signInWithPopup(auth, provider)
        console.log(result)
    }

    return (
    <div>
        <h1>Login</h1>
        <button onClick={signInWithGoogle}>Sign in with google </button>

    </div>
    )
}