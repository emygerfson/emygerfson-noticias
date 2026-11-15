
-- =========================================
-- BANCO DE DADOS: EMYGERFSON NOTICIAS
-- =========================================

-- 1. TABELA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE NOTÍCIAS
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,

    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    resumo VARCHAR(500) NOT NULL,
    conteudo TEXT NOT NULL,

    categoria VARCHAR(100) NOT NULL,
    imagem_url TEXT,

    fonte VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'rascunho'
        CHECK (status IN ('rascunho', 'publicada', 'arquivada')),

    autor_id INTEGER NOT NULL
        REFERENCES admins(id)
        ON DELETE RESTRICT,

    publicada_em TIMESTAMP,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ÍNDICES PARA MELHORAR AS CONSULTAS
CREATE INDEX IF NOT EXISTS idx_noticias_status
ON noticias(status);

CREATE INDEX IF NOT EXISTS idx_noticias_categoria
ON noticias(categoria);

CREATE INDEX IF NOT EXISTS idx_noticias_publicada_em
ON noticias(publicada_em DESC);

CREATE INDEX IF NOT EXISTS idx_noticias_autor
ON noticias(autor_id);

-- =========================================
-- FIM DA ESTRUTURA
-- =========================================
-- =========================================
-- MENSAGENS RECEBIDAS PELO PORTAL
-- =========================================

CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    email VARCHAR(180),

    telefone VARCHAR(30),

    bairro VARCHAR(120),

    tipo VARCHAR(50) NOT NULL,

    assunto VARCHAR(200),

    mensagem TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'nova'
        CHECK (status IN ('nova', 'em_analise', 'respondida', 'arquivada')),

    consentimento BOOLEAN NOT NULL DEFAULT FALSE,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para facilitar a busca por status.
CREATE INDEX IF NOT EXISTS idx_mensagens_status
ON mensagens(status);

-- Índice para ordenar mensagens por data.
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em
ON mensagens(criado_em DESC);