// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByJ2BXrRrhA6TXJeEzd5Lpwj2-ShkViK4",
  authDomain: "flashcardv2-1fb9b.firebaseapp.com",
  projectId: "flashcardv2-1fb9b",
  storageBucket: "flashcardv2-1fb9b.firebasestorage.app",
  messagingSenderId: "775212625170",
  appId: "1:775212625170:web:d1b666eff9da3b032217cb",
  measurementId: "G-4CRF8SJWXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()