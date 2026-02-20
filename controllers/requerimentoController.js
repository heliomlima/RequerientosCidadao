
const { db } = require('../firebase/admin');
const USUARIO_ID = 'usuario1';

console.log('🚀 Controller carregado com usuário:', USUARIO_ID);

// Listar requerimentos do usuário logado
exports.listarPorUsuario = async (req, res) => {
    console.log('📋 listarPorUsuario foi chamada');
    
    try {
        // 1. Buscar dados do usuário no Firestore
        console.log('🔍 Buscando usuário:', USUARIO_ID);
        const userDoc = await db.collection('Usuarios').doc(USUARIO_ID).get();
        
        let userData;
        if (!userDoc.exists) {
            console.log('⚠️ Usuário não encontrado no Firestore, usando fallback');
            userData = {
                nome: "Hélio Lima",
                email: "heliomlima@yahoo.com",
                desde: "2025"
            };
        } else {
            userData = userDoc.data();
            console.log('✅ Usuário encontrado:', userData.email);
        }
        
        // 2. Buscar requerimentos do usuário
        console.log('🔍 Buscando requerimentos...');
        const snapshot = await db.collection('requerimentos')
            .where('usuarioId', '==', USUARIO_ID)
            .orderBy('dataCadastro', 'desc')
            .get();
        
        console.log('📊 Requerimentos encontrados:', snapshot.size);
        
        const requerimentos = [];
        snapshot.forEach(doc => {
            requerimentos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // 3. Retornar resposta
        res.json({
            success: true,
            user: {
                id: USUARIO_ID,
                nome: userData.nome,
                email: userData.email,
                desde: userData.desde
            },
            count: requerimentos.length,
            data: requerimentos
        });
        
    } catch (error) {
        console.error('❌ Erro em listarPorUsuario:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar requerimentos',
            error: error.message
        });
    }
};

// Buscar requerimento por ID
exports.buscarPorId = async (req, res) => {
    console.log('🔍 buscarPorId chamada com ID:', req.params.id);
    
    try {
        const doc = await db.collection('requerimentos').doc(req.params.id).get();
        
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Requerimento não encontrado'
            });
        }

        const requerimento = { id: doc.id, ...doc.data() };

        if (requerimento.usuarioId !== USUARIO_ID) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            data: requerimento
        });
        
    } catch (error) {
        console.error('❌ Erro em buscarPorId:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar requerimento',
            error: error.message
        });
    }
};

// Criar novo requerimento
exports.criar = async (req, res) => {
    console.log('➕ criar foi chamada');
    
    try {
        const { descricao, endereco, categoria } = req.body;
        
        const protocolo = `${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`;
        
        const novoRequerimento = {
            usuarioId: USUARIO_ID,
            protocolo,
            descricao,
            endereco: endereco || 'Não informado',
            categoria: categoria || 'Outros',
            status: 'aguardando',
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            fotos: [],
            fotosCount: 0,
            respostas: []
        };
        
        const docRef = await db.collection('requerimentos').add(novoRequerimento);
        console.log('✅ Requerimento criado com ID:', docRef.id);
        
        res.status(201).json({
            success: true,
            message: 'Requerimento criado com sucesso',
            data: { id: docRef.id, ...novoRequerimento }
        });
        
    } catch (error) {
        console.error('❌ Erro em criar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar requerimento',
            error: error.message
        });
    }
};

// Atualizar requerimento
exports.atualizar = async (req, res) => {
    console.log('✏️ atualizar chamada com ID:', req.params.id);
    
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        const docRef = db.collection('requerimentos').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Requerimento não encontrado'
            });
        }

        if (doc.data().usuarioId !== USUARIO_ID) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await docRef.update({
            ...dadosAtualizados,
            dataAtualizacao: new Date().toISOString()
        });

        const updated = await docRef.get();

        res.json({
            success: true,
            message: 'Requerimento atualizado com sucesso',
            data: { id: updated.id, ...updated.data() }
        });
        
    } catch (error) {
        console.error('❌ Erro em atualizar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar requerimento',
            error: error.message
        });
    }
};

// Deletar requerimento
exports.deletar = async (req, res) => {
    console.log('🗑️ deletar chamada com ID:', req.params.id);
    
    try {
        const { id } = req.params;

        const docRef = db.collection('requerimentos').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Requerimento não encontrado'
            });
        }

        if (doc.data().usuarioId !== USUARIO_ID) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await docRef.delete();

        res.json({
            success: true,
            message: 'Requerimento deletado com sucesso'
        });
        
    } catch (error) {
        console.error('❌ Erro em deletar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar requerimento',
            error: error.message
        });
    }
};

// Adicionar resposta
exports.adicionarResposta = async (req, res) => {
    console.log('💬 adicionarResposta chamada para ID:', req.params.id);
    
    try {
        const { id } = req.params;
        const { resposta, status } = req.body;

        const docRef = db.collection('requerimentos').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Requerimento não encontrado'
            });
        }

        if (doc.data().usuarioId !== USUARIO_ID) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const novaResposta = {
            id: Date.now().toString(),
            texto: resposta,
            data: new Date().toISOString()
        };

        const respostas = [...(doc.data().respostas || []), novaResposta];
        
        await docRef.update({
            respostas,
            status: status || doc.data().status,
            dataAtualizacao: new Date().toISOString()
        });

        const updated = await docRef.get();

        res.json({
            success: true,
            message: 'Resposta adicionada com sucesso',
            data: { id: updated.id, ...updated.data() }
        });
        
    } catch (error) {
        console.error('❌ Erro em adicionarResposta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao adicionar resposta',
            error: error.message
        });
    }
};

console.log('✅ Controller carregado com sucesso!');
console.log('📦 Funções exportadas:', Object.keys(exports));