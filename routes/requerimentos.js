const express = require('express');
const router = express.Router();
const { admin } = require('../firebase/admin');
const upload = require('../middleware/upload');
const {
  listarMeusRequerimentos,
  getDashboardStats,
  criarRequerimento,
  adicionarComentario,
  avaliarRequerimento,
} = require('../controllers/requerimentoController');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não informado.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.',
    });
  }
}

router.get('/meus', authMiddleware, listarMeusRequerimentos);
router.get('/stats', authMiddleware, getDashboardStats);

router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'fotos', maxCount: 10 },
    { name: 'documentos', maxCount: 10 },
  ]),
  criarRequerimento
);

router.post(
  '/:id/comentarios',
  authMiddleware,
  upload.fields([
    { name: 'fotos', maxCount: 10 },
    { name: 'documentos', maxCount: 10 },
  ]),
  adicionarComentario
);

router.put('/:id/avaliar', authMiddleware, avaliarRequerimento);

module.exports = router;