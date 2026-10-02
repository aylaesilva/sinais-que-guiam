console.log('ROTAS DE LIVROS CARREGADAS');
const express = require('express');
const db = require('../db');

const router = express.Router();

// ===== GET /api/livros?busca=...&filtro=titulo|autor|categoria =====
router.get('/', async (req, res) => {
    console.log('ROTA GET /api/livros FOI CHAMADA');
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
  const { usuario_id } = req.body;
  const livroId = req.params.id;

  if (!usuario_id) {
    return res.status(400).json({ erro: 'Usuário não identificado.' });
  }

  try {
    const [livros] = await db.query('SELECT * FROM livro WHERE id = ?', [livroId]);
    if (livros.length === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }
    if (!livros[0].disponivel) {
      return res.status(409).json({ erro: 'Este livro não está disponível no momento.' });
    }

    const codigoReserva = 'RES-' + Date.now().toString().slice(-8);
    const dataEmprestimo = new Date();
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 14); // 14 dias de empréstimo

    await db.query(
      `INSERT INTO reserva (codigo_reserva, usuario_id, livro_id, data_emprestimo, data_devolucao)
       VALUES (?, ?, ?, ?, ?)`,
      [codigoReserva, usuario_id, livroId, dataEmprestimo, dataDevolucao]
    );

    await db.query('UPDATE livro SET disponivel = FALSE WHERE id = ?', [livroId]);

    const [[usuario]] = await db.query('SELECT nome FROM usuario WHERE id = ?', [usuario_id]);

    res.status(201).json({
      codigo_reserva: codigoReserva,
      data_emprestimo: dataEmprestimo.toLocaleDateString('pt-BR'),
      data_devolucao: dataDevolucao.toLocaleDateString('pt-BR'),
      nome_usuario: usuario.nome,
    });
  } catch (erro) {
    console.error('Erro ao reservar livro:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao reservar o livro.' });
  }
});

// ===== POST /api/livros/:id/favorito =====
router.post('/:id/favorito', async (req, res) => {
  const { usuario_id } = req.body;
  try {
    await db.query(
      'INSERT IGNORE INTO favorito (usuario_id, livro_id) VALUES (?, ?)',
      [usuario_id, req.params.id]
    );
    res.status(201).json({ mensagem: 'Livro adicionado aos favoritos.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao favoritar o livro.' });
  }
});

// ===== DELETE /api/livros/:id/favorito =====
router.delete('/:id/favorito', async (req, res) => {
  const { usuario_id } = req.body;
  try {
    await db.query(
      'DELETE FROM favorito WHERE usuario_id = ? AND livro_id = ?',
      [usuario_id, req.params.id]
    );
    res.json({ mensagem: 'Livro removido dos favoritos.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover o favorito.' });
  }
});

module.exports = router;