const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { admin } = require('../firebase/admin');
const {
  criarUsuario,
  loginUsuario,
  getMeuCadastro,
  atualizarMeuCadastro,
  alterarMinhaSenha,
} = require('../controllers/usuariosController');

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

router.post('/login', loginUsuario);
router.post('/', upload.single('foto'), criarUsuario);
router.get('/meu-cadastro', authMiddleware, getMeuCadastro);
router.put('/meu-cadastro', authMiddleware, upload.single('foto'), atualizarMeuCadastro);
router.put('/alterar-senha', authMiddleware, alterarMinhaSenha);

module.exports = router;