const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/ajuda  { local }
router.post('/', async (req, res) => {
  const { local } = req.body;
  const usuarioId = req.session.usuarioId;

  try {
    // Evita pedidos duplicados: se já existe um pedido pendente nos últimos 10 minutos, não cria outro
    const [pendentes] = await db.query(
      `SELECT id FROM solicitacao_ajuda
       WHERE usuario_id = ? AND status = 'pendente'
         AND criado_em > NOW() - INTERVAL 10 MINUTE`,
      [usuarioId]
    );
    if (pendentes.length > 0) {
      return res.status(409).json({
        erro: 'Você já tem uma solicitação em andamento. Aguarde a chegada do ajudante.',
      });
    }

    await db.query(
      'INSERT INTO solicitacao_ajuda (usuario_id, local) VALUES (?, ?)',
      [usuarioId, local || null]
    );
    res.status(201).json({ mensagem: 'Solicitação enviada! Aguarde a chegada do ajudante.' });
  } catch (erro) {
    console.error('Erro ao solicitar ajuda:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao solicitar ajuda.' });
  }
});

// GET /api/ajuda/minhas  -> últimas solicitações do usuário logado
router.get('/minhas', async (req, res) => {
  try {
    const [solicitacoes] = await db.query(
      `SELECT id, local, status, criado_em
       FROM solicitacao_ajuda
       WHERE usuario_id = ?
       ORDER BY id DESC
       LIMIT 10`,
      [req.session.usuarioId]
    );
    res.json({ total: solicitacoes.length, solicitacoes });
  } catch (erro) {
    console.error('Erro ao listar solicitações:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar as solicitações.' });
  }
});

// PUT /api/ajuda/:id/atendida  -> a pessoa confirma que o ajudante chegou
router.put('/:id/atendida', async (req, res) => {
  try {
    const [resultado] = await db.query(
      `UPDATE solicitacao_ajuda SET status = 'atendida'
       WHERE id = ? AND usuario_id = ? AND status = 'pendente'`,
      [req.params.id, req.session.usuarioId]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Solicitação pendente não encontrada.' });
    }
    res.json({ mensagem: 'Solicitação marcada como atendida.' });
  } catch (erro) {
    console.error('Erro ao atualizar solicitação:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao atualizar a solicitação.' });
  }
});

module.exports = router;