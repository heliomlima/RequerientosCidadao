const express = require('express');
const router = express.Router();
const {
  primeiroAcessoServidor,
  loginServidor,
} = require('../controllers/usuariosServidorController');
const { getPerfilServidor } = require('../controllers/dashboardServidorController');

router.post('/primeiro-acesso', primeiroAcessoServidor);
router.post('/login', loginServidor);
router.post('/perfil', getPerfilServidor);

module.exports = router;