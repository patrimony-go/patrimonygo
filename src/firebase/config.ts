// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyAddCDASDFnZJK80MrTFscuYc17EyZ1Z3Y",
    authDomain: "patrimonygo-9c977.firebaseapp.com",
    projectId: "patrimonygo-9c977",
    storageBucket: "patrimonygo-9c977.firebasestorage.app",
    messagingSenderId: "314603793335",
    appId: "1:314603793335:web:a34c56a18985c2c98c9632",
    measurementId: "G-RJMVEW9F5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);
const firestore = getFirestore(app);



export { auth, firestore, storage };