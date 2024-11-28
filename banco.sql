USE mogxch_banco;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE procedimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE leituras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedimento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    observacoes VARCHAR(255),
    FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_remetente INT NOT NULL,
    login_destinatario INT NOT NULL,
    numero_procedimento VARCHAR(30) NOT NULL,
    status ENUM('pendente', 'aceita', 'recusada') NOT NULL,
    FOREIGN KEY (login_remetente) REFERENCES usuarios(id),
    FOREIGN KEY (login_destinatario) REFERENCES usuarios(id)
);
