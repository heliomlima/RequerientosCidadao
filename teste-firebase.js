// teste-firebase.js
console.log('🚀 Testando conexão com Firebase...');
console.log('Carregando dotenv...');
require('dotenv').config();

console.log('GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS);

console.log('Importando firebase/admin...');
const { db } = require('./firebase/admin');

console.log('✅ Firebase importado! Tentando listar coleções...');

async function testar() {
    try {
        // Tentar listar coleções
        const collections = await db.listCollections();
        console.log('✅ Conectado! Coleções encontradas:', collections.length);
        
        if (collections.length > 0) {
            console.log('📁 Coleções:');
            collections.forEach(col => console.log('  -', col.id));
        } else {
            console.log('📁 Nenhuma coleção encontrada (banco vazio)');
        }
        
        // Tentar criar um documento de teste
        console.log('\n📝 Tentando criar documento de teste...');
        const testRef = db.collection('teste_conexao').doc('teste');
        await testRef.set({
            mensagem: 'Conexão funcionando!',
            timestamp: new Date().toISOString()
        });
        console.log('✅ Documento de teste criado com sucesso!');
        
        // Ler o documento
        const doc = await testRef.get();
        console.log('📄 Documento lido:', doc.data());
        
        // Apagar documento de teste
        await testRef.delete();
        console.log('✅ Documento de teste apagado');
        
    } catch (error) {
        console.error('❌ ERRO:');
        console.error('Código:', error.code);
        console.error('Mensagem:', error.message);
        if (error.details) console.error('Detalhes:', error.details);
    }
}

testar();