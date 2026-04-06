/**
 * Nomes de campo usados na coleção usuarioPerfil para o ID do documento usuarioServidor
 * (Firestore diferencia maiúsculas/minúsculas).
 */
const USUARIO_PERFIL_CAMPOS_USUARIO = [
  'usuarioID',
  'usuarioId',
  'UsuarioID',
  'UsuarioId',
  'usuarioServidorId',
  'UsuarioServidorId',
  'servidorId',
  'ServidorId',
];

/**
 * Snapshot de usuarioPerfil para um servidor (tenta cada nome de campo até encontrar).
 */
async function buscarUsuarioPerfilPorServidorDocId(db, servidorDocId) {
  const id = String(servidorDocId ?? '').trim();
  if (!db || !id) {
    return db
      .collection('usuarioPerfil')
      .where('usuarioID', '==', '__no_servidor__')
      .limit(1)
      .get();
  }
  let snap = null;
  for (const campo of USUARIO_PERFIL_CAMPOS_USUARIO) {
    snap = await db.collection('usuarioPerfil').where(campo, '==', id).get();
    if (!snap.empty) return snap;
  }
  return snap;
}

/**
 * Resolução de unidade gestora (usuarioServidor.unidadeGestora → Nome em unidadeGestora).
 */

async function resolverNomeSetorUnidadeGestora(db, dadosServidor) {
  if (!dadosServidor || typeof dadosServidor !== 'object') return '';

  const ug = dadosServidor.unidadeGestora;

  try {
    if (ug && typeof ug.get === 'function') {
      const snap = await ug.get();
      if (snap.exists) {
        const data = snap.data();
        const nome = data.Nome ?? data.nome;
        if (nome != null && String(nome).trim()) return String(nome).trim();
      }
    }

    let docId = null;
    if (typeof ug === 'string' && ug.trim()) docId = ug.trim();
    else if (ug && typeof ug === 'object' && ug.id) docId = String(ug.id);

    if (docId) {
      const snap = await db.collection('unidadeGestora').doc(docId).get();
      if (snap.exists) {
        const data = snap.data();
        const nome = data.Nome ?? data.nome;
        if (nome != null && String(nome).trim()) return String(nome).trim();
      }
    }
  } catch (e) {
    console.error('Erro ao resolver unidadeGestora:', e);
  }

  const fallback =
    dadosServidor.unidadeGestoraNome ??
    dadosServidor.NomeUnidadeGestora ??
    dadosServidor.setor ??
    '';
  return typeof fallback === 'string' ? fallback.trim() : String(fallback || '').trim();
}

/**
 * ID do documento em unidadeGestora referenciado por usuarioServidor.unidadeGestora
 * (compatível com DocumentReference, string ou objeto com id).
 */
function obterIdUnidadeGestoraDoServidor(dadosServidor) {
  if (!dadosServidor || typeof dadosServidor !== 'object') return '';

  const ug =
    dadosServidor.unidadeGestora ??
    dadosServidor.UnidadeGestora ??
    dadosServidor.idUnidadeGestora ??
    dadosServidor.IdUnidadeGestora ??
    dadosServidor.IDUnidadeGestora;

  if (ug && typeof ug.get === 'function' && ug.id) {
    return String(ug.id);
  }
  if (typeof ug === 'string' && ug.trim()) {
    const s = ug.trim();
    const m = s.match(/unidadeGestora\/([^/]+)$/);
    if (m) return m[1];
    return s;
  }
  if (ug && typeof ug === 'object' && ug.id) {
    return String(ug.id);
  }

  return '';
}

module.exports = {
  resolverNomeSetorUnidadeGestora,
  obterIdUnidadeGestoraDoServidor,
  buscarUsuarioPerfilPorServidorDocId,
};
