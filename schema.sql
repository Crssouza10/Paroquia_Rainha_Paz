-- ==============================================================================
-- Schema SQL: Gestão de Convites de Almoço e Controle Financeiro por Comunidade
-- Compatível com Neon Serverless Postgres / PostgreSQL 14+
-- ==============================================================================

-- 1. Tabela de Configurações Gerais
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    total_tickets INT NOT NULL DEFAULT 1000,
    demo_seeded BOOLEAN NOT NULL DEFAULT FALSE
);

-- Garante que a coluna demo_seeded exista caso tabela já exista
ALTER TABLE settings ADD COLUMN IF NOT EXISTS demo_seeded BOOLEAN NOT NULL DEFAULT FALSE;

-- Inserir configuração padrão inicial caso não exista
INSERT INTO settings (id, ticket_price, total_tickets, demo_seeded)
VALUES (1, 25.00, 1000, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Comunidades
CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    leader_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Convites (Tickets de 1 a 1000)
CREATE TABLE IF NOT EXISTS tickets (
    number INT PRIMARY KEY,
    community_id INT REFERENCES communities(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'ENTREGUE', 'VENDIDO', 'DEVOLVIDO')),
    buyer_name VARCHAR(255),
    buyer_phone VARCHAR(50),
    payment_method VARCHAR(20),
    sold_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garantir colunas e constraints caso tabela já exista no Neon
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Índices para otimização de busca rápida de convites por comunidade, status e comprador
CREATE INDEX IF NOT EXISTS idx_tickets_community_id ON tickets(community_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_name);

-- 4. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('DINHEIRO', 'PIX', 'CREDITO', 'PENDENTE')),
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para histórico financeiro rápido por comunidade
CREATE INDEX IF NOT EXISTS idx_payments_community_id ON payments(community_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

-- ==============================================================================
-- Função e Procedimento para Inicialização/Seed dos 1000 Convites e Amostra Única
-- ==============================================================================
DO $$
DECLARE
    v_id1 INT;
    v_id2 INT;
BEGIN
    -- 1. Criação dos 1.000 convites (apenas se a tabela tickets estiver totalmente vazia)
    IF NOT EXISTS (SELECT 1 FROM tickets LIMIT 1) THEN
        INSERT INTO tickets (number, status, updated_at)
        SELECT s, 'DISPONIVEL', CURRENT_TIMESTAMP
        FROM generate_series(1, 1000) AS s;
    END IF;

    -- 2. Amostra inicial de comunidades: APENAS SE demo_seeded AINDA FOR FALSE!
    -- Nunca recriar se o usuário tiver excluído as comunidades para cadastrar as reais!
    IF EXISTS (SELECT 1 FROM settings WHERE id = 1 AND demo_seeded = FALSE) AND NOT EXISTS (SELECT 1 FROM communities LIMIT 1) THEN
        INSERT INTO communities (name, leader_name, phone)
        VALUES ('Capela Perpétuo Socorro', 'Maria Aparecida da Silva', '(11) 98765-4321')
        RETURNING id INTO v_id1;

        INSERT INTO communities (name, leader_name, phone)
        VALUES ('Comunidade São José', 'Antônio Carlos dos Santos', '(11) 97654-3210')
        RETURNING id INTO v_id2;

        INSERT INTO communities (name, leader_name, phone)
        VALUES ('Comunidade Santa Rita de Cássia', 'Lúcia Helena Ferreira', '(11) 96543-2109');

        -- 50 convites (0001 a 0050) para Capela Perpétuo Socorro
        UPDATE tickets
        SET community_id = v_id1, status = 'ENTREGUE', updated_at = CURRENT_TIMESTAMP
        WHERE number >= 1 AND number <= 50;

        -- 30 convites (0051 a 0080) para Comunidade São José
        UPDATE tickets
        SET community_id = v_id2, status = 'ENTREGUE', updated_at = CURRENT_TIMESTAMP
        WHERE number >= 51 AND number <= 80;

        -- Pagamentos de amostra (Capela: Pix 500 + Dinheiro 250 = 750 / São José: Crédito 750)
        INSERT INTO payments (community_id, amount, payment_method, notes)
        VALUES
            (v_id1, 500.00, 'PIX', 'Adiantamento vendas do fim de semana'),
            (v_id1, 250.00, 'DINHEIRO', 'Entregue na secretaria paroquial'),
            (v_id2, 750.00, 'CREDITO', 'Pagamento integral da cota de convites');

        -- Marca que a demonstração foi semeada para NUNCA mais recriar se o usuário excluir
        UPDATE settings SET demo_seeded = TRUE WHERE id = 1;
    END IF;
END $$;
