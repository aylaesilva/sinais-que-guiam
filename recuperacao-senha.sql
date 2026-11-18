USE sinais_que_guiam;

-- ==================================================
-- Tabela: recuperacao_senha
-- Guarda o código de 6 dígitos (criptografado) para redefinir a senha
-- ==================================================
CREATE TABLE IF NOT EXISTS recuperacao_senha (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira_em DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  tentativas INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);