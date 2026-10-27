const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testa a conexão assim que o servidor liga e mostra o motivo real se falhar
pool.getConnection()
  .then((conexao) => {
    console.log('Banco de dados conectado.');
    conexao.release();
  })
  .catch((erro) => {
    console.error('NÃO CONECTOU AO BANCO:', erro.code || erro.message);
  });

module.exports = pool;