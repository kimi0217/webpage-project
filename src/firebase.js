// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSlcZRm_RnlM5IEgT4H2yt-oLy5gvSZRk",
  authDomain: "test0603-b3739.firebaseapp.com",
  projectId: "test0603-b3739",
  storageBucket: "test0603-b3739.firebasestorage.app",
  messagingSenderId: "458546302264",
  appId: "1:458546302264:web:b5620becfa2138285a05cd",
  measurementId: "G-4GVY3GWPJC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };