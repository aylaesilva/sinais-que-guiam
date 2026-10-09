const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const rotasAuth = require('./routes/auth');
const rotasLivros = require('./routes/livros');
const rotasFavoritos = require('./routes/favoritos');
const rotasHistorico = require('./routes/historico');
const rotasAjuda = require('./routes/ajuda');
const rotasUsuarios = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middlewares =====
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Rotas da API =====
app.use('/api', rotasAuth);
app.use('/api/livros', rotasLivros);
app.use('/api/favoritos', rotasFavoritos);
app.use('/api/historico', rotasHistorico);
app.use('/api/ajuda', rotasAjuda);
app.use('/api/usuarios', rotasUsuarios);

// ===== Rota de teste: confirma se o servidor e o banco estão funcionando =====
app.get('/api/status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ servidor: 'ok', banco: 'conectado' });
  } catch (erro) {
    console.error('Erro ao conectar ao banco:', erro.message);
    res.status(500).json({ servidor: 'ok', banco: 'erro', detalhes: erro.message });
  }
});

// ===== Iniciar o servidor =====
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});