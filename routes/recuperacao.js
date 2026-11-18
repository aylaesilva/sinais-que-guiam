const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;
const MAX_TENTATIVAS = 5;
const MENSAGEM_PADRAO = 'Se o e-mail estiver cadastrado, um código de 6 dígitos foi enviado.';

// Confere o código. Devolve { ok: true, registro } ou { ok: false, status, erro }
async function validarCodigo(email, codigo) {
  const emailLimpo = (email || '').trim().toLowerCase();
  if (!emailLimpo || !codigo) {
    return { ok: false, status: 400, erro: 'Informe o e-mail e o código.' };
  }

  const [linhas] = await db.query(
    `SELECT r.id, r.codigo_hash, r.tentativas, r.usuario_id
     FROM recuperacao_senha r
     JOIN usuario u ON u.id = r.usuario_id
     WHERE u.email = ? AND r.usado = FALSE AND r.expira_em > NOW()
     ORDER BY r.id DESC LIMIT 1`,
    [emailLimpo]
  );

  const invalido = { ok: false, status: 400, erro: 'Código inválido ou expirado.' };
  if (linhas.length === 0) return invalido;

  const registro = linhas[0];
  if (registro.tentativas >= MAX_TENTATIVAS) {
    return { ok: false, status: 429, erro: 'Muitas tentativas. Peça um novo código.' };
  }

  const confere = await bcrypt.compare(String(codigo), registro.codigo_hash);
  if (!confere) {
    await db.query('UPDATE recuperacao_senha SET tentativas = tentativas + 1 WHERE id = ?', [registro.id]);
    return invalido;
  }
  return { ok: true, registro };
}

// POST /api/recuperacao/solicitar  { email }
router.post('/solicitar', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ erro: 'Informe o e-mail.' });
  }

  try {
    const [usuarios] = await db.query('SELECT id FROM usuario WHERE email = ?', [email]);

    if (usuarios.length > 0) {
      const codigo = String(crypto.randomInt(100000, 1000000)); // 6 dígitos
      const codigoHash = await bcrypt.hash(codigo, SALT_ROUNDS);

      // Cancela códigos antigos e cria o novo (vale 15 minutos)
      await db.query('UPDATE recuperacao_senha SET usado = TRUE WHERE usuario_id = ?', [usuarios[0].id]);
      await db.query(
        `INSERT INTO recuperacao_senha (usuario_id, codigo_hash, expira_em)
         VALUES (?, ?, NOW() + INTERVAL 15 MINUTE)`,
        [usuarios[0].id, codigoHash]
      );

      // SIMULAÇÃO: o projeto não envia e-mail de verdade, então o código aparece no terminal.
      console.log(`[RECUPERAÇÃO DE SENHA] Código para ${email}: ${codigo} (vale 15 minutos)`);
    }

    // Mesma resposta exista ou não o e-mail (não revela quem tem conta)
    res.json({ mensagem: MENSAGEM_PADRAO });
  } catch (erro) {
    console.error('Erro ao solicitar recuperação:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao solicitar o código.' });
  }
});

// POST /api/recuperacao/verificar  { email, codigo }
router.post('/verificar', async (req, res) => {
  try {
    const r = await validarCodigo(req.body.email, req.body.codigo);
    if (!r.ok) return res.status(r.status).json({ erro: r.erro });
    res.json({ mensagem: 'Código confirmado.' });
  } catch (erro) {
    console.error('Erro ao verificar código:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao verificar o código.' });
  }
});

// POST /api/recuperacao/redefinir  { email, codigo, nova_senha, confirmar_senha }
router.post('/redefinir', async (req, res) => {
  const { email, codigo, nova_senha, confirmar_senha } = req.body;

  if (!nova_senha || nova_senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' });
  }
  if (nova_senha !== confirmar_senha) {
    return res.status(400).json({ erro: 'As senhas não coincidem.' });
  }

  try {
    const r = await validarCodigo(email, codigo);
    if (!r.ok) return res.status(r.status).json({ erro: r.erro });

    const senhaHash = await bcrypt.hash(nova_senha, SALT_ROUNDS);
    await db.query('UPDATE usuario SET senha_hash = ? WHERE id = ?', [senhaHash, r.registro.usuario_id]);
    await db.query('UPDATE recuperacao_senha SET usado = TRUE WHERE usuario_id = ?', [r.registro.usuario_id]);

    res.json({ mensagem: 'Senha alterada com sucesso! Faça login.' });
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao redefinir a senha.' });
  }
});

module.exports = router;