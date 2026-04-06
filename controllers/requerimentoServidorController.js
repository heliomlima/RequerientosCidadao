const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../firebase/admin');
const {
  obterIdUnidadeGestoraDoServidor,
  buscarUsuarioPerfilPorServidorDocId,
} = require('../utils/servidorUsuarioHelpers');

const storageBucket = () => admin.storage().bucket();

async function uploadBuffersDocumentoResposta(prefixoPasta, arquivos) {
  const bucket = storageBucket();
  const lista = [];
  const base = String(prefixoPasta || 'requerimentos/documentoResposta').replace(/\/$/, '');

  for (const file of arquivos || []) {
    if (!file || !file.buffer) continue;
    const storageFilePath = `${base}/${Date.now()}-${uuidv4()}-${file.originalname || 'arquivo'}`;
    const f = bucket.file(storageFilePath);
    const token = uuidv4();

    await f.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageFilePath)}?alt=media&token=${token}`;
    lista.push({
      nome: file.originalname || 'arquivo',
      url,
    });
  }

  return lista;
}

function normalizarIdPerfil(valor) {
  if (typeof valor === 'number' && !Number.isNaN(valor)) return valor;
  const n = parseInt(String(valor ?? ''), 10);
  return Number.isNaN(n) ? null : n;
}

/** Somente dígitos do CPF em usuarioServidor (CPF/cpf com ou sem máscara). */
function extrairCpfNumericoUsuarioServidor(dados) {
  if (!dados || typeof dados !== 'object') return '';
  const bruto =
    dados.CPF != null
      ? dados.CPF
      : dados.cpf != null
        ? dados.cpf
        : dados.Cpf != null
          ? dados.Cpf
          : '';
  return String(bruto).replace(/\D/g, '');
}

function obterMillis(valor) {
  if (!valor) return 0;
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  if (typeof valor._seconds === 'number') return valor._seconds * 1000;
  if (typeof valor.seconds === 'number') return valor.seconds * 1000;
  const d = new Date(valor);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

async function obterServidorIdPorCredenciais(uid, email) {
  if (uid) {
    const snapshot = await db
      .collection('usuarioServidor')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { servidorId: doc.id, dadosServidor: doc.data() };
    }
  }

  if (email) {
    const emailNormalizado = String(email).trim().toLowerCase();
    const snapshot = await db
      .collection('usuarioServidor')
      .where('email', '==', emailNormalizado)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { servidorId: doc.id, dadosServidor: doc.data() };
    }
  }

  return null;
}

async function obterIdsPerfisDoServidor(servidorId) {
  const perfisSnapshot = await buscarUsuarioPerfilPorServidorDocId(db, servidorId);

  if (perfisSnapshot.empty) return [];

  const ids = [];
  perfisSnapshot.forEach((doc) => {
    const d = doc.data() || {};
    const v = normalizarIdPerfil(
      d.idPerfil ?? d.IdPerfil ?? d.IDPerfil ?? d.perfil
    );
    if (v != null) ids.push(v);
  });

  return ids;
}

function usuarioPossuiPerfil(perfis, idPerfilPermitido) {
  return perfis.includes(idPerfilPermitido);
}

async function authServidor(req) {
  const uid = req.user?.uid;
  const email = req.user?.email;
  const servidor = await obterServidorIdPorCredenciais(uid, email);
  if (!servidor) {
    return { autorizado: false, servidorId: null, idPerfis: [], dadosServidor: null };
  }

  const idPerfis = await obterIdsPerfisDoServidor(servidor.servidorId);
  return {
    autorizado: true,
    servidorId: servidor.servidorId,
    idPerfis,
    dadosServidor: servidor.dadosServidor || {},
  };
}

// listar requerimentos que estão com status "Registrado"
exports.listarRequerimentosRegistrados = async (req, res) => {
  try {
    const { autorizado, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    // Distribuir: Gestor (idPerfil = 2)
    if (!usuarioPossuiPerfil(idPerfis, 2)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para distribuir requerimentos.',
      });
    }

    const snapshot = await db
      .collection('Requerimentos')
      .where('status', '==', 'Registrado')
      .get();

    const requerimentos = [];
    snapshot.forEach((doc) => requerimentos.push({ id: doc.id, ...doc.data() }));

    requerimentos.sort(
      (a, b) => obterMillis(b.dataCadastro) - obterMillis(a.dataCadastro)
    );

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao listar requerimentos registrados:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar requerimentos.',
    });
  }
};

// listar unidades gestora (coleção unidadeGestora)
exports.listarUnidadesGestora = async (req, res) => {
  try {
    const { autorizado, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    // Gestor (2) ou administrador do sistema (1), ex.: manter servidor / distribuir.
    if (!usuarioPossuiPerfil(idPerfis, 1) && !usuarioPossuiPerfil(idPerfis, 2)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar unidades gestora.',
      });
    }

    const snapshot = await db.collection('unidadeGestora').get();
    const unidadesGestora = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const nome = data.Nome ?? data.nome ?? data.unidadeGestoraNome ?? '';
      unidadesGestora.push({
        id: doc.id,
        nome: typeof nome === 'string' ? nome : String(nome || ''),
      });
    });

    unidadesGestora.sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    return res.status(200).json(unidadesGestora);
  } catch (error) {
    console.error('Erro ao listar unidades gestora:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar unidades gestora.',
    });
  }
};

// distribuir: setar idUGResponsavel + dataAtualizacao (e avançar status)
exports.distribuirRequerimento = async (req, res) => {
  try {
    const { autorizado, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    // Distribuir: Gestor (idPerfil = 2)
    if (!usuarioPossuiPerfil(idPerfis, 2)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para distribuir requerimentos.',
      });
    }

    const { idRequerimentos, idRequerimento, idUGResponsavel } = req.body || {};

    const ids = Array.isArray(idRequerimentos)
      ? idRequerimentos
      : idRequerimento
        ? [idRequerimento]
        : [];

    const idsLimpos = ids
      .map((x) => (x != null ? String(x).trim() : ''))
      .filter(Boolean);

    if (idsLimpos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe idRequerimentos (array) ou idRequerimento.',
      });
    }

    if (!idUGResponsavel) {
      return res.status(400).json({
        success: false,
        message: 'Selecione uma unidade gestora para distribuir.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    const idUg = String(idUGResponsavel).trim();

    const atualizados = [];
    const ignorados = []; // existe, mas não está em Registrado
    const naoEncontrados = [];

    for (const idReq of idsLimpos) {
      const requerimentoRef = db.collection('Requerimentos').doc(idReq);
      const requerimentoDoc = await requerimentoRef.get();

      if (!requerimentoDoc.exists) {
        naoEncontrados.push(idReq);
        continue;
      }

      const dados = requerimentoDoc.data() || {};

      if ((dados.status || '') !== 'Registrado') {
        ignorados.push(idReq);
        continue;
      }

      await requerimentoRef.update({
        idUGResponsavel: idUg,
        status: 'Distribuído',
        dataAtualizacao: agora,
      });

      atualizados.push(idReq);
    }

    if (atualizados.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Nenhum requerimento pôde ser distribuído. Verifique se todos estão com status "Registrado".',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Distribuição realizada com sucesso.',
      total: idsLimpos.length,
      atualizados: atualizados.length,
      ignorados: ignorados.length,
      naoEncontrados: naoEncontrados.length,
    });
  } catch (error) {
    console.error('Erro ao distribuir requerimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao distribuir requerimento.',
    });
  }
};

function statusDelegavelParaAnalistaNaUG(status) {
  const s = String(status || '').trim();
  return s === 'Distribuído' || s === 'Direcionado';
}

// listar requerimentos Direcionados ou Distribuídos cuja UG responsável é a do servidor logado
exports.listarRequerimentosDistribuidosParaUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para delegar requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const snapshot = await db
      .collection('Requerimentos')
      .where('idUGResponsavel', '==', ugId)
      .get();

    const requerimentos = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (statusDelegavelParaAnalistaNaUG(data.status)) {
        requerimentos.push({ id: doc.id, ...data });
      }
    });

    requerimentos.sort(
      (a, b) => obterMillis(b.dataCadastro) - obterMillis(a.dataCadastro)
    );

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao listar requerimentos para delegação na UG:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar requerimentos.',
    });
  }
};

// listar requerimentos Concluídos da UG do gestor (Responder)
exports.listarRequerimentosConcluidosParaUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para responder requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const snapshot = await db
      .collection('Requerimentos')
      .where('idUGResponsavel', '==', ugId)
      .get();

    const requerimentos = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if ((data.status || '') === 'Concluído') {
        requerimentos.push({ id: doc.id, ...data });
      }
    });

    requerimentos.sort(
      (a, b) => obterMillis(b.dataCadastro) - obterMillis(a.dataCadastro)
    );

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao listar requerimentos concluídos para a UG:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar requerimentos.',
    });
  }
};

// analistas da mesma UG com perfil Analista (idPerfil = 4)
exports.listarAnalistasDaUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3) && !usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para listar analistas.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const ugRef = db.collection('unidadeGestora').doc(ugId);

    const porId = new Map();

    const [snapRef, snapStr, snapIdUg] = await Promise.all([
      db
        .collection('usuarioServidor')
        .where('unidadeGestora', '==', ugRef)
        .get(),
      db
        .collection('usuarioServidor')
        .where('unidadeGestora', '==', ugId)
        .get(),
      db
        .collection('usuarioServidor')
        .where('idUnidadeGestora', '==', ugId)
        .get(),
    ]);

    snapRef.forEach((doc) => porId.set(doc.id, doc));
    snapStr.forEach((doc) => porId.set(doc.id, doc));
    snapIdUg.forEach((doc) => porId.set(doc.id, doc));

    const analistas = [];

    for (const doc of porId.values()) {
      const dadosSrv = doc.data() || {};

      const perfilSnap = await buscarUsuarioPerfilPorServidorDocId(db, doc.id);

      const ehAnalista = perfilSnap.docs.some(
        (p) => normalizarIdPerfil(p.data()?.idPerfil) === 4
      );

      if (ehAnalista) {
        const nome = dadosSrv.nome || '';
        analistas.push({
          id: doc.id,
          nome: typeof nome === 'string' ? nome : String(nome || ''),
        });
      }
    }

    analistas.sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    return res.status(200).json(analistas);
  } catch (error) {
    console.error('Erro ao listar analistas da UG:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar analistas.',
    });
  }
};

// delegar requerimentos selecionados a um analista (idAnalista = id do documento usuarioServidor)
exports.delegarRequerimento = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para delegar requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const { idRequerimentos, idAnalista } = req.body || {};

    const ids = Array.isArray(idRequerimentos) ? idRequerimentos : [];
    const idsLimpos = ids
      .map((x) => (x != null ? String(x).trim() : ''))
      .filter(Boolean);

    if (idsLimpos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe idRequerimentos (array).',
      });
    }

    if (!idAnalista || !String(idAnalista).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Selecione um analista para delegar.',
      });
    }

    const idAnalistaStr = String(idAnalista).trim();

    const analistaDoc = await db
      .collection('usuarioServidor')
      .doc(idAnalistaStr)
      .get();

    if (!analistaDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analista não encontrado.',
      });
    }

    const analistaUg = obterIdUnidadeGestoraDoServidor(analistaDoc.data() || {});
    if (analistaUg !== ugId) {
      return res.status(403).json({
        success: false,
        message: 'O analista selecionado não pertence à sua unidade gestora.',
      });
    }

    const perfilAnalistaSnap = await buscarUsuarioPerfilPorServidorDocId(db, idAnalistaStr);

    const ehAnalista = perfilAnalistaSnap.docs.some(
      (p) => normalizarIdPerfil(p.data()?.idPerfil) === 4
    );

    if (!ehAnalista) {
      return res.status(400).json({
        success: false,
        message: 'O usuário selecionado não possui perfil Analista.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    const atualizados = [];
    const ignorados = [];
    const naoEncontrados = [];

    for (const idReq of idsLimpos) {
      const ref = db.collection('Requerimentos').doc(idReq);
      const snap = await ref.get();

      if (!snap.exists) {
        naoEncontrados.push(idReq);
        continue;
      }

      const dados = snap.data() || {};
      const st = String(dados.status || '').trim();
      const idUgReq = obterIdUgResponsavelRequerimento(dados);
      const ugNorm = normalizarIdUnidadeGestoraEmValor(ugId);

      if (!statusDelegavelParaAnalistaNaUG(st) || idUgReq !== ugNorm) {
        ignorados.push(idReq);
        continue;
      }

      await ref.update({
        idAnalista: idAnalistaStr,
        dataAtualizacao: agora,
        status: 'Delegado',
      });

      atualizados.push(idReq);
    }

    if (atualizados.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Nenhum requerimento pôde ser delegado. Verifique se estão com status "Direcionado" ou "Distribuído" e pertencem à sua UG.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Delegação realizada com sucesso.',
      total: idsLimpos.length,
      atualizados: atualizados.length,
      ignorados: ignorados.length,
      naoEncontrados: naoEncontrados.length,
    });
  } catch (error) {
    console.error('Erro ao delegar requerimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao delegar requerimento.',
    });
  }
};

function sortComentariosDesc(comentarios) {
  const lista = Array.isArray(comentarios) ? [...comentarios] : [];
  return lista.sort(
    (a, b) => obterMillis(b?.data) - obterMillis(a?.data)
  );
}

function normalizarDocumentoRespostaParaLista(dr) {
  if (dr == null) return [];
  if (Array.isArray(dr)) {
    return dr
      .filter((x) => x && typeof x.url === 'string' && String(x.url).trim())
      .map((x) => ({
        nome: (typeof x.nome === 'string' && x.nome.trim()) || 'documento',
        url: String(x.url).trim(),
      }));
  }
  if (typeof dr === 'object' && dr.url) {
    return [
      {
        nome:
          (typeof dr.nome === 'string' && dr.nome.trim()) || 'documento',
        url: String(dr.url).trim(),
      },
    ];
  }
  return [];
}

async function montarDetalheAnaliseResponse(reqId, dados) {
  const userId = dados.userId || dados.uid || '';
  let nomeCidadao = '-';
  if (userId) {
    try {
      const uDoc = await db.collection('Usuarios').doc(String(userId)).get();
      if (uDoc.exists) {
        const u = uDoc.data() || {};
        nomeCidadao =
          (typeof u.nome === 'string' && u.nome.trim()) ||
          (typeof u.name === 'string' && u.name.trim()) ||
          '-';
      }
    } catch (e) {
      console.error('Erro ao buscar cidadão:', e);
    }
  }

  return {
    id: reqId,
    ...dados,
    nomeCidadao,
    comentarios: sortComentariosDesc(dados.comentarios),
  };
}

// requerimentos delegados ao analista logado (Delegado ou Em análise)
exports.listarRequerimentosParaAnalista = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para analisar requerimentos.',
      });
    }

    const sid = String(servidorId);
    const snapshot = await db
      .collection('Requerimentos')
      .where('idAnalista', '==', sid)
      .get();

    const requerimentos = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const st = data.status || '';
      if (st === 'Delegado' || st === 'Em análise') {
        requerimentos.push({ id: doc.id, ...data });
      }
    });

    requerimentos.sort(
      (a, b) => obterMillis(b.dataCadastro) - obterMillis(a.dataCadastro)
    );

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao listar requerimentos para analista:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar requerimentos.',
    });
  }
};

// requerimentos do analista em análise ou em execução (para conclusão)
exports.listarRequerimentosParaConclusao = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para concluir requerimentos.',
      });
    }

    const sid = String(servidorId);
    const snapshot = await db
      .collection('Requerimentos')
      .where('idAnalista', '==', sid)
      .get();

    const requerimentos = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      const st = data.status || '';
      if (st === 'Em análise' || st === 'Em execução') {
        requerimentos.push({ id: doc.id, ...data });
      }
    });

    requerimentos.sort(
      (a, b) => obterMillis(b.dataCadastro) - obterMillis(a.dataCadastro)
    );

    return res.status(200).json(requerimentos);
  } catch (error) {
    console.error('Erro ao listar requerimentos para conclusão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar requerimentos.',
    });
  }
};

// concluir requerimentos (resposta + anexos opcionais + datas)
exports.concluirRequerimentosComoAnalista = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para concluir requerimentos.',
      });
    }

    const respostaTexto = String(req.body?.resposta ?? '').trim();
    if (!respostaTexto) {
      return res.status(400).json({
        success: false,
        message: 'O campo Resposta é obrigatório.',
      });
    }

    let ids = [];
    try {
      const raw = req.body?.idRequerimentos;
      if (typeof raw === 'string') {
        ids = JSON.parse(raw);
      } else if (Array.isArray(raw)) {
        ids = raw;
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Lista de requerimentos inválida.',
      });
    }

    const idsLimpos = ids
      .map((x) => (x != null ? String(x).trim() : ''))
      .filter(Boolean);

    if (idsLimpos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selecione ao menos um requerimento.',
      });
    }

    const arquivos = Array.isArray(req.files) ? req.files : [];
    const sid = String(servidorId);
    const prefixoUpload = `requerimentos/documentoResposta/${sid}/${Date.now()}`;
    const documentoRespostaLista = await uploadBuffersDocumentoResposta(
      prefixoUpload,
      arquivos
    );

    const documentoRespostaFirestore =
      documentoRespostaLista.length > 0
        ? documentoRespostaLista
        : null;

    const agora = admin.firestore.Timestamp.now();
    const atualizados = [];
    const ignorados = [];
    const naoEncontrados = [];

    for (const idReq of idsLimpos) {
      const ref = db.collection('Requerimentos').doc(idReq);
      const snap = await ref.get();

      if (!snap.exists) {
        naoEncontrados.push(idReq);
        continue;
      }

      const dados = snap.data() || {};
      if (String(dados.idAnalista || '').trim() !== sid) {
        ignorados.push(idReq);
        continue;
      }

      const st = dados.status || '';
      if (st !== 'Em análise' && st !== 'Em execução') {
        ignorados.push(idReq);
        continue;
      }

      await ref.update({
        resposta: respostaTexto,
        documentoResposta: documentoRespostaFirestore,
        dataConclusao: agora,
        dataAtualizacao: agora,
        status: 'Concluído',
      });

      atualizados.push(idReq);
    }

    if (atualizados.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Nenhum requerimento pôde ser concluído. Verifique se estão com status "Em análise" ou "Em execução" e sob sua responsabilidade.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Requerimento(s) concluído(s) com sucesso.',
      total: idsLimpos.length,
      atualizados: atualizados.length,
      ignorados: ignorados.length,
      naoEncontrados: naoEncontrados.length,
    });
  } catch (error) {
    console.error('Erro ao concluir requerimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao concluir requerimentos.',
    });
  }
};

// abrir análise: atualiza status + dataAtualizacao e devolve detalhe (modal)
exports.abrirAnaliseRequerimento = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para analisar requerimentos.',
      });
    }

    const reqId = String(req.params.reqId || '').trim();
    if (!reqId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador do requerimento inválido.',
      });
    }

    const ref = db.collection('Requerimentos').doc(reqId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Requerimento não encontrado.',
      });
    }

    const dados = snap.data() || {};
    const sid = String(servidorId);

    if (String(dados.idAnalista || '').trim() !== sid) {
      return res.status(403).json({
        success: false,
        message: 'Este requerimento não está delegado a você.',
      });
    }

    const st = dados.status || '';
    if (st !== 'Delegado' && st !== 'Em análise') {
      return res.status(400).json({
        success: false,
        message:
          'Somente requerimentos com status Delegado ou Em análise podem ser analisados.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    await ref.update({
      status: 'Em análise',
      dataAtualizacao: agora,
    });

    const atualizado = (await ref.get()).data() || {};
    const payload = await montarDetalheAnaliseResponse(reqId, atualizado);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao abrir análise do requerimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao abrir análise.',
    });
  }
};

// analista redistribui para outro analista da mesma UG
exports.delegarRequerimentosComoAnalista = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis, dadosServidor } =
      await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para delegar requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const { idRequerimentos, idAnalista } = req.body || {};
    const ids = Array.isArray(idRequerimentos) ? idRequerimentos : [];
    const idsLimpos = ids
      .map((x) => (x != null ? String(x).trim() : ''))
      .filter(Boolean);

    if (idsLimpos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe idRequerimentos (array).',
      });
    }

    if (!idAnalista || !String(idAnalista).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Selecione um analista para delegar.',
      });
    }

    const idAnalistaStr = String(idAnalista).trim();
    const sid = String(servidorId);

    const analistaDoc = await db
      .collection('usuarioServidor')
      .doc(idAnalistaStr)
      .get();

    if (!analistaDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Analista não encontrado.',
      });
    }

    const analistaUg = obterIdUnidadeGestoraDoServidor(analistaDoc.data() || {});
    if (analistaUg !== ugId) {
      return res.status(403).json({
        success: false,
        message: 'O analista selecionado não pertence à sua unidade gestora.',
      });
    }

    const perfilAnalistaSnap = await buscarUsuarioPerfilPorServidorDocId(db, idAnalistaStr);

    const ehAnalista = perfilAnalistaSnap.docs.some(
      (p) => normalizarIdPerfil(p.data()?.idPerfil) === 4
    );

    if (!ehAnalista) {
      return res.status(400).json({
        success: false,
        message: 'O usuário selecionado não possui perfil Analista.',
      });
    }

    const agora = admin.firestore.Timestamp.now();
    const atualizados = [];
    const ignorados = [];
    const naoEncontrados = [];

    for (const idReq of idsLimpos) {
      const ref = db.collection('Requerimentos').doc(idReq);
      const rSnap = await ref.get();

      if (!rSnap.exists) {
        naoEncontrados.push(idReq);
        continue;
      }

      const dados = rSnap.data() || {};
      const st = dados.status || '';

      if (String(dados.idAnalista || '').trim() !== sid) {
        ignorados.push(idReq);
        continue;
      }

      if (st !== 'Delegado' && st !== 'Em análise') {
        ignorados.push(idReq);
        continue;
      }

      await ref.update({
        idAnalista: idAnalistaStr,
        dataAtualizacao: agora,
        status: 'Delegado',
      });

      atualizados.push(idReq);
    }

    if (atualizados.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Nenhum requerimento pôde ser delegado. Verifique seleção e permissões.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Delegação realizada com sucesso.',
      total: idsLimpos.length,
      atualizados: atualizados.length,
      ignorados: ignorados.length,
      naoEncontrados: naoEncontrados.length,
    });
  } catch (error) {
    console.error('Erro ao delegar requerimentos como analista:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao delegar requerimentos.',
    });
  }
};

// planejar execução (Em análise → Em execução + dataConclusaoPrevista)
exports.planejarExecucaoComoAnalista = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para planejar execução.',
      });
    }

    const reqId = String(req.params.reqId || '').trim();
    if (!reqId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador do requerimento inválido.',
      });
    }

    const { dataConclusaoPrevista } = req.body || {};
    if (!dataConclusaoPrevista || !String(dataConclusaoPrevista).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Informe a data de conclusão prevista.',
      });
    }

    const ref = db.collection('Requerimentos').doc(reqId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Requerimento não encontrado.',
      });
    }

    const dados = snap.data() || {};
    const sid = String(servidorId);

    if (String(dados.idAnalista || '').trim() !== sid) {
      return res.status(403).json({
        success: false,
        message: 'Este requerimento não está atribuído a você.',
      });
    }

    if ((dados.status || '') !== 'Em análise') {
      return res.status(400).json({
        success: false,
        message: 'Somente requerimentos em análise podem ter execução planejada.',
      });
    }

    const raw = String(dataConclusaoPrevista).trim();
    let ts;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map((n) => parseInt(n, 10));
      ts = admin.firestore.Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
    } else {
      const dt = new Date(raw);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data de conclusão prevista inválida.',
        });
      }
      ts = admin.firestore.Timestamp.fromDate(dt);
    }

    const agora = admin.firestore.Timestamp.now();

    await ref.update({
      dataConclusaoPrevista: ts,
      status: 'Em execução',
      dataAtualizacao: agora,
    });

    return res.status(200).json({
      success: true,
      message: 'Planejamento registrado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao planejar execução:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao planejar execução.',
    });
  }
};

async function assertRequerimentoConcluidoDaUg(reqId, ugId) {
  const ref = db.collection('Requerimentos').doc(reqId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, code: 404, message: 'Requerimento não encontrado.' };
  }
  const dados = snap.data() || {};
  if (String(dados.idUGResponsavel || '').trim() !== String(ugId).trim()) {
    return {
      ok: false,
      code: 403,
      message: 'Este requerimento não pertence à sua unidade gestora.',
    };
  }
  if ((dados.status || '') !== 'Concluído') {
    return {
      ok: false,
      code: 400,
      message: 'Somente requerimentos com status Concluído podem ser respondidos.',
    };
  }
  return { ok: true, ref, dados };
}

// Gestor UG: detalhe para modal Responder (sem alterar status)
exports.obterDetalheRequerimentoParaRespostaUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para responder requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const reqId = String(req.params.reqId || '').trim();
    if (!reqId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador do requerimento inválido.',
      });
    }

    const check = await assertRequerimentoConcluidoDaUg(reqId, ugId);
    if (!check.ok) {
      return res.status(check.code).json({
        success: false,
        message: check.message,
      });
    }

    const payload = await montarDetalheAnaliseResponse(reqId, check.dados);
    payload.documentosRespostaLista = normalizarDocumentoRespostaParaLista(
      check.dados.documentoResposta
    );

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao obter detalhe para resposta (UG):', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao carregar requerimento.',
    });
  }
};

exports.devolverRequerimentoUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para devolver requerimentos.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const reqId = String(req.params.reqId || '').trim();
    if (!reqId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador do requerimento inválido.',
      });
    }

    const check = await assertRequerimentoConcluidoDaUg(reqId, ugId);
    if (!check.ok) {
      return res.status(check.code).json({
        success: false,
        message: check.message,
      });
    }

    const agora = admin.firestore.Timestamp.now();
    await check.ref.update({
      status: 'Delegado',
      dataAtualizacao: agora,
    });

    return res.status(200).json({
      success: true,
      message: 'Requerimento devolvido com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao devolver requerimento (UG):', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao devolver requerimento.',
    });
  }
};

exports.confirmarRespostaRequerimentoUG = async (req, res) => {
  try {
    const { autorizado, servidorId, idPerfis, dadosServidor } =
      await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para confirmar resposta.',
      });
    }

    const ugId = obterIdUnidadeGestoraDoServidor(dadosServidor);
    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const reqId = String(req.params.reqId || '').trim();
    if (!reqId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador do requerimento inválido.',
      });
    }

    const respostaTexto = String(req.body?.resposta ?? '').trim();
    if (!respostaTexto) {
      return res.status(400).json({
        success: false,
        message: 'O campo Resposta é obrigatório.',
      });
    }

    let mantidos = [];
    try {
      const raw = req.body?.documentosRespostaMantidos;
      if (typeof raw === 'string') {
        if (raw.trim()) mantidos = JSON.parse(raw);
      } else if (Array.isArray(raw)) {
        mantidos = raw;
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Lista de documentos mantidos inválida.',
      });
    }

    mantidos = normalizarDocumentoRespostaParaLista(mantidos);

    const check = await assertRequerimentoConcluidoDaUg(reqId, ugId);
    if (!check.ok) {
      return res.status(check.code).json({
        success: false,
        message: check.message,
      });
    }

    const arquivos = Array.isArray(req.files) ? req.files : [];
    const sid = String(servidorId);
    const prefixoUpload = `requerimentos/documentoResposta/ug/${sid}/${Date.now()}`;
    const novos = await uploadBuffersDocumentoResposta(prefixoUpload, arquivos);

    const merged = [...mantidos, ...novos];
    const documentoRespostaFirestore = merged.length > 0 ? merged : null;

    const agora = admin.firestore.Timestamp.now();

    await check.ref.update({
      resposta: respostaTexto,
      documentoResposta: documentoRespostaFirestore,
      status: 'Respondido',
      dataConclusao: agora,
      dataAtualizacao: agora,
    });

    return res.status(200).json({
      success: true,
      message: 'Resposta confirmada com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao confirmar resposta (UG):', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao confirmar resposta.',
    });
  }
};

function campoDataConclusaoVazio(valor) {
  return valor === undefined || valor === null;
}

// Painel do gestor: cards e dados para gráficos (leitura global da coleção Requerimentos)
exports.getIndicadoresDashboardGestor = async (req, res) => {
  try {
    const { autorizado, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 2)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para visualizar estes indicadores.',
      });
    }

    const snapshot = await db.collection('Requerimentos').get();
    const nowMs = Date.now();
    const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

    let aguardandoDistribuicao = 0;
    let foraDoPrazo = 0;
    let respondidosAvaliados30d = 0;
    const abertosPorStatus = {};
    const abertosPorUg = {};

    snapshot.forEach((doc) => {
      const d = doc.data() || {};
      const status = String(d.status || '').trim();

      if (status === 'Registrado') {
        aguardandoDistribuicao += 1;
      }

      const prevMs =
        d.dataConclusaoPrevista != null
          ? obterMillis(d.dataConclusaoPrevista)
          : 0;
      if (
        campoDataConclusaoVazio(d.dataConclusao) &&
        prevMs > 0 &&
        prevMs < nowMs
      ) {
        foraDoPrazo += 1;
      }

      if (
        (status === 'Respondido' || status === 'Avaliado') &&
        !campoDataConclusaoVazio(d.dataConclusao)
      ) {
        const dcm = obterMillis(d.dataConclusao);
        if (dcm >= thirtyDaysAgoMs) {
          respondidosAvaliados30d += 1;
        }
      }

      if (status !== 'Respondido' && status !== 'Avaliado') {
        const stKey = status || '(sem status)';
        abertosPorStatus[stKey] = (abertosPorStatus[stKey] || 0) + 1;
        const ugKey =
          String(d.idUGResponsavel || '').trim() || '__sem_ug__';
        abertosPorUg[ugKey] = (abertosPorUg[ugKey] || 0) + 1;
      }
    });

    const ugIds = Object.keys(abertosPorUg).filter((k) => k !== '__sem_ug__');
    const ugNomes = {};
    await Promise.all(
      ugIds.map(async (id) => {
        try {
          const u = await db.collection('unidadeGestora').doc(id).get();
          if (u.exists) {
            const ud = u.data() || {};
            ugNomes[id] = String(ud.Nome ?? ud.nome ?? id).trim() || id;
          } else {
            ugNomes[id] = id;
          }
        } catch (e) {
          ugNomes[id] = id;
        }
      })
    );

    const graficoAbertosPorUG = Object.entries(abertosPorUg)
      .map(([id, count]) => ({
        id,
        nome:
          id === '__sem_ug__' ? 'Sem UG responsável' : ugNomes[id] || id,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const graficoAbertosPorStatus = Object.entries(abertosPorStatus)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      cards: {
        aguardandoDistribuicao,
        foraDoPrazo,
        respondidosAvaliados30d,
      },
      graficoAbertosPorStatus,
      graficoAbertosPorUG,
    });
  } catch (error) {
    console.error('Erro ao calcular indicadores do gestor:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao carregar indicadores.',
    });
  }
};

/**
 * Normaliza qualquer valor de UG (string, path, DocumentReference admin, {id}) para o id do documento.
 */
function normalizarIdUnidadeGestoraEmValor(v) {
  if (v == null) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    const m = s.match(/unidadeGestora\/([^/]+)(?:\/)?$/);
    if (m) return m[1].trim();
    const m2 = s.match(/\/unidadeGestora\/([^/]+)/);
    if (m2) return m2[1].trim();
    return s;
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return String(v).trim();
  }
  if (typeof v === 'object') {
    if (typeof v.get === 'function' && v.id != null && String(v.id).trim()) {
      return String(v.id).trim();
    }
    if (v.id != null && String(v.id).trim()) {
      return String(v.id).trim();
    }
  }
  return '';
}

/** Tenta todos os nomes de campo usados na base para UG do requerimento. */
function obterIdUgResponsavelRequerimento(dados) {
  if (!dados || typeof dados !== 'object') return '';
  const chaves = [
    'idUGResponsavel',
    'idUgResponsavel',
    'IdUGResponsavel',
    'IDUGResponsavel',
    'idUnidadeGestora',
    'IdUnidadeGestora',
    'IDUnidadeGestora',
    'unidadeGestora',
    'UnidadeGestora',
  ];
  for (const k of chaves) {
    const id = normalizarIdUnidadeGestoraEmValor(dados[k]);
    if (id) return id;
  }
  return '';
}

function requerimentoPertenceUg(dadosReq, ugIdServidor) {
  if (!ugIdServidor) return false;
  const ugServ = normalizarIdUnidadeGestoraEmValor(ugIdServidor);
  if (!ugServ) return false;
  const ugReq = obterIdUgResponsavelRequerimento(dadosReq);
  return ugReq === ugServ;
}

function statusRequerimentoAbertoParaIndicador(status) {
  const s = String(status || '').trim().toLowerCase();
  return s !== 'respondido' && s !== 'avaliado';
}

function normalizarIdAnalistaEmValor(v) {
  if (v == null) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    return s;
  }
  if (typeof v === 'object') {
    if (typeof v.get === 'function' && v.id != null && String(v.id).trim()) {
      return String(v.id).trim();
    }
    if (v.id != null && String(v.id).trim()) {
      return String(v.id).trim();
    }
  }
  return '';
}

function obterIdAnalistaRequerimento(dados) {
  if (!dados || typeof dados !== 'object') return '';
  const chaves = ['idAnalista', 'IdAnalista', 'IDAnalista'];
  for (const k of chaves) {
    const id = normalizarIdAnalistaEmValor(dados[k]);
    if (id) return id;
  }
  return '';
}

function requerimentoAtribuidoAoAnalista(dados, servidorDocId) {
  const sid = String(servidorDocId || '').trim();
  if (!sid) return false;
  return obterIdAnalistaRequerimento(dados) === sid;
}

function statusAnalistaNormalizado(status) {
  return String(status || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function statusSobResponsabilidadeAnalista(status) {
  const s = statusAnalistaNormalizado(status);
  return (
    s === 'delegado' ||
    s === 'em analise' ||
    s === 'em execucao'
  );
}

function statusDelegadoAnalista(status) {
  return statusAnalistaNormalizado(status) === 'delegado';
}

function statusEmAnaliseOuExecucaoAnalista(status) {
  const s = statusAnalistaNormalizado(status);
  return s === 'em analise' || s === 'em execucao';
}

function statusConcluidoOuRespondidoAnalista(status) {
  const s = statusAnalistaNormalizado(status);
  return s === 'concluido' || s === 'respondido';
}

// Painel do gestor de UG (perfil 3): cards e gráficos filtrados pela UG do servidor logado
exports.getIndicadoresDashboardGestorUG = async (req, res) => {
  try {
    const { autorizado, idPerfis, dadosServidor, servidorId } =
      await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 3)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para visualizar estes indicadores.',
      });
    }

    let dadosUg = dadosServidor || {};
    if (servidorId) {
      try {
        const srvSnap = await db
          .collection('usuarioServidor')
          .doc(String(servidorId))
          .get();
        if (srvSnap.exists) {
          dadosUg = srvSnap.data() || {};
        }
      } catch (e) {
        console.error('Erro ao recarregar usuarioServidor para UG:', e);
      }
    }

    const ugId =
      normalizarIdUnidadeGestoraEmValor(
        obterIdUnidadeGestoraDoServidor(dadosUg)
      ) ||
      normalizarIdUnidadeGestoraEmValor(dadosUg.unidadeGestora) ||
      normalizarIdUnidadeGestoraEmValor(dadosUg.UnidadeGestora) ||
      normalizarIdUnidadeGestoraEmValor(dadosUg.idUnidadeGestora) ||
      normalizarIdUnidadeGestoraEmValor(dadosUg.IdUnidadeGestora);

    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Servidor sem unidade gestora vinculada.',
      });
    }

    const snapshot = await db.collection('Requerimentos').get();

    let sobResponsabilidadeMinhaUG = 0;
    let aguardandoDelegacao = 0;
    let aguardandoMinhaResposta = 0;
    const abertosPorStatus = {};
    const abertosPorBairro = {};

    snapshot.forEach((doc) => {
      const d = doc.data() || {};
      if (!requerimentoPertenceUg(d, ugId)) return;

      const status = String(d.status || '').trim();
      const stLc = status.toLowerCase();

      if (statusRequerimentoAbertoParaIndicador(status)) {
        sobResponsabilidadeMinhaUG += 1;
        const stKey = status || '(sem status)';
        abertosPorStatus[stKey] = (abertosPorStatus[stKey] || 0) + 1;
        const bairroKey = String(d.bairro || '').trim() || '(sem bairro)';
        abertosPorBairro[bairroKey] = (abertosPorBairro[bairroKey] || 0) + 1;
      }

      if (stLc === 'direcionado' || stLc === 'distribuído' || stLc === 'distribuido') {
        aguardandoDelegacao += 1;
      }

      if (stLc === 'concluído' || stLc === 'concluido') {
        aguardandoMinhaResposta += 1;
      }
    });

    const graficoAbertosPorStatus = Object.entries(abertosPorStatus)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const graficoAbertosPorBairro = Object.entries(abertosPorBairro)
      .map(([nome, count]) => ({
        id: nome,
        nome,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      cards: {
        sobResponsabilidadeMinhaUG,
        aguardandoDelegacao,
        aguardandoMinhaResposta,
      },
      graficoAbertosPorStatus,
      graficoAbertosPorBairro,
    });
  } catch (error) {
    console.error('Erro ao calcular indicadores do gestor de UG:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao carregar indicadores.',
    });
  }
};

// Painel do analista (perfil 4): cards e gráficos por idAnalista = documento usuarioServidor
exports.getIndicadoresDashboardAnalista = async (req, res) => {
  try {
    const { autorizado, idPerfis, servidorId } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 4)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para visualizar estes indicadores.',
      });
    }

    const sid = String(servidorId || '').trim();
    if (!sid) {
      return res.status(400).json({
        success: false,
        message: 'Servidor não identificado.',
      });
    }

    const snapshot = await db.collection('Requerimentos').get();
    const nowMs = Date.now();
    const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

    let sobMinhaResponsabilidade = 0;
    let aguardandoMinhaAnalise = 0;
    let emAnaliseOuExecucao = 0;
    const pizzaPorStatus = {};
    const colunasUltimos30PorStatus = {};

    snapshot.forEach((doc) => {
      const d = doc.data() || {};
      if (!requerimentoAtribuidoAoAnalista(d, sid)) return;

      const status = String(d.status || '').trim();
      const stKey = status || '(sem status)';

      if (statusSobResponsabilidadeAnalista(status)) {
        sobMinhaResponsabilidade += 1;
        pizzaPorStatus[stKey] = (pizzaPorStatus[stKey] || 0) + 1;
      }

      if (statusDelegadoAnalista(status)) {
        aguardandoMinhaAnalise += 1;
      }

      if (statusEmAnaliseOuExecucaoAnalista(status)) {
        emAnaliseOuExecucao += 1;
      }

      if (
        statusConcluidoOuRespondidoAnalista(status) &&
        !campoDataConclusaoVazio(d.dataConclusao)
      ) {
        const dcm = obterMillis(d.dataConclusao);
        if (dcm >= thirtyDaysAgoMs && dcm <= nowMs) {
          colunasUltimos30PorStatus[stKey] =
            (colunasUltimos30PorStatus[stKey] || 0) + 1;
        }
      }
    });

    const graficoSobResponsabilidadePorStatus = Object.entries(pizzaPorStatus)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const graficoExecutados30dPorStatus = Object.entries(
      colunasUltimos30PorStatus
    )
      .map(([nome, count]) => ({ id: nome, nome, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      cards: {
        sobMinhaResponsabilidade,
        aguardandoMinhaAnalise,
        emAnaliseOuExecucao,
      },
      graficoSobResponsabilidadePorStatus,
      graficoExecutados30dPorStatus,
    });
  } catch (error) {
    console.error('Erro ao calcular indicadores do analista:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao carregar indicadores.',
    });
  }
};

// Administrador (perfil 1): cadastrar pré-usuário em usuarioServidor (sem Firebase Auth até primeiro acesso)
exports.inserirServidorUsuarioAdmin = async (req, res) => {
  try {
    const { autorizado, idPerfis } = await authServidor(req);
    if (!autorizado) {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor não autorizado.',
      });
    }

    if (!usuarioPossuiPerfil(idPerfis, 1)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para inserir servidores.',
      });
    }

    const {
      email = '',
      nome = '',
      cpf = '',
      ativo = 'SIM',
      idUnidadeGestora = '',
    } = req.body || {};

    const emailN = String(email).trim().toLowerCase();
    const nomeN = String(nome).trim();
    const cpfNorm = String(cpf || '').replace(/\D/g, '');
    const ativoUp = String(ativo).trim().toUpperCase();
    const ativoStr =
      ativoUp === 'NÃO' || ativoUp === 'NAO' ? 'NÃO' : 'SIM';
    const ugId = String(idUnidadeGestora || '').trim();

    if (!emailN || !/\S+@\S+\.\S+/.test(emailN)) {
      return res.status(400).json({
        success: false,
        message: 'Informe um e-mail válido.',
      });
    }

    if (!nomeN) {
      return res.status(400).json({
        success: false,
        message: 'Informe o nome do servidor.',
      });
    }

    if (!cpfNorm || cpfNorm.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'Informe um CPF válido (11 dígitos).',
      });
    }

    if (!ugId) {
      return res.status(400).json({
        success: false,
        message: 'Selecione a unidade gestora.',
      });
    }

    const ugDoc = await db.collection('unidadeGestora').doc(ugId).get();
    if (!ugDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Unidade gestora inválida.',
      });
    }

    const snapServidores = await db.collection('usuarioServidor').get();
    const cpfJaExiste = snapServidores.docs.some((doc) => {
      const existente = extrairCpfNumericoUsuarioServidor(doc.data());
      return existente.length === 11 && existente === cpfNorm;
    });

    if (cpfJaExiste) {
      return res.status(409).json({
        success: false,
        message: 'Já existe usuário cadastrado com esse CPF!',
      });
    }

    const agora = admin.firestore.Timestamp.now();

    await db.collection('usuarioServidor').add({
      email: emailN,
      CPF: cpfNorm,
      nome: nomeN,
      ativo: ativoStr,
      unidadeGestora: ugId,
      dataAtualizacao: agora,
    });

    return res.status(201).json({
      success: true,
      message: 'Servidor inserido com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao inserir servidor (admin):', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao inserir servidor.',
    });
  }
};
