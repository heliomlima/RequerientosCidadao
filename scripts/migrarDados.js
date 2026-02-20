const fs = require('fs');
const path = require('path');
const { db } = require('../firebase/admin');

async function migrarDados() {
  console.log('🚀 Iniciando migração de dados para Firebase...');
  
  try {
    // 1. Ler o arquivo JSON existente
    const dadosPath = path.join(__dirname, '../data/requerimentos.json');
    const dadosJSON = fs.readFileSync(dadosPath, 'utf8');
    const requerimentos = JSON.parse(dadosJSON);
    
    console.log(`📊 Encontrados ${requerimentos.length} requerimentos para migrar`);
    
    // 2. Criar usuário padrão no Firestore
    const usuarioRef = db.collection('usuarios').doc('usuario1');
    await usuarioRef.set({
      nome: 'Hélio Lima',
      email: 'heliomlima@gmail.com',
      desde: '2026',
      dataCriacao: new Date().toISOString()
    });
    
    console.log('✅ Usuário criado com ID: usuario1');
    
    // 3. Migrar cada requerimento
    let migrados = 0;
    for (const req of requerimentos) {
      // Adaptar o formato do JSON para o Firestore
      const requerimentoFirestore = {
        protocolo: req.protocolo,
        usuarioId: 'usuario1', // Vincular ao usuário que criamos
        descricao: req.descricao,
        endereco: req.endereco || 'Não informado',
        categoria: req.categoria || 'Outros',
        status: req.status || 'aguardando',
        dataCadastro: req.dataCadastro || new Date().toISOString(),
        dataAtualizacao: req.dataAtualizacao || new Date().toISOString(),
        fotosCount: req.fotos ? req.fotos.length : 0,
        fotos: req.fotos || [],
        respostas: req.respostas || []
      };
      
      // Adicionar ao Firestore
      const docRef = await db.collection('requerimentos').add(requerimentoFirestore);
      migrados++;
      
      console.log(`  ✅ Requerimento ${req.protocolo} migrado -> ID: ${docRef.id}`);
    }
    
    console.log(`\n🎉 Migração concluída! ${migrados} requerimentos migrados com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
  }
}

// Executar migração
migrarDados();