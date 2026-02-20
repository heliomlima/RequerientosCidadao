import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc 
} from "firebase/firestore";
import { db } from "./config.js";

const REQUERIMENTOS_COLLECTION = "requerimentos";

// Listar requerimentos do usuário
export const listarRequerimentos = async (usuarioId) => {
  try {
    const q = query(
      collection(db, REQUERIMENTOS_COLLECTION),
      where("usuarioId", "==", usuarioId),
      orderBy("dataCadastro", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const requerimentos = [];
    querySnapshot.forEach((doc) => {
      requerimentos.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: requerimentos };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Criar requerimento
export const criarRequerimento = async (dados) => {
  try {
    const protocolo = `${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`;
    
    const novoRequerimento = {
      ...dados,
      protocolo,
      status: "aguardando",
      dataCadastro: new Date().toISOString(),
      respostas: [],
      fotosCount: 0
    };
    
    const docRef = await addDoc(collection(db, REQUERIMENTOS_COLLECTION), novoRequerimento);
    
    return { success: true, id: docRef.id, data: { ...novoRequerimento, id: docRef.id } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Buscar por ID
export const buscarRequerimento = async (id) => {
  try {
    const docRef = doc(db, REQUERIMENTOS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Requerimento não encontrado" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};