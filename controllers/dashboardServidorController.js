const { db } = require('../firebase/admin');
const {
  resolverNomeSetorUnidadeGestora,
  buscarUsuarioPerfilPorServidorDocId,
} = require('../utils/servidorUsuarioHelpers');

exports.getPerfilServidor = async (req, res) => {
  try {
    const { servidorId } = req.body;

    if (!servidorId) {
      return res.status(400).json({ success: false, message: 'servidorId é obrigatório.' });
    }

    const servidorDoc = await db.collection('usuarioServidor').doc(servidorId).get();

    if (!servidorDoc.exists) {
      return res.status(404).json({ success: false, message: 'Servidor não encontrado.' });
    }

    const dadosServidor = servidorDoc.data();
    const setor = await resolverNomeSetorUnidadeGestora(db, dadosServidor);

    const perfisSnapshot = await buscarUsuarioPerfilPorServidorDocId(db, servidorId);

    if (perfisSnapshot.empty) {
      return res.status(200).json({
        success: true,
        idPerfil: null,
        idPerfis: [],
        servidorId,
        setor,
      });
    }

    const idPerfis = perfisSnapshot.docs
      .map((d) => {
        const raw = d.data();
        const v =
          raw?.idPerfil ?? raw?.IdPerfil ?? raw?.IDPerfil ?? raw?.perfil;
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        const n = parseInt(String(v ?? ''), 10);
        return Number.isNaN(n) ? null : n;
      })
      .filter((v) => v != null);

    const perfilDoc = perfisSnapshot.docs[0];
    const perfilData = perfilDoc.data();

    return res.status(200).json({
      success: true,
      idPerfil:
        perfilData.idPerfil ??
        perfilData.IdPerfil ??
        perfilData.IDPerfil ??
        idPerfis[0] ??
        null,
      idPerfis,
      servidorId,
      setor,
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do servidor:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao buscar perfil.' });
  }
};