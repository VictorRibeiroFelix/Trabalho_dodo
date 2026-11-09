-- Este script roda automaticamente na PRIMEIRA vez que o contêiner do
-- Postgres sobe com o volume vazio (imagens oficiais do Postgres executam
-- tudo que está em /docker-entrypoint-initdb.d/).
-- O backend também cria a tabela via "CREATE TABLE IF NOT EXISTS", então
-- este arquivo é redundante de propósito, só para você ver as duas formas.

CREATE TABLE IF NOT EXISTS avistamentos (
    id SERIAL PRIMARY KEY,
    especie TEXT NOT NULL,
    local TEXT NOT NULL,
    observacoes TEXT,
    avistado_em TIMESTAMP DEFAULT NOW()
);
