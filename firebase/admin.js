// firebase/admin.js
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Pega o caminho da variável de ambiente
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('🔑 Caminho da chave (do .env):', serviceAccountPath);

if (!serviceAccountPath) {
  console.error('❌ ERRO: GOOGLE_APPLICATION_CREDENTIALS não definida no .env');
  process.exit(1);
}

// Resolve o caminho absoluto
const absolutePath = path.resolve(__dirname, '..', serviceAccountPath);
console.log('📁 Caminho absoluto:', absolutePath);

try {
  // Verifica se o arquivo existe
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo não encontrado: ${absolutePath}`);
  }

  // Carrega a chave
  const serviceAccount = require(absolutePath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: 'requerimentoscidadao.firebasestorage.app',
  });

  console.log('✅ Firebase inicializado com projeto:', serviceAccount.project_id);
  
} catch (error) {
  console.error('❌ ERRO AO INICIALIZAR FIREBASE:');
  console.error(error.message);
  process.exit(1);
}

const db = admin.firestore();
module.exports = { admin, db };