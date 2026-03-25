const { admin, db } = require('../firebase/admin');

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

    const perfisSnapshot = await db.collection('usuarioPerfil')
      .where('usuarioID', '==', servidorId)
      .limit(1)
      .get();

    if (perfisSnapshot.empty) {
      return res.status(404).json({ success: false, message: 'Perfil do servidor não encontrado.' });
    }

    const perfilDoc = perfisSnapshot.docs[0];
    const perfilData = perfilDoc.data();

    return res.status(200).json({
      success: true,
      idPerfil: perfilData.idPerfil || null,
      servidorId
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do servidor:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao buscar perfil.' });
  }
};

exports.getDadosDashboard