const express = require('express');
const { admin } = require('../firebase/admin');
const upload = require('../middleware/upload');

const {
  listarRequerimentosRegistrados,
  listarUnidadesGestora,
  distribuirRequerimento,
  listarRequerimentosDistribuidosParaUG,
  listarRequerimentosConcluidosParaUG,
  listarAnalistasDaUG,
  delegarRequerimento,
  listarRequerimentosParaAnalista,
  listarRequerimentosParaConclusao,
  concluirRequerimentosComoAnalista,
  abrirAnaliseRequerimento,
  delegarRequerimentosComoAnalista,
  planejarExecucaoComoAnalista,
  obterDetalheRequerimentoParaRespostaUG,
  devolverRequerimentoUG,
  confirmarRespostaRequerimentoUG,
  getIndicadoresDashboardGestor,
  getIndicadoresDashboardGestorUG,
  getIndicadoresDashboardAnalista,
  inserirServidorUsuarioAdmin,
} = require('../controllers/requerimentoServidorController');

function uploadConclusaoAnexos(req, res, next) {
  const handler = upload.array('documentosResposta', 10);
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erro no envio de arquivos.',
      });
    }
    next();
  });
}

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

const router = express.Router();

router.get(
  '/gestor/indicadores-dashboard',
  authMiddleware,
  getIndicadoresDashboardGestor
);
router.get(
  '/gestor-ug/indicadores-dashboard',
  authMiddleware,
  getIndicadoresDashboardGestorUG
);
router.get(
  '/analista/indicadores-dashboard',
  authMiddleware,
  getIndicadoresDashboardAnalista
);
router.post(
  '/admin/servidor/inserir',
  authMiddleware,
  inserirServidorUsuarioAdmin
);
router.get('/registrados', authMiddleware, listarRequerimentosRegistrados);
router.get('/unidades-gestora', authMiddleware, listarUnidadesGestora);
router.post('/distribuir', authMiddleware, distribuirRequerimento);

router.get(
  '/distribuidos-ug',
  authMiddleware,
  listarRequerimentosDistribuidosParaUG
);
router.get(
  '/gestor-ug/requerimentos-concluidos',
  authMiddleware,
  listarRequerimentosConcluidosParaUG
);
router.get(
  '/gestor-ug/requerimento/:reqId/para-resposta',
  authMiddleware,
  obterDetalheRequerimentoParaRespostaUG
);
router.post(
  '/gestor-ug/requerimento/:reqId/devolver',
  authMiddleware,
  devolverRequerimentoUG
);
router.post(
  '/gestor-ug/requerimento/:reqId/confirmar-resposta',
  authMiddleware,
  uploadConclusaoAnexos,
  confirmarRespostaRequerimentoUG
);
router.get('/analistas-ug', authMiddleware, listarAnalistasDaUG);
router.post('/delegar', authMiddleware, delegarRequerimento);

router.get('/analista/para-analise', authMiddleware, listarRequerimentosParaAnalista);
router.get(
  '/analista/para-conclusao',
  authMiddleware,
  listarRequerimentosParaConclusao
);
router.post(
  '/analista/concluir',
  authMiddleware,
  uploadConclusaoAnexos,
  concluirRequerimentosComoAnalista
);
router.post(
  '/analista/delegar-requerimentos',
  authMiddleware,
  delegarRequerimentosComoAnalista
);
router.post(
  '/analista/requerimento/:reqId/abrir-analise',
  authMiddleware,
  abrirAnaliseRequerimento
);
router.post(
  '/analista/requerimento/:reqId/planejar-execucao',
  authMiddleware,
  planejarExecucaoComoAnalista
);

module.exports = router;

