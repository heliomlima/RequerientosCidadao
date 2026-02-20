const express = require('express');
const router = express.Router();
const requerimentoController = require('../controllers/requerimentoController');

router.get('/', requerimentoController.listarPorUsuario);
router.get('/:id', requerimentoController.buscarPorId);
router.post('/', requerimentoController.criar);
router.put('/:id', requerimentoController.atualizar);
router.delete('/:id', requerimentoController.deletar);
router.post('/:id/resposta', requerimentoController.adicionarResposta);

module.exports = router;