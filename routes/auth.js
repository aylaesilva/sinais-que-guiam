const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ===== POST /api/cadastro =====
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, confirmar_senha, telefone, tipo_deficiencia } = req.body;

  if (!nome || !email || !senha || !confirmar_senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }
  if (senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' });
  }
  if (senha !== confirmar_senha) {
    return res.status(400).json({ erro: 'As senhas não coincidem.' });
  }

  try {
    const [existentes] = await db.query('SELECT id FROM usuario WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    await db.query(
      `INSERT INTO usuario (nome, email, senha_hash, telefone, tipo_deficiencia)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, email, senhaHash, telefone, tipo_deficiencia]
    );

    res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
  } catch (erro) {
    console.error('Erro no cadastro:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao criar a conta.' });
  }
});

// ===== POST /api/login =====
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  try {
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    // Cria uma sessão nova a cada login (evita reaproveitar uma sessão antiga)
    req.session.regenerate((erroSessao) => {
      if (erroSessao) {
        console.error('Erro ao criar a sessão:', erroSessao.message);
        return res.status(500).json({ erro: 'Erro interno ao fazer login.' });
      }

      req.session.usuarioId = usuario.id;

      res.json({
        mensagem: 'Login realizado com sucesso!',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo_deficiencia: usuario.tipo_deficiencia,
        },
      });
    });
  } catch (erro) {
    console.error('Erro no login:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

// ===== POST /api/logout =====
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ mensagem: 'Sessão encerrada.' });
  });
});

module.exports = router;