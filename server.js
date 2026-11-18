const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const rotasAuth = require('./routes/auth');
const rotasRecuperacao = require('./routes/recuperacao');
const rotasLivros = require('./routes/livros');
const rotasFavoritos = require('./routes/favoritos');
const rotasHistorico = require('./routes/historico');
const rotasAjuda = require('./routes/ajuda');
const rotasUsuarios = require('./routes/usuarios');
const rotasReservas = require('./routes/reservas');
const rotasEstantes = require('./routes/estantes');

if (!process.env.SESSION_SECRET) {
  console.error('Falta a linha SESSION_SECRET no arquivo .env (veja o .env.example).');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===== Sessão: o servidor lembra quem fez login por um cookie =====
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,            // o JavaScript da página não consegue ler o cookie
    sameSite: 'lax',
    secure: false,             // trocar para true quando o site usar HTTPS
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
  },
}));

// ===== Páginas que podem ser abertas sem login =====
const PAGINAS_PUBLICAS = [
  '/', '/index.html', '/login.html', '/cadastro.html',
  '/esqueceu-senha.html', '/codigo.html', '/redefinir-senha.html',
];

app.use((req, res, next) => {
  const ehPagina = req.path === '/' || req.path.endsWith('.html');
  if (ehPagina && !PAGINAS_PUBLICAS.includes(req.path) && !req.session.usuarioId) {
    return res.redirect('/login.html');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ===== Rotas públicas =====
app.use('/api', rotasAuth); // cadastro, login, me e logout
app.use('/api/recuperacao', rotasRecuperacao); // esqueci minha senha

app.get('/api/status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ servidor: 'ok', banco: 'conectado' });
  } catch (erro) {
    console.error('Erro ao conectar ao banco:', erro.message);
    res.status(500).json({ servidor: 'ok', banco: 'erro', detalhes: erro.message });
  }
});

// ===== A partir daqui, só com login =====
function exigirLogin(req, res, next) {
  if (!req.session.usuarioId) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }
  next();
}

app.use('/api', exigirLogin);
app.use('/api/livros', rotasLivros);
app.use('/api/favoritos', rotasFavoritos);
app.use('/api/historico', rotasHistorico);
app.use('/api/ajuda', rotasAjuda);
app.use('/api/usuarios', rotasUsuarios);
app.use('/api/reservas', rotasReservas);
app.use('/api/estantes', rotasEstantes);

// Qualquer /api/... que não existe responde em JSON (em vez de uma página de erro)
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});