const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const requerimentoRoutes = require('./routes/requerimentos');
const usuariosRoutes = require('./routes/usuarios');
const usuariosServidorRoutes = require('./routes/usuariosServidor');

// Configuração
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rotas da API
app.use('/api/requerimentos', requerimentoRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/usuarios-servidor', usuariosServidorRoutes);
app.use('/api/requerimentos-servidor', require('./routes/requerimentosServidor'));

// Rota principal - Servir o HTML
//app.get('/', (req, res) => {
//    res.sendFile(path.join(__dirname, 'views', 'index.html'));
//});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📁 API: http://localhost:${PORT}/api/requerimentos`);
});