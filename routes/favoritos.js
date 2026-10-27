const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/favoritos  -> livros favoritados pelo usuário logado
router.get('/', async (req, res) => {
  try {
    const [livros] = await db.query(
      `SELECT l.*, e.codigo AS estante, e.corredor
       FROM favorito f
       JOIN livro l ON l.id = f.livro_id
       JOIN estante e ON e.id = l.estante_id
       WHERE f.usuario_id = ?
       ORDER BY f.criado_em DESC`,
      [req.session.usuarioId]
    );
    res.json({ total: livros.length, livros });
  } catch (erro) {
    console.error('Erro ao listar favoritos:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar favoritos.' });
  }
});

// GET /api/favoritos/ids  -> só os ids (para pintar as estrelas na Busca)
router.get('/ids', async (req, res) => {
  try {
    const [linhas] = await db.query(
      'SELECT livro_id FROM favorito WHERE usuario_id = ?',
      [req.session.usuarioId]
    );
    res.json({ ids: linhas.map((l) => l.livro_id) });
  } catch (erro) {
    console.error('Erro ao listar ids de favoritos:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar favoritos.' });
  }
});

module.exports = router;