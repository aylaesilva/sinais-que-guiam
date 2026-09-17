-- ==================================================
-- Banco de dados: Sinais que Guiam
-- ==================================================

CREATE DATABASE IF NOT EXISTS sinais_que_guiam
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sinais_que_guiam;

-- ==================================================
-- Tabela: usuario
-- ==================================================
CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  tipo_deficiencia VARCHAR(50),
  alto_contraste BOOLEAN NOT NULL DEFAULT FALSE,
  vibracao BOOLEAN NOT NULL DEFAULT FALSE,
  tamanho_fonte ENUM('P','M','G','XG','XXG') NOT NULL DEFAULT 'M',
  velocidade_voz ENUM('0.5x','1.0x','2.0x') NOT NULL DEFAULT '1.0x',
  tema ENUM('claro','escuro') NOT NULL DEFAULT 'claro',
  idioma VARCHAR(30) NOT NULL DEFAULT 'Português, Brasil',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- Tabela: estante
-- ==================================================
CREATE TABLE estante (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL,      -- Ex: A3
  corredor VARCHAR(50) NOT NULL,
  prateleira VARCHAR(50),
  qr_code VARCHAR(100) UNIQUE       -- código lido no QR físico da estante
);

-- ==================================================
-- Tabela: livro
-- ==================================================
CREATE TABLE livro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL,
  categoria VARCHAR(100),
  resumo TEXT,
  capa_url VARCHAR(255),
  disponivel BOOLEAN NOT NULL DEFAULT TRUE,
  estante_id INT NOT NULL,
  FOREIGN KEY (estante_id) REFERENCES estante(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- ==================================================
-- Tabela: reserva
-- ==================================================
CREATE TABLE reserva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_reserva VARCHAR(20) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  livro_id INT NOT NULL,
  data_emprestimo DATE NOT NULL,
  data_devolucao DATE NOT NULL,
  status ENUM('ativa','devolvida') NOT NULL DEFAULT 'ativa',
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (livro_id) REFERENCES livro(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- ==================================================
-- Tabela: favorito (chave primária composta)
-- ==================================================
CREATE TABLE favorito (
  usuario_id INT NOT NULL,
  livro_id INT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, livro_id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (livro_id) REFERENCES livro(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==================================================
-- Tabela: historico
-- ==================================================
CREATE TABLE historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo_acao VARCHAR(50) NOT NULL,   -- ex: 'busca', 'navegacao'
  referencia VARCHAR(100),          -- ex: id do livro ou estante
  descricao VARCHAR(255) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==================================================
-- Tabela: solicitacao_ajuda
-- ==================================================
CREATE TABLE solicitacao_ajuda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  local VARCHAR(100),
  status ENUM('pendente','atendida') NOT NULL DEFAULT 'pendente',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
