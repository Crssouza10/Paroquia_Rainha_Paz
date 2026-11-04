# System Design Document (HLD & LLD)
## Plataforma de Gestão de Convites Numerados (0001 a 1000) e Conciliação Financeira por Comunidade
**Arquitetura Serverless (Vercel + Neon Serverless Postgres)**

---

## 1. Visão Geral da Arquitetura & Diagrama C4 / Fluxo de Dados

### 1.1 Diagrama de Arquitetura (Mermaid.js)

```mermaid
graph TD
    subgraph Client["Cliente / Navegador (Desktop & Mobile)"]
        UI["Interface React (Next.js 15 Client Components)"]
        Form["Formulários com useFormStatus & Idempotency Key"]
        CacheClient["Cache Local & Otimizações de Estado"]
    end

    subgraph VercelEdge["Vercel Global Edge Network"]
        EdgeRouting["Vercel CDN / Edge Routing"]
        SecHeaders["Security Headers & SSL Termination"]
    end

    subgraph VercelServerless["Vercel Serverless Compute (AWS us-east-1)"]
        RSC["React Server Components (RSC)<br/>Leitura SSR & Agregação"]
        Actions["Next.js Server Actions<br/>Mutações Transacionais & Validação Zod"]
        Reval["Next.js Cache Tag & revalidatePath"]
    end

    subgraph NeonCloud["Neon Serverless PostgreSQL (AWS us-east-1)"]
        Pooler["Neon Connection Pooler (PgBouncer HTTP/WS)"]
        ComputeNode["Neon Compute Node (vCPU auto-scaling / Scale-to-Zero)"]
        StorageEngine["Neon Cloud Storage Engine (WAL em S3 / LSM-tree)"]
        ViewEngine["Materialized / Standard Views (vw_community_financial_summary)"]
    end

    UI -->|HTTPS / HTTP2| EdgeRouting
    Form -->|POST Server Action| EdgeRouting
    EdgeRouting --> SecHeaders
    SecHeaders --> RSC
    SecHeaders --> Actions

    RSC -->|HTTP Query Fetch| Pooler
    Actions -->|Transações ACID (BEGIN/COMMIT)| Pooler
    Actions -.->|Dispara Invalidação| Reval
    Reval -.-> UI

    Pooler --> ComputeNode
    ComputeNode --> StorageEngine
    ComputeNode --> ViewEngine
```

### 1.2 Estratégia de Renderização Híbrida

1. **Leitura de Alta Performance via Server Components (RSC):**
   - A página principal (`app/page.tsx`) opera como React Server Component assíncrono.
   - As leituras de agregações do painel (`getDashboardConsolidationAction`) e a listagem de comunidades com saldos consultam diretamente a View SQL consolidada no Neon através de requisições stateless via `@neondatabase/serverless` sobre HTTP.
   - Não há overhead de hidratação no cliente para elementos estruturais estáticos, gerando First Contentful Paint (FCP) inferior a 600ms.

2. **Mutações Transacionais via Server Actions:**
   - Todas as operações de escrita (Associação de Lote, Devolução, Registro de Pagamento, Edição de Comunidade) são tratadas por funções de Server Actions marcadas com `'use server'`.
   - Executam sob contexto restrito de execução no servidor, com validação de payload via **Zod Schemas** e abertura de transação PostgreSQL com nível de isolamento adequado (`READ COMMITTED` com lock pessimista explícito).
   - Ao final bem-sucedido de cada transação, a função invoca `revalidatePath('/')`, provocando a revalidação imediata do cache do App Router para sincronização visual em tempo real sem recarregar a página.

---

## 2. Modelagem de Dados Relacional & Garantias ACID (Low-Level DB Design)

