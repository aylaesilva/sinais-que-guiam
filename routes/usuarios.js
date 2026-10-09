const express = require('express');
const db = require('../db');

const router = express.Router();

const TAMANHOS_FONTE = ['P', 'M', 'G', 'XG', 'XXG'];
const VELOCIDADES_VOZ = ['0.5x', '1.0x', '2.0x'];
const TEMAS = ['claro', 'escuro'];

// GET /api/usuarios/:id  -> dados do perfil + preferências (nunca devolve a senha)
router.get('/:id', async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT id, nome, email, telefone, tipo_deficiencia,
              alto_contraste, vibracao, tamanho_fonte, velocidade_voz, tema, idioma
       FROM usuario WHERE id = ?`,
      [req.params.id]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ usuario: usuarios[0] });
  } catch (erro) {
    console.error('Erro ao buscar usuário:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao buscar o usuário.' });
  }
});

// PUT /api/usuarios/:id  { nome, telefone, tipo_deficiencia }
router.put('/:id', async (req, res) => {
  const { nome, telefone, tipo_deficiencia } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome não pode ficar vazio.' });
  }

  try {
    const [resultado] = await db.query(
      'UPDATE usuario SET nome = ?, telefone = ?, tipo_deficiencia = ? WHERE id = ?',
      [nome.trim(), telefone || null, tipo_deficiencia || null, req.params.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Dados atualizados com sucesso.' });
  } catch (erro) {
    console.error('Erro ao atualizar usuário:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao atualizar os dados.' });
  }
});

// PUT /api/usuarios/:id/preferencias
router.put('/:id/preferencias', async (req, res) => {
  const { alto_contraste, vibracao, tamanho_fonte, velocidade_voz, tema, idioma } = req.body;

  if (!TAMANHOS_FONTE.includes(tamanho_fonte)) {
    return res.status(400).json({ erro: 'Tamanho de fonte inválido.' });
  }
  if (!VELOCIDADES_VOZ.includes(velocidade_voz)) {
    return res.status(400).json({ erro: 'Velocidade de voz inválida.' });
  }
  if (!TEMAS.includes(tema)) {
    return res.status(400).json({ erro: 'Tema inválido.' });
  }

  try {
    const [resultado] = await db.query(
      `UPDATE usuario
       SET alto_contraste = ?, vibracao = ?, tamanho_fonte = ?,
           velocidade_voz = ?, tema = ?, idioma = ?
       WHERE id = ?`,
      [!!alto_contraste, !!vibracao, tamanho_fonte, velocidade_voz, tema, idioma || 'pt-BR', req.params.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Preferências salvas.' });
  } catch (erro) {
    console.error('Erro ao salvar preferências:', erro.message);
    res.status(500).json({ erro: 'Erro interno ao salvar as preferências.' });
  }
});

module.exports = router;