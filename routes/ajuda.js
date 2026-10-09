const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/ajuda  { usuario_id, local }
router.post('/', async (req, res) => {
  const { usuario_id, local } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ erro: 'Usuário não identificado.' });
  }

  try {
    // Evita pedidos duplicados: se já existe um pedido pendente nos últimos 10 minutos, não cria outro
    const [pendentes] = await db.query(
      `SELECT id FROM solicitacao_ajuda
       WHERE usuario_id = ? AND status = 'pendente'
         AND criado_em > NOW() - INTERVAL 10 MINUTE`,
      [usuario_id]
    );
    if (pendentes.length > 0) {
      return res.status(409).json({
        erro: 'Você já tem uma solicitação em andamento. Aguarde a chegada do ajudante.',
      });
    }

    await db.query(
      'INSERT INTO solicitacao_ajuda (usuario_id, local) VALUES (?, ?)',
      [usuario_id, local || null]
    );
    res.status(201).json({ mensagem: 'Solicitação enviada! Aguarde a chegada do ajudante.' });
  } catch (erro) {
    if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    console.error('Erro ao solicitar ajuda:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao solicitar ajuda.' });
  }
});

module.exports = router;