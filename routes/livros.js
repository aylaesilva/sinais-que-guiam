const express = require('express');
const db = require('../db');

const router = express.Router();
const LIMITE_RESERVAS_ATIVAS = 3;

// ===== GET /api/livros?busca=...&filtro=titulo|autor|categoria =====
router.get('/', async (req, res) => {
  const { busca, filtro } = req.query;

  try {
    let sql = `
      SELECT l.*, e.codigo AS estante, e.corredor
      FROM livro l
      JOIN estante e ON e.id = l.estante_id
    `;
    const parametros = [];

    if (busca) {
      const coluna = filtro === 'titulo' ? 'l.titulo'
        : filtro === 'autor' ? 'l.autor'
        : filtro === 'categoria' ? 'l.categoria'
        : null;

      if (coluna) {
        sql += ` WHERE ${coluna} LIKE ?`;
        parametros.push(`%${busca}%`);
      } else {
        sql += ` WHERE l.titulo LIKE ? OR l.autor LIKE ? OR l.categoria LIKE ?`;
        parametros.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
      }
    }

    sql += ' ORDER BY l.titulo';

    const [livros] = await db.query(sql, parametros);
    res.json({ total: livros.length, livros });
  } catch (erro) {
    console.error('Erro ao buscar livros:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao buscar livros.' });
  }
});

// ===== GET /api/livros/recentes =====
router.get('/recentes', async (req, res) => {
  try {
    const [livros] = await db.query(`
      SELECT l.*, e.codigo AS estante, e.corredor
      FROM livro l
      JOIN estante e ON e.id = l.estante_id
      ORDER BY l.id DESC
      LIMIT 5
    `);
    res.json({ livros });
  } catch (erro) {
    console.error('Erro ao buscar livros recentes:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao buscar livros recentes.' });
  }
});

// ===== GET /api/livros/:id =====
router.get('/:id', async (req, res) => {
  try {
    const [livros] = await db.query(`
      SELECT l.*, e.codigo AS estante, e.corredor, e.prateleira
      FROM livro l
      JOIN estante e ON e.id = l.estante_id
      WHERE l.id = ?
    `, [req.params.id]);

    if (livros.length === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    res.json({ livro: livros[0] });
  } catch (erro) {
    console.error('Erro ao buscar livro:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao buscar o livro.' });
  }
});

// ===== POST /api/livros/:id/reserva =====
router.post('/:id/reserva', async (req, res) => {
  const usuarioId = req.session.usuarioId;
  const livroId = req.params.id;

  try {
    const [livros] = await db.query('SELECT id FROM livro WHERE id = ?', [livroId]);
    if (livros.length === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    const [usuarios] = await db.query('SELECT nome FROM usuario WHERE id = ?', [usuarioId]);
    if (usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // Limite de reservas ativas por pessoa
    const [ativas] = await db.query(
      `SELECT COUNT(*) AS total FROM reserva WHERE usuario_id = ? AND status = 'ativa'`,
      [usuarioId]
    );
    if (ativas[0].total >= LIMITE_RESERVAS_ATIVAS) {
      return res.status(409).json({
        erro: `Você já tem ${LIMITE_RESERVAS_ATIVAS} reservas ativas. Devolva um livro para reservar outro.`,
      });
    }

    // "Pega" o livro numa única instrução: só funciona se ele ainda estiver disponível.
    // Assim, duas pessoas não conseguem reservar o mesmo livro ao mesmo tempo.
    const [pegou] = await db.query(
      'UPDATE livro SET disponivel = FALSE WHERE id = ? AND disponivel = TRUE',
      [livroId]
    );
    if (pegou.affectedRows === 0) {
      return res.status(409).json({ erro: 'Este livro não está disponível no momento.' });
    }

    const codigoReserva = 'RES-' + Date.now().toString().slice(-8);
    const dataEmprestimo = new Date();
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 14); // 14 dias de empréstimo

    try {
      await db.query(
        `INSERT INTO reserva (codigo_reserva, usuario_id, livro_id, data_emprestimo, data_devolucao)
         VALUES (?, ?, ?, ?, ?)`,
        [codigoReserva, usuarioId, livroId, dataEmprestimo, dataDevolucao]
      );
    } catch (erroInsert) {
      // Se não conseguiu registrar a reserva, devolve o livro para "disponível"
      await db.query('UPDATE livro SET disponivel = TRUE WHERE id = ?', [livroId]);
      throw erroInsert;
    }

    res.status(201).json({
      codigo_reserva: codigoReserva,
      data_emprestimo: dataEmprestimo.toLocaleDateString('pt-BR'),
      data_devolucao: dataDevolucao.toLocaleDateString('pt-BR'),
      nome_usuario: usuarios[0].nome,
    });
  } catch (erro) {
    console.error('Erro ao reservar livro:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao reservar o livro.' });
  }
});

// ===== POST /api/livros/:id/favorito =====
router.post('/:id/favorito', async (req, res) => {
  try {
    await db.query(
      'INSERT IGNORE INTO favorito (usuario_id, livro_id) VALUES (?, ?)',
      [req.session.usuarioId, req.params.id]
    );
    res.status(201).json({ mensagem: 'Livro adicionado aos favoritos.' });
  } catch (erro) {
    console.error('Erro ao favoritar:', erro.message);
    res.status(500).json({ erro: 'Erro ao favoritar o livro.' });
  }
});

// ===== DELETE /api/livros/:id/favorito =====
router.delete('/:id/favorito', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorito WHERE usuario_id = ? AND livro_id = ?',
      [req.session.usuarioId, req.params.id]
    );
    res.json({ mensagem: 'Livro removido dos favoritos.' });
  } catch (erro) {
    console.error('Erro ao remover favorito:', erro.message);
    res.status(500).json({ erro: 'Erro ao remover o favorito.' });
  }
});

module.exports = router;