const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/reservas  -> reservas do usuário logado
router.get('/', async (req, res) => {
  try {
    const [reservas] = await db.query(
      `SELECT r.id, r.codigo_reserva, r.status, r.data_emprestimo, r.data_devolucao,
              l.id AS livro_id, l.titulo, l.autor,
              e.codigo AS estante, e.corredor
       FROM reserva r
       JOIN livro l ON l.id = r.livro_id
       JOIN estante e ON e.id = l.estante_id
       WHERE r.usuario_id = ?
       ORDER BY r.status = 'ativa' DESC, r.id DESC`,
      [req.session.usuarioId]
    );
    res.json({ total: reservas.length, reservas });
  } catch (erro) {
    console.error('Erro ao listar reservas:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar as reservas.' });
  }
});

// POST /api/reservas/:id/devolver
router.post('/:id/devolver', async (req, res) => {
  try {
    const [reservas] = await db.query(
      `SELECT id, livro_id FROM reserva
       WHERE id = ? AND usuario_id = ? AND status = 'ativa'`,
      [req.params.id, req.session.usuarioId]
    );
    if (reservas.length === 0) {
      return res.status(404).json({ erro: 'Reserva ativa não encontrada.' });
    }

    await db.query(`UPDATE reserva SET status = 'devolvida' WHERE id = ?`, [reservas[0].id]);
    await db.query('UPDATE livro SET disponivel = TRUE WHERE id = ?', [reservas[0].livro_id]);

    res.json({ mensagem: 'Livro devolvido. Obrigado!' });
  } catch (erro) {
    console.error('Erro ao devolver livro:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao devolver o livro.' });
  }
});

module.exports = router;