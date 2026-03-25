const express = require('express');
const router = express.Router();
const {
  primeiroAcessoServidor,
  loginServidor,
} = require('../controllers/usuariosServidorController');

router.post('/primeiro-acesso', primeiroAcessoServidor);
router.post('/login', loginServidor);

module.exports = router;