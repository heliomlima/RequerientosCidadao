const { admin, db } = require('../firebase/admin');

const bucket = admin.storage().bucket();

exports.listarMeusRequerimentos = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db.collection('Requerimentos')
      .where('userId', '==', uid)
      .orderBy('dataCadastro', 'desc')
      .get();

    const requerimentos = [];

    snapshot.forEach((doc) => {
      requerimentos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao buscar requerimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar requerimentos.',
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db.collection('Requerimentos')
      .where('userId', '==', uid)
      .get();

    let totalRequerimentos = 0;
    let totalEmAnalise = 0;
    let totalRespondidosAvaliados = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = (data.status || '').toLowerCase();

      totalRequerimentos++;

      if (
        [
          'direcionado',
          'distribuído',
          'delegado para análise',
          'em análise',
          'em execução',
          'concluído',
        ].includes(status)
      ) {
        totalEmAnalise++;
      }

      if (['respondido', 'avaliado'].includes(status)) {
        totalRespondidosAvaliados++;
      }
    });

    return res.status(200).json({
      totalRequerimentos,
      totalEmAnalise,
      totalRespondidosAvaliados,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar estatísticas.',
    });
  }
};

exports.criarRequerimento = async (req, res) => {

  console.log('=== criarRequerimento acionado ===');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  console.log('req.user:', req.user);

  try {
    const uid = req.user.uid;

    const {
      categoria,
      descricao,
      endereco = '',
      idUGResponsavel = '',
    } = req.body;

    const fotos = req.files?.fotos || [];
    const documentos = req.files?.documentos || [];

    if (!categoria || !categoria.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Categoria é obrigatória.',
      });
    }

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Descrição é obrigatória.',
      });
    }

    const possuiEndereco = !!endereco.trim();
    const possuiFotos = fotos.length > 0;
    const possuiDocumentos = documentos.length > 0;

    if (!possuiEndereco && !possuiFotos && !possuiDocumentos) {
      return res.status(400).json({
        success: false,
        message: 'Informe pelo menos um entre endereço, fotos ou documentos.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    const anoAtual = new Date().getFullYear();

    const contadorRef = db.collection('Contadores').doc(`requerimentos_${anoAtual}`);

    const numeroSequencial = await db.runTransaction(async (transaction) => {
      const contadorDoc = await transaction.get(contadorRef);

      let sequencial = 1;

      if (contadorDoc.exists) {
        const contadorAtual = contadorDoc.data()?.ultimoNumero || 0;
        sequencial = contadorAtual + 1;
      }

      transaction.set(
        contadorRef,
        {
          ultimoNumero: sequencial,
          ano: anoAtual,
          atualizadoEm: agora,
        },
        { merge: true }
      );

      return sequencial;
    });

    const protocolo = `${anoAtual}/${String(numeroSequencial).padStart(6, '0')}`;

    const status = idUGResponsavel && idUGResponsavel.trim()
      ? 'Direcionado'
      : 'Registrado';

    const fotosUrls = [];
    const documentosUrls = [];

    for (const foto of fotos) {
      const caminhoArquivo = `requerimentos/${uid}/fotos/${Date.now()}-${foto.originalname}`;
      const file = bucket.file(caminhoArquivo);

      await file.save(foto.buffer, {
        resumable: false,
        metadata: {
          contentType: foto.mimetype,
        },
      });

      const [urlAssinada] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      fotosUrls.push({
        nome: foto.originalname,
        tipo: foto.mimetype,
        url: urlAssinada,
        caminhoStorage: caminhoArquivo,
      });
    }

    for (const documento of documentos) {
      const caminhoArquivo = `requerimentos/${uid}/documentos/${Date.now()}-${documento.originalname}`;
      const file = bucket.file(caminhoArquivo);

      await file.save(documento.buffer, {
        resumable: false,
        metadata: {
          contentType: documento.mimetype,
        },
      });

      const [urlAssinada] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      documentosUrls.push({
        nome: documento.originalname,
        tipo: documento.mimetype,
        url: urlAssinada,
        caminhoStorage: caminhoArquivo,
      });
    }

    const novoRequerimento = {
      userId: uid,
      protocolo,
      status,
      dataCadastro: agora,
      dataAtualizacao: agora,
      fotosCount: fotos.length,
      categoria: categoria.trim(),
      descricao: descricao.trim(),
      endereco: endereco.trim(),
      fotos: fotosUrls,
      documentos: documentosUrls,
      idUGResponsavel: idUGResponsavel.trim(),
      resposta: '',
      comentarioAvaliacao: '',
      dataConclusaoPrevista: null,
      dataConclusao: null,
      documentoResposta: null,
      comentarios: [],
    };

    console.log('=== DADOS DO NOVO REQUERIMENTO ===');
    console.log(JSON.stringify(novoRequerimento, null, 2));

    const docRef = await db.collection('Requerimentos').add(novoRequerimento);

    console.log('=== REQUERIMENTO SALVO ===');
    console.log('Coleção: Requerimentos');
    console.log('ID gerado:', docRef.id);
    console.log('Projeto Firestore ativo:', admin.app().options.projectId);

    return res.status(201).json({
      success: true,
      message: 'Requerimento registrado com sucesso.',
      id: docRef.id,
      protocolo,
    });
  } catch (error) {
    console.error('Erro ao criar requerimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao criar requerimento.',
    });
  }
};

exports.adicionarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const comentario = (req.body.comentario || '').trim();

    const fotos = req.files?.fotos || [];
    const documentos = req.files?.documentos || [];

    if (!comentario && fotos.length === 0 && documentos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe um comentário ou anexe arquivos.',
      });
    }

    const reqRef = db.collection('Requerimentos').doc(id);
    const docSnap = await reqRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Requerimento não encontrado.',
      });
    }

    const dados = docSnap.data();

    if (dados.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para comentar este requerimento.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    const novasFotosUrls = [];
    const novosDocumentosUrls = [];

    for (const foto of fotos) {
      const caminhoArquivo = `requerimentos/${uid}/fotos/${Date.now()}-${foto.originalname}`;
      const file = bucket.file(caminhoArquivo);

      await file.save(foto.buffer, {
        resumable: false,
        metadata: {
          contentType: foto.mimetype,
        },
      });

      const [urlAssinada] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      novasFotosUrls.push({
        nome: foto.originalname,
        tipo: foto.mimetype,
        url: urlAssinada,
        caminhoStorage: caminhoArquivo,
      });
    }

    for (const documento of documentos) {
      const caminhoArquivo = `requerimentos/${uid}/documentos/${Date.now()}-${documento.originalname}`;
      const file = bucket.file(caminhoArquivo);

      await file.save(documento.buffer, {
        resumable: false,
        metadata: {
          contentType: documento.mimetype,
        },
      });

      const [urlAssinada] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      novosDocumentosUrls.push({
        nome: documento.originalname,
        tipo: documento.mimetype,
        url: urlAssinada,
        caminhoStorage: caminhoArquivo,
      });
    }

    const novoComentarioObj = {
      texto: comentario,
      data: agora,
      autorId: uid,
      fotos: novasFotosUrls,
      documentos: novosDocumentosUrls,
    };

    await reqRef.update({
      comentarios: admin.firestore.FieldValue.arrayUnion(novoComentarioObj),
      fotos: [...(dados.fotos || []), ...novasFotosUrls],
      documentos: [...(dados.documentos || []), ...novosDocumentosUrls],
      dataAtualizacao: agora,
    });

    return res.status(200).json({
      success: true,
      message: 'Comentário adicionado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao adicionar comentário.',
    });
  }
};

exports.avaliarRequerimento = async (req, res) => {
  try {
    const { id } = req.params;
    const { avaliacao, comentarioAvaliacao = '' } = req.body;
    const uid = req.user.uid;

    const nota = Number(avaliacao);

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({
        success: false,
        message: 'A avaliação deve ser um número inteiro entre 1 e 5.',
      });
    }

    if (nota < 5 && !comentarioAvaliacao.trim()) {
      return res.status(400).json({
        success: false,
        message: 'O comentário da avaliação é obrigatório para notas menores que 5.',
      });
    }

    const requerimentoRef = db.collection('Requerimentos').doc(id);
    const requerimentoDoc = await requerimentoRef.get();

    if (!requerimentoDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Requerimento não encontrado.',
      });
    }

    const requerimento = requerimentoDoc.data();

    if (requerimento.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para avaliar este requerimento.',
      });
    }

    if (requerimento.status !== 'Respondido') {
      return res.status(400).json({
        success: false,
        message: 'Somente requerimentos com status Respondido podem ser avaliados.',
      });
    }

    await requerimentoRef.update({
      avaliacao: nota,
      comentarioAvaliacao: comentarioAvaliacao.trim(),
      status: 'Avaliado',
      dataAtualizacao: admin.firestore.Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: 'Avaliação registrada com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao avaliar requerimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao avaliar requerimento.',
    });
  }
};


module.exports = {
  listarMeusRequerimentos: exports.listarMeusRequerimentos,
  getDashboardStats: exports.getDashboardStats,
  criarRequerimento: exports.criarRequerimento,
  adicionarComentario: exports.adicionarComentario,
  avaliarRequerimento: exports.avaliarRequerimento,
};