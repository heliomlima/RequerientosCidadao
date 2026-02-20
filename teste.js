
const express = require('express');
const app = express();
const PORT = 3000;

// Rota de teste simples  requerimentoscidadao-1dcb7101a580.json
app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});