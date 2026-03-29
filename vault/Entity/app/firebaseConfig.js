// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwGRhv0ZPF3p9FTIAxQpoW87NwLWzV4BY",
  authDomain: "nexasoft-e36e6.firebaseapp.com",
  projectId: "nexasoft-e36e6",
  storageBucket: "nexasoft-e36e6.firebasestorage.app",
  messagingSenderId: "665408021312",
  appId: "1:665408021312:web:fbccde1f752c73ca2b50a5",
  measurementId: "G-HD7WLX7SP2"
};

// Initialize Firebase and FireStore
 export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app);