// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD79FjlJCNSUYjmtNEnI5HsrLlAqUdVq2M",
    authDomain: "diagramador-5ba3c.firebaseapp.com",
    databaseURL: "https://diagramador-5ba3c-default-rtdb.firebaseio.com",
    projectId: "diagramador-5ba3c",
    storageBucket: "diagramador-5ba3c.appspot.com",
    messagingSenderId: "312319927917",
    appId: "1:312319927917:web:a503f1cc9a8a0be505c164",
    measurementId: "G-KQM7W0LGFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);