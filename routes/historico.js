const express = require('express');
const db = require('../db');

const router = express.Router();

const TIPOS_VALIDOS = ['busca', 'navegacao'];

// Transforma a data do banco em "Hoje, 13:47", "Ontem, 16:18", "Terça-feira, 09:30"...
function formatarData(data) {
  const d = new Date(data);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;

  const dias = (hoje - d) / (1000 * 60 * 60 * 24);
  if (dias < 7) {
    const dia = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${hora}`;
  }
  return `${d.toLocaleDateString('pt-BR')}, ${hora}`;
}

// GET /api/historico?usuario_id=1
router.get('/', async (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ erro: 'Usuário não identificado.' });
  }

  try {
    const [itens] = await db.query(
      `SELECT id, tipo_acao, referencia, descricao, criado_em
       FROM historico
       WHERE usuario_id = ?
       ORDER BY criado_em DESC
       LIMIT 30`,
      [usuario_id]
    );

    const historico = itens.map((item) => ({
      ...item,
      data_formatada: formatarData(item.criado_em),
    }));

    res.json({ total: historico.length, historico });
  } catch (erro) {
    console.error('Erro ao listar histórico:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar o histórico.' });
  }
});

// POST /api/historico  { usuario_id, tipo_acao, referencia, descricao }
router.post('/', async (req, res) => {
  const { usuario_id, tipo_acao, referencia, descricao } = req.body;

  if (!usuario_id || !tipo_acao || !descricao) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }
  if (!TIPOS_VALIDOS.includes(tipo_acao)) {
    return res.status(400).json({ erro: 'Tipo de ação inválido.' });
  }

  try {
    await db.query(
      `INSERT INTO historico (usuario_id, tipo_acao, referencia, descricao)
       VALUES (?, ?, ?, ?)`,
      [usuario_id, tipo_acao, referencia || null, descricao]
    );
    res.status(201).json({ mensagem: 'Registrado no histórico.' });
  } catch (erro) {
    if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    console.error('Erro ao registrar histórico:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao registrar no histórico.' });
  }
});

module.exports = router;