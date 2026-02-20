// teste-controller.js
const { db } = require('./firebase/admin');
require('dotenv').config();

const USUARIO_ID = 'usuario1';

async function testarController() {
    console.log('🔍 Testando a lógica do controller...');
    
    try {
        // 1. Tentar listar TODOS os documentos da coleção (sem filtro)
        console.log('\n1. Listando TODOS os requerimentos (sem filtro):');
        const todosSnapshot = await db.collection('requerimentos').limit(5).get();
        console.log('Total encontrado:', todosSnapshot.size);
        
        todosSnapshot.forEach(doc => {
            console.log('  -', doc.id, '->', doc.data().protocolo || 'sem protocolo');
        });
        
        // 2. Tentar com filtro do usuário
        console.log('\n2. Listando requerimentos do usuário', USUARIO_ID);
        const userSnapshot = await db.collection('requerimentos')
            .where('usuarioId', '==', USUARIO_ID)
            .limit(5)
            .get();
        console.log('Encontrados:', userSnapshot.size);
        
        // 3. Se não encontrou, vamos CRIAR um documento de exemplo
        if (userSnapshot.size === 0) {
            console.log('\n3. Nenhum requerimento encontrado. Criando exemplo...');
            
            const exemplo = {
                usuarioId: USUARIO_ID,
                protocolo: `2024/${Math.floor(Math.random() * 10000)}`,
                descricao: 'Requerimento de teste',
                endereco: 'Centro - Rua Teste, 123',
                categoria: 'Teste',
                status: 'aguardando',
                dataCadastro: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString(),
                fotos: [],
                fotosCount: 0,
                respostas: []
            };
            
            const docRef = await db.collection('requerimentos').add(exemplo);
            console.log('✅ Documento criado com ID:', docRef.id);
            
            // Verificar se foi criado
            const novoDoc = await docRef.get();
            console.log('📄 Dados:', novoDoc.data());
        }
        
    } catch (error) {
        console.error('❌ ERRO NO CONTROLLER:');
        console.error('Código:', error.code);
        console.error('Mensagem:', error.message);
    }
}

testarController();