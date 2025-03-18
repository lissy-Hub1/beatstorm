
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1wZzK2kZFQxxNWLjmTp3usOLVF87Rs7c",
    authDomain: "beatstorm-c1dd2.firebaseapp.com",
    projectId: "beatstorm-c1dd2",
    storageBucket: "beatstorm-c1dd2.appspot.com",
    messagingSenderId: "665686742727",
    appId: "1:665686742727:web:fc85d54f306687741a10e2",
    measurementId: "G-LX95391FPK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar los elementos necesarios
export { db, collection, query, where, getDocs, updateDoc, doc, setDoc ,getDoc};