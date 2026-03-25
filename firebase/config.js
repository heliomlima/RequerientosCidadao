// Imports
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAgfiHAMahonNoNtjxBgEXoxVEjnsB8NRw",
  authDomain: "requerimentoscidadao.firebaseapp.com",
  projectId: "requerimentoscidadao",
  storageBucket: "requerimentoscidadao.firebasestorage.app",
  messagingSenderId: "1063452675687",
  appId: "1:1063452675687:web:15a0684361abb30df60ec2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };