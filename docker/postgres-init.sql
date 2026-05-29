-- Inicialização do banco de dados AURA
-- Cria extensões necessárias

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- busca por similaridade de texto
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- busca sem acentos

-- Seed: dados de professores e disciplinas da FATEC Zona Sul
-- (Dados fictícios para demonstração — substituir com dados reais)

-- Os dados reais são inseridos via API de administração ou importação CSV