```sql
-- ==============================================================================
-- DDL DE PRODUÇÃO: GESTÃO DE CONVITES E CONCILIAÇÃO FINANCEIRA
-- ==============================================================================

-- 0. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Configurações Gerais (Singleton Pattern Estrito)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 25.00 CHECK (ticket_price > 0),
    total_tickets INT NOT NULL DEFAULT 1000 CHECK (total_tickets >= 1 AND total_tickets <= 10000),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id, ticket_price, total_tickets, is_locked)
VALUES (1, 25.00, 1000, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Comunidades
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    leader_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);

-- 3. Tipos Enumerados
DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('DISPONIVEL', 'ENTREGUE', 'DEVOLVIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('DINHEIRO', 'PIX', 'CREDITO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Tabela de Convites Numerados (0001 a 1000)
CREATE TABLE IF NOT EXISTS tickets (
    ticket_number INT PRIMARY KEY CHECK (ticket_number BETWEEN 1 AND 1000),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    status ticket_status_enum NOT NULL DEFAULT 'DISPONIVEL',
    assigned_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Compostos para Consultas em O(1) / Bitmap Index Scan
CREATE INDEX IF NOT EXISTS idx_tickets_community_status
ON tickets(community_id, status)
INCLUDE (ticket_number);

CREATE INDEX IF NOT EXISTS idx_tickets_status
ON tickets(status);

-- 5. Tabela de Pagamentos (Razão Financeiro Imutável)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_enum NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_community_created
ON payments(community_id, created_at DESC)
INCLUDE (amount, payment_method);

CREATE INDEX IF NOT EXISTS idx_payments_method
ON payments(payment_method);

-- 6. Database View de Consolidação Financeira (vw_community_financial_summary)
CREATE OR REPLACE VIEW vw_community_financial_summary AS
WITH ticket_metrics AS (
    SELECT
        c.id AS community_id,
        COUNT(t.ticket_number) FILTER (WHERE t.status = 'ENTREGUE') AS delivered_tickets_count,
        ARRAY_AGG(t.ticket_number ORDER BY t.ticket_number) FILTER (WHERE t.status = 'ENTREGUE') AS ticket_numbers
    FROM communities c
    LEFT JOIN tickets t ON t.community_id = c.id
    GROUP BY c.id
),
payment_metrics AS (
    SELECT
        c.id AS community_id,
        COALESCE(SUM(p.amount), 0.00) AS total_paid,
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'PIX'), 0.00) AS paid_pix,
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'DINHEIRO'), 0.00) AS paid_dinheiro,
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'CREDITO'), 0.00) AS paid_credito
    FROM communities c
    LEFT JOIN payments p ON p.community_id = c.id
    GROUP BY c.id
)
SELECT
    c.id,
    c.name,
    c.leader_name,
    c.phone,
    c.created_at,
    s.ticket_price,
    COALESCE(tm.delivered_tickets_count, 0) AS tickets_count,
    COALESCE(tm.ticket_numbers, ARRAY[]::INTEGER[]) AS ticket_numbers,
    ROUND((COALESCE(tm.delivered_tickets_count, 0) * s.ticket_price)::numeric, 2) AS total_tickets_value,
    pm.total_paid,
    pm.paid_pix,
    pm.paid_dinheiro,
    pm.paid_credito,
    ROUND(((COALESCE(tm.delivered_tickets_count, 0) * s.ticket_price) - pm.total_paid)::numeric, 2) AS balance_due,
    CASE
        WHEN COALESCE(tm.delivered_tickets_count, 0) = 0 AND pm.total_paid = 0 THEN 'SEM_CONVITES'
        WHEN ((COALESCE(tm.delivered_tickets_count, 0) * s.ticket_price) - pm.total_paid) <= 0 THEN 'QUITADO'
        WHEN pm.total_paid > 0 THEN 'PENDENTE_PARCIAL'
        ELSE 'EM_ABERTO'
    END AS financial_status
FROM communities c
CROSS JOIN settings s
LEFT JOIN ticket_metrics tm ON tm.community_id = c.id
LEFT JOIN payment_metrics pm ON pm.community_id = c.id
WHERE s.id = 1;
```

---

## 3. Controle de Concorrência e Transações Atômicas

### 3.1 Algoritmo de Associação de Lote com Trava Pessimista (`SELECT ... FOR UPDATE`)

Quando dois operadores tentam distribuir faixas sobrepostas simultaneamente, a atomicidade e o isolamento devem ser matematicamente garantidos:

```sql
CREATE OR REPLACE FUNCTION fn_assign_ticket_range(
    p_community_id UUID,
    p_start_num INT,
    p_end_num INT
) RETURNS JSONB AS $$
DECLARE
    v_conflicting_numbers INT[];
    v_conflicting_community_names TEXT[];
    v_total_updated INT;
BEGIN
    -- 1. Validação de Parâmetros
    IF p_start_num > p_end_num THEN
        RETURN jsonb_build_object('success', false, 'error', 'Número inicial maior que número final');
    END IF;

    -- 2. Lock Pessimista de Linhas no Intervalo
    -- Bloqueia as linhas contra modificações concorrentes até o COMMIT
    PERFORM ticket_number
    FROM tickets
    WHERE ticket_number BETWEEN p_start_num AND p_end_num
    FOR UPDATE;

    -- 3. Verificação de Conflitos (Convites já entregues para OUTRA comunidade)
    SELECT
        ARRAY_AGG(t.ticket_number),
        ARRAY_AGG(DISTINCT c.name)
    INTO
        v_conflicting_numbers,
        v_conflicting_community_names
    FROM tickets t
    JOIN communities c ON t.community_id = c.id
    WHERE t.ticket_number BETWEEN p_start_num AND p_end_num
      AND t.status = 'ENTREGUE'
      AND t.community_id <> p_community_id;

    -- 4. Abortar com Rollback se houver conflito
    IF v_conflicting_numbers IS NOT NULL AND array_length(v_conflicting_numbers, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONFLICT',
            'message', 'Existem convites já atribuídos a outra comunidade no intervalo especificado.',
            'conflicting_numbers', v_conflicting_numbers,
            'conflicting_communities', v_conflicting_community_names
        );
    END IF;

    -- 5. Execução da Atribuição
    UPDATE tickets
    SET
        community_id = p_community_id,
        status = 'ENTREGUE',
        assigned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE ticket_number BETWEEN p_start_num AND p_end_num;

    GET DIAGNOSTICS v_total_updated = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'assigned_count', v_total_updated,
        'start_number', p_start_num,
        'end_number', p_end_num
    );
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Fluxo de Devolução de Convites

A devolução pode ocorrer por **Faixa Numérica** ou por **Lista de Convites Específicos**:
1. O sistema adquire lock das linhas correspondentes (`FOR UPDATE`).
2. Valida se os convites de fato pertencem àquela comunidade.
3. Altera o status para `'DISPONIVEL'` e define `community_id = NULL`.
4. Devido à view `vw_community_financial_summary`, o total devido e o saldo devedor recalculam-se instantaneamente no banco sem necessidade de triggers complexos de atualização de saldo acumulado.

---

## 4. Contrato de API / Server Actions & Validação (Zod)

### 4.1 Schemas de Validação Zod

```typescript
import { z } from "zod";

export const SeedInitialTicketsSchema = z.object({
  unitPrice: z.number().positive("O preço unitário deve ser maior que zero").max(1000),
  totalTickets: z.number().int().min(100).max(5000).default(1000),
});

export const AssignTicketRangeSchema = z.object({
  communityId: z.string().uuid("ID de comunidade inválido"),
  startNum: z.number().int().min(1).max(1000),
  endNum: z.number().int().min(1).max(1000),
}).refine((data) => data.startNum <= data.endNum, {
  message: "O número inicial não pode ser superior ao final",
  path: ["endNum"],
});

export const ReturnTicketsSchema = z.object({
  communityId: z.string().uuid("ID de comunidade inválido"),
  ticketNumbers: z.array(z.number().int().min(1).max(1000)).min(1, "Selecione ao menos um convite"),
});

export const RegisterPaymentSchema = z.object({
  communityId: z.string().uuid("ID de comunidade inválido"),
  amount: z.number().positive("O valor do pagamento deve ser superior a zero"),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "CREDITO"]),
  notes: z.string().max(500, "Observações não podem ultrapassar 500 caracteres").optional(),
});
```

### 4.2 Assinaturas das Server Actions

```typescript
export type ActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; details?: unknown };

export async function seedInitialTicketsAction(
  input: z.infer<typeof SeedInitialTicketsSchema>
): Promise<ActionResponse<{ seededCount: number }>>;

export async function assignTicketRangeAction(
  input: z.infer<typeof AssignTicketRangeSchema>
): Promise<ActionResponse<{ assignedCount: number }>>;

export async function returnTicketsAction(
  input: z.infer<typeof ReturnTicketsSchema>
): Promise<ActionResponse<{ returnedCount: number }>>;

export async function registerPaymentAction(
  input: z.infer<typeof RegisterPaymentSchema>
): Promise<ActionResponse<{ paymentId: string }>>;

export async function getDashboardConsolidationAction(): Promise<ActionResponse<DashboardMetrics>>;
```

---

## 5. Arquitetura de Front-End, UX e Design System

### 5.1 Design Tokens & Paleta Semântica

| Categoria | Token CSS / Tailwind | Aplicação Semântica |
| :--- | :--- | :--- |
| **Quitado / Pago** | `emerald-500` / `emerald-50` | Badges de Quitado, Totais arrecadados, Ícones Pix |
| **Pendente Parcial** | `amber-500` / `amber-50` | Comunidades com pagamentos parciais, Devolução |
| **Em Aberto / Crítico** | `rose-600` / `rose-50` | Saldo Devedor elevado, Alertas de Conflito |
| **Estoque / Disponível** | `indigo-600` / `indigo-50` | Lotes de convites no estoque, Ações primárias |
| **Neutro / Fundo** | `slate-900` / `slate-50` | Background, cabeçalhos de tabela, cards de métrica |

### 5.2 Componentes Críticos

1. **KPI Bento Grid:**
   - 4 blocos consolidados com indicadores de proporção visual (progresso de distribuição do lote de 1.000 ingressos, taxa de liquidação financeira e breakdown em minicards com badges de Pix, Dinheiro e Crédito).
2. **Data Table por Comunidade:**
   - Ordenação dinâmica (por padrão, comunidades com maior valor de `balance_due` ficam no topo para facilitar a cobrança).
   - Conversão de array numérico em faixas contínuas (`0001 a 0050, 0081 a 0100`).
   - Ações em 1 clique: Botão "+ Convites", "+ Pagar" e Ficha Completa.
3. **Mapa Visual de Convites (Grid de 1.000 Células):**
   - Paginação por centenas (`0001-0100`, `0101-0200`... até `0901-1000`) para renderização rápida do DOM.
   - Campo de busca com debounce que destaca instantaneamente o convite digitado.
   - Popover detalhado com dados do líder e link direto para WhatsApp com mensagem pré-formatada.

---

## 6. Otimização para Limites Gratuitos (Vercel Hobby + Neon Free Tier)

### 6.1 Conexão Serverless via HTTP Pipeline sem PgBouncer TCP Overhead
Ambientes serverless como Vercel Functions sofrem com conexões TCP persistentes abertas que esgotam o limite de conexões do PostgreSQL (`max_connections`).

- **Estratégia Adotada:**
  - O driver oficial `@neondatabase/serverless` oferece requisições SQL sobre **HTTP Fetch stateless** para queries de leitura.
  - Cada requisição executa como uma chamada HTTP POST atômica (`https://ep-xxx.neon.tech/sql`), eliminando a necessidade de manter conexões abertas.
  - Não há acúmulo de conexões ociosas (*idle connections*) consumindo recursos.

### 6.2 Estratégia de Scale-to-Zero e Redução de Compute Hours (CU-hours)
O plano gratuito da Neon suspende o nó de computação (*scale-to-zero*) após 5 minutos sem atividade.

- **Prevenção de Wake-ups Desnecessários:**
  - **Evitar polling automático em loop:** Em vez de fazer `setInterval` ou SWR revalidando a cada 2 segundos, o front-end é estritamente **orientado a eventos**.
  - As atualizações ocorrem através de Server Actions com `revalidatePath('/')`.
  - Se um coordenador deixar a aba aberta a noite inteira, nenhuma query é disparada contra o banco, permitindo que a Neon entre em modo sleep e consuma 0 CU-hours.
  - O tempo de *cold start* da Neon é inferior a 500ms, imperceptível para o usuário final.

---

## 7. Segurança, Auditoria e Resiliência

### 7.1 Idempotência e Prevenção de Duplo Clique
- Utilização do hook `useFormStatus` do React 19 para desativar botões de envio instantaneamente ao disparar mutações.
- Para registros de pagamento, gera-se uma `Idempotency-Key` (UUIDv4) no cliente incluída no cabeçalho ou payload da ação, gravada temporariamente ou validada para prevenir duplicidade de lançamentos financeiros decorrentes de instabilidades de rede móvel.

### 7.2 Auditoria e Exportação Contábil
- A tabela `payments` opera como **Ledger Imutável**: pagamentos não são atualizados silenciosamente. Caso ocorra erro de lançamento, a operação permitida é o estorno auditado.
- Rotina nativa de exportação de **Extrato CSV** com codificação `UTF-8 BOM` (`\uFEFF`), garantindo que acentuações e delimitadores de moeda em Real (`R$`) abram nativamente no Microsoft Excel sem corrupção de caracteres.
