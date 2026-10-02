const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./db');
const rotasAuth = require('./routes/auth');
const rotasLivros = require('./routes/livros');
const app = express();
const PORT = process.env.PORT || 3000;


// ===== Middlewares =====
app.use(express.json()); // permite receber JSON no corpo das requisições (POST/PUT)
app.use(express.static(path.join(__dirname, 'public'))); // serve os arquivos de public/ (HTML, CSS, JS)
app.use('/api/livros', rotasLivros);
app.use('/api', rotasAuth);
app.get('/api/teste-direto', (req, res) => res.json({ funcionou: true }));

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

// As rotas da API (login, cadastro, busca de livros, etc.) entram aqui,
// nas próximas etapas (Etapa 18).

// ===== Iniciar o servidor =====
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
