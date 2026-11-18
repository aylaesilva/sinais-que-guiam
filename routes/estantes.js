const express = require('express');
const db = require('../db');

const router = express.Router();

// Monta o texto que o sistema pode LER EM VOZ ALTA para a pessoa
function montarDescricao(estante, livros) {
  const partes = [`Estante ${estante.codigo}, ${estante.corredor}`];
  if (estante.prateleira) partes.push(`prateleira ${estante.prateleira}`);
  partes.push(
    livros.length === 1 ? 'Esta estante tem 1 livro cadastrado' : `Esta estante tem ${livros.length} livros cadastrados`
  );
  return partes.join('. ') + '.';
}

async function buscarEstanteComLivros(condicao, valor, res) {
  const [estantes] = await db.query(`SELECT * FROM estante WHERE ${condicao}`, [valor]);
  if (estantes.length === 0) {
    return res.status(404).json({ erro: 'Estante não encontrada.' });
  }
  const estante = estantes[0];
  const [livros] = await db.query(
    'SELECT id, titulo, autor, categoria, disponivel FROM livro WHERE estante_id = ? ORDER BY titulo',
    [estante.id]
  );
  res.json({ estante, livros, descricao_voz: montarDescricao(estante, livros) });
}

// GET /api/estantes  -> lista todas as estantes (com quantidade de livros)
router.get('/', async (req, res) => {
  try {
    const [estantes] = await db.query(
      `SELECT e.id, e.codigo, e.corredor, e.prateleira, COUNT(l.id) AS total_livros
       FROM estante e
       LEFT JOIN livro l ON l.estante_id = e.id
       GROUP BY e.id
       ORDER BY e.codigo`
    );
    res.json({ total: estantes.length, estantes });
  } catch (erro) {
    console.error('Erro ao listar estantes:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao listar as estantes.' });
  }
});

// GET /api/estantes/qr/:codigo  -> resultado da leitura do QR code colado na estante
router.get('/qr/:codigo', async (req, res) => {
  try {
    await buscarEstanteComLivros('qr_code = ?', req.params.codigo, res);
  } catch (erro) {
    console.error('Erro ao ler QR da estante:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao ler o QR code.' });
  }
});

// GET /api/estantes/:id  -> uma estante e seus livros
router.get('/:id', async (req, res) => {
  try {
    await buscarEstanteComLivros('id = ?', req.params.id, res);
  } catch (erro) {
    console.error('Erro ao buscar estante:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao buscar a estante.' });
  }
});

module.exports = router;