# 🎟️ Gestão de Convites de Almoço e Controle Financeiro por Comunidade

Aplicação web completa, moderna e responsiva construída em **Next.js 15 (App Router)** com **TypeScript**, **Tailwind CSS**, componentes inspirados em **shadcn/ui**, **Lucide Icons** e integração com o banco de dados Serverless **Neon Postgres** via Vercel.

---

## 🚀 Tecnologias Utilizadas

- **Framework:** Next.js 15+ (App Router) + React 19 + TypeScript
- **Banco de Dados:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **Estilização:** Tailwind CSS + Animações fluidas e Glassmorphism sutil
- **Comunicação Segura:** Server Actions com `revalidatePath` em tempo real
- **Ícones:** Lucide React
- **Idioma e Formatação:** Português (`pt-BR`) com máscara monetária em Reais (`R$`)

---

## 📁 Estrutura de Arquivos

```
├── app/
│   ├── actions.ts             # Server Actions (CRUD Comunidades, Entrega/Devolução de Convites, Pagamentos, Settings)
│   ├── globals.css            # Estilos globais e tokens de design Tailwind
│   ├── layout.tsx             # Root Layout com fonte Inter e metadados
│   └── page.tsx               # Página principal SSR conectada ao banco Neon
├── components/
│   ├── Navbar.tsx             # Barra superior com botões de ação e status do Neon
│   ├── SummaryCards.tsx       # 4 Cards Consolidados (Estoque, Entregues, Arrecadado Pix/Dinheiro/Crédito, Saldo Devedor)
│   ├── CommunitiesTable.tsx   # Aba 1: Painel por Comunidade com faixas numéricas e botões rápidos
│   ├── TicketsMap.tsx         # Aba 2: Grade visual interativa 0001 a 1000 com busca instantânea
│   ├── FinancialStatement.tsx # Aba 3: Extrato Financeiro Geral com filtros e Exportação CSV
│   ├── DashboardClient.tsx    # Gerenciador de estado das abas, modais e feedback
│   ├── Toast.tsx              # Sistema de notificações flutuantes animadas
│   └── modals/
│       ├── DeliverTicketsModal.tsx   # Distribuição de convites por intervalo com validação de conflito
│       ├── RegisterPaymentModal.tsx  # Registro de pagamentos (Dinheiro, Pix, Crédito)
│       ├── CommunityModal.tsx        # Cadastro e edição de comunidades
│       ├── CommunityDetailsModal.tsx # Ficha completa da comunidade com devolução em lote
│       └── SettingsModal.tsx         # Preço unitário, total de convites e seed automático
├── lib/
│   ├── db.ts                  # Conexão com Neon Postgres + Fallback inteligente em memória
│   └── utils.ts               # Formatação de moeda, agrupamento de faixas numéricas e helpers
├── schema.sql                 # Script SQL para criação das tabelas e índices no Neon
├── .env.example               # Exemplo de configuração da variável DATABASE_URL
├── package.json
└── tsconfig.json
```

---

## 🗄️ Modelagem do Banco de Dados (`schema.sql`)

O script SQL já cria e estrutura as seguintes tabelas:

1. **`settings`**:
   - `id SERIAL PRIMARY KEY`
   - `ticket_price NUMERIC(10,2) DEFAULT 25.00`
   - `total_tickets INT DEFAULT 1000`

2. **`communities`**:
   - `id SERIAL PRIMARY KEY`
   - `name VARCHAR(255) NOT NULL` (Ex: "Capela Perpétuo Socorro")
   - `leader_name VARCHAR(255)`
   - `phone VARCHAR(50)`
   - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

3. **`tickets`**:
   - `number INT PRIMARY KEY` (de 1 a 1000)
   - `community_id INT REFERENCES communities(id) ON DELETE SET NULL`
   - `status VARCHAR(20) NOT NULL CHECK (status IN ('DISPONIVEL', 'ENTREGUE', 'DEVOLVIDO'))`
   - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

4. **`payments`**:
   - `id SERIAL PRIMARY KEY`
   - `community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE`
   - `amount NUMERIC(10,2) NOT NULL`
   - `payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('DINHEIRO', 'PIX', 'CREDITO'))`
   - `notes TEXT`
   - `paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---

## ⚙️ Como Rodar Localmente

1. **Clone ou abra a pasta do projeto:**
   ```bash
   cd "Gestão de Convites"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente (Opcional para teste local):**
   - Crie um arquivo `.env.local` na raiz:
     ```env
     DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-2.aws.neon.tech/neondb?sslmode=require"
     ```
   > **Nota de Resiliência:** Caso você não configure a variável `DATABASE_URL` imediatamente, a aplicação iniciará em **Modo Demonstração (Memória)**, permitindo navegar, testar a entrega de convites, registrar pagamentos e validar todas as regras de negócio sem nenhum erro.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Como Fazer Deploy na Vercel com Neon Postgres

1. Crie um repositório no GitHub e envie o código.
2. Na Vercel, clique em **Add New Project** e selecione o repositório.
3. Na aba **Storage** da Vercel, adicione a integração nativa **Neon Postgres**:
   - A Vercel criará automaticamente a variável `DATABASE_URL` no seu projeto.
4. Abra o **SQL Editor** do Neon (ou execute pela aba Storage da Vercel) e cole o conteúdo do arquivo [`schema.sql`](./schema.sql).
5. Pronto! O Next.js fará o deploy automático e a aplicação estará pronta para produção.

---

## 📋 Regras de Negócio e Funcionalidades

- **Inicialização da Base (0001 a 1000):** Sincronização automática dos 1000 convites com status `DISPONIVEL` e definição do valor unitário do convite (ex: R$ 25,00 ou R$ 30,00).
- **Associação de Convites por Lote:** Escolha do intervalo numérico (ex: `0001` ao `0050`). O sistema valida no banco se algum convite já foi entregue a outra comunidade e alerta em caso de conflito.
- **Devolução de Convites:** Permite devolver convites por faixa ou individualmente, desvinculando-os da comunidade e recalculando imediatamente o valor a pagar.
- **Registro de Pagamentos:** Lançamento de valores com opção obrigatória de **Dinheiro**, **Pix** ou **Crédito**, com histórico e botão de estorno.
- **Cálculos Automáticos por Comunidade:** Total entregue, valor total dos convites (`Qtd × Valor`), total já pago (com divisão detalhada) e saldo em aberto (*Falta Acertar*).
- **Mapa Geral de Convites (0001 a 1000):** Grade numerada visual com busca por número de convite e card com ficha do responsável.
- **Extrato Financeiro Geral:** Filtros combinados por comunidade e forma de pagamento, com botão para **Exportar CSV** (formatado para Excel) e botão de impressão.
