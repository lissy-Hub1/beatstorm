// Importación de funciones necesarias desde los módulos de Firebase
// `initializeApp` se utiliza para inicializar la aplicación de Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
// Se importan las funciones de Firestore que permiten interactuar con la base de datos
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Configuración de Firebase, contiene las credenciales necesarias para conectar la app con Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1wZzK2kZFQxxNWLjmTp3usOLVF87Rs7c", // Clave API para autenticar la aplicación
    authDomain: "beatstorm-c1dd2.firebaseapp.com", // Dominio de autenticación de Firebase
    projectId: "beatstorm-c1dd2", // ID del proyecto de Firebase
    storageBucket: "beatstorm-c1dd2.appspot.com", // Bucket de almacenamiento de Firebase
    messagingSenderId: "665686742727", // ID del emisor de mensajes de Firebase
    appId: "1:665686742727:web:fc85d54f306687741a10e2", // ID de la aplicación de Firebase
    measurementId: "G-LX95391FPK" // ID para medición de eventos de Firebase Analytics
};


// Inicializa la aplicación de Firebase con la configuración proporcionada
const app = initializeApp(firebaseConfig);
// Obtiene la instancia de Firestore de la aplicación Firebase
const db = getFirestore(app);

// Exportar los elementos necesarios
export { db, collection, query, where, getDocs, updateDoc, doc, setDoc ,getDoc};