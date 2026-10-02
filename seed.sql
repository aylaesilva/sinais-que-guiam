USE sinais_que_guiam;

INSERT INTO estante (codigo, corredor, prateleira, qr_code) VALUES
('A3', 'Corredor 2', 'Prateleira 4', 'QR-A3-001'),
('B3', 'Corredor 1', 'Prateleira 2', 'QR-B3-001'),
('C6', 'Corredor 4', 'Prateleira 1', 'QR-C6-001'),
('D5', 'Corredor 2', 'Prateleira 3', 'QR-D5-001');

INSERT INTO livro (titulo, autor, categoria, resumo, capa_url, disponivel, estante_id) VALUES
('Engenharia de Software', 'Ian Sommerville', 'Tecnologia',
 'A 10ª edição de Engenharia de software foi extensivamente atualizada para refletir a adoção crescente de métodos ágeis na engenharia de software. Um dos destaques da nova edição é o acréscimo de conteúdo sobre a metodologia Scrum.',
 '', TRUE, (SELECT id FROM estante WHERE codigo = 'A3')),
('Logística para iniciantes', 'LF Chiacherini', 'Tecnologia',
 'Uma introdução prática aos conceitos fundamentais de logística e cadeia de suprimentos.',
 '', TRUE, (SELECT id FROM estante WHERE codigo = 'B3')),
('Banco de dados: teoria e desenvolvimento', 'William Pereira Alves', 'Tecnologia',
 'Conceitos fundamentais de modelagem e desenvolvimento de bancos de dados relacionais.',
 '', FALSE, (SELECT id FROM estante WHERE codigo = 'C6')),
('Redes de Computadores', 'Andrew Tanenbaum', 'Tecnologia',
 'Referência clássica sobre arquitetura e protocolos de redes de computadores.',
 '', TRUE, (SELECT id FROM estante WHERE codigo = 'D5'));