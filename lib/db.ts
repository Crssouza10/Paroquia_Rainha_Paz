import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import {
  Setting,
  Community,
  Ticket,
  Payment,
  CommunitySummary,
  DashboardSummary,
  PaymentMethod,
  TicketStatus,
} from "@/types";
import { groupIntoRanges } from "./utils";

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function isUsingMock(): boolean {
  const url = getDatabaseUrl();
  return (
    !url ||
    url.includes("endpoint.region.aws.neon.tech") ||
    url.includes("user:password")
  );
}

export function getDb() {
  if (isUsingMock()) {
    return null;
  }
  return neon(getDatabaseUrl()!);
}

// ============================================================================
// MOCK STORE PERSISTENTE (Para demonstração local quando DATABASE_URL não definida)
// ============================================================================
interface MockStore {
  settings: Setting;
  communities: Community[];
  tickets: Ticket[];
  payments: Payment[];
  nextCommunityId: number;
  nextPaymentId: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockStore: MockStore | undefined;
}

const MOCK_FILE_PATH = path.join(process.cwd(), ".mock_db.json");

function loadMockStoreFromFile(): MockStore | null {
  try {
    if (fs.existsSync(MOCK_FILE_PATH)) {
      const content = fs.readFileSync(MOCK_FILE_PATH, "utf-8");
      return JSON.parse(content) as MockStore;
    }
  } catch (err) {
    console.error("Erro ao carregar .mock_db.json:", err);
  }
  return null;
}

function saveMockStore(store: MockStore): void {
  try {
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar .mock_db.json:", err);
  }
}

function getMockStore(): MockStore {
  if (!global.__mockStore) {
    const fromDisk = loadMockStoreFromFile();
    if (fromDisk) {
      global.__mockStore = fromDisk;
      return global.__mockStore;
    }

    const tickets: Ticket[] = [];
    for (let i = 1; i <= 1000; i++) {
      tickets.push({
        number: i,
        community_id: null,
        status: "DISPONIVEL",
        updated_at: new Date().toISOString(),
      });
    }

    const communities: Community[] = [
      {
        id: 1,
        name: "Capela Perpétuo Socorro",
        leader_name: "Maria Aparecida da Silva",
        phone: "(11) 98765-4321",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Comunidade São José",
        leader_name: "Antônio Carlos dos Santos",
        phone: "(11) 97654-3210",
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Comunidade Santa Rita de Cássia",
        leader_name: "Lúcia Helena Ferreira",
        phone: "(11) 96543-2109",
        created_at: new Date().toISOString(),
      },
    ];

    // Seed de amostra para demonstração inicial rica
    // Entregar 0001 a 0050 para Capela Perpétuo Socorro (50 * R$ 25 = R$ 1.250)
    for (let i = 1; i <= 50; i++) {
      tickets[i - 1].community_id = 1;
      tickets[i - 1].status = "ENTREGUE";
    }

    // Entregar 0051 a 0080 para São José (30 * R$ 25 = R$ 750)
    for (let i = 51; i <= 80; i++) {
      tickets[i - 1].community_id = 2;
      tickets[i - 1].status = "ENTREGUE";
    }

    const payments: Payment[] = [
      {
        id: 1,
        community_id: 1,
        amount: 500.0,
        payment_method: "PIX",
        notes: "Adiantamento vendas do fim de semana",
        paid_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 2,
        community_id: 1,
        amount: 250.0,
        payment_method: "DINHEIRO",
        notes: "Entregue na secretaria paroquial",
        paid_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        community_id: 2,
        amount: 750.0,
        payment_method: "CREDITO",
        notes: "Pagamento integral da cota de convites",
        paid_at: new Date().toISOString(),
      },
    ];

    global.__mockStore = {
      settings: {
        id: 1,
        ticket_price: 25.0,
        total_tickets: 1000,
        demo_seeded: true,
      },
      communities,
      tickets,
      payments,
      nextCommunityId: 4,
      nextPaymentId: 4,
    };

    saveMockStore(global.__mockStore);
  }
  return global.__mockStore;
}

// ============================================================================
// INICIALIZAÇÃO DE BANCO DE DADOS (Neon Postgres)
// ============================================================================
export async function ensureDatabaseReady() {
  const sql = getDb();
  if (!sql) return;

  try {
    // 1. Tabela settings
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
        total_tickets INT NOT NULL DEFAULT 1000,
        demo_seeded BOOLEAN NOT NULL DEFAULT FALSE
      );
    `;

    // Garante que a coluna demo_seeded exista caso tabela já exista
    await sql`
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS demo_seeded BOOLEAN NOT NULL DEFAULT FALSE;
    `;

    await sql`
      INSERT INTO settings (id, ticket_price, total_tickets, demo_seeded)
      VALUES (1, 25.00, 1000, FALSE)
      ON CONFLICT (id) DO NOTHING;
    `;

    // 2. Tabela communities
    await sql`
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        leader_name VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Tabela tickets
    await sql`
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
    `;

    // Garante novas colunas caso a tabela já exista
    await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);`;
    await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50);`;
    await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);`;
    await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;`;

    // Atualiza constraint de status para permitir VENDIDO
    try {
      await sql`ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;`;
      await sql`ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('DISPONIVEL', 'ENTREGUE', 'VENDIDO', 'DEVOLVIDO'));`;
    } catch (_) {}

    // 4. Tabela payments
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        community_id INT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('DINHEIRO', 'PIX', 'CREDITO', 'PENDENTE')),
        notes TEXT,
        paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;`;
      await sql`ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('DINHEIRO', 'PIX', 'CREDITO', 'PENDENTE'));`;
    } catch (_) {}


    // Seed dos 1000 convites se tabela vazia (para garantir a existência dos números 1 a 1000)
    const countResult = await sql`SELECT count(*) as count FROM tickets`;
    const count = parseInt(countResult[0]?.count ?? "0", 10);
    if (count === 0) {
      await sql`
        INSERT INTO tickets (number, status, updated_at)
        SELECT s, 'DISPONIVEL', CURRENT_TIMESTAMP
        FROM generate_series(1, 1000) AS s;
      `;
    }

    // Seed de comunidades de amostra: APENAS UMA VEZ na primeira inicialização!
    // NUNCA recriar automaticamente caso o usuário exclua as comunidades para cadastrar as reais!
    const settingsRows = await sql`SELECT demo_seeded FROM settings WHERE id = 1`;
    const alreadySeeded = settingsRows[0]?.demo_seeded === true;

    if (!alreadySeeded) {
      const commCountResult = await sql`SELECT count(*) as count FROM communities`;
      const commCount = parseInt(commCountResult[0]?.count ?? "0", 10);
      if (commCount === 0) {
        const c1 = await sql`
          INSERT INTO communities (name, leader_name, phone)
          VALUES ('Capela Perpétuo Socorro', 'Maria Aparecida da Silva', '(11) 98765-4321')
          RETURNING id;
        `;
        const c2 = await sql`
          INSERT INTO communities (name, leader_name, phone)
          VALUES ('Comunidade São José', 'Antônio Carlos dos Santos', '(11) 97654-3210')
          RETURNING id;
        `;
        await sql`
          INSERT INTO communities (name, leader_name, phone)
          VALUES ('Comunidade Santa Rita de Cássia', 'Lúcia Helena Ferreira', '(11) 96543-2109');
        `;

        const id1 = c1[0].id;
        const id2 = c2[0].id;

        // Entregar 0001 a 0050 para Capela Perpétuo Socorro (50 * R$ 25 = R$ 1.250)
        await sql`
          UPDATE tickets
          SET community_id = ${id1}, status = 'ENTREGUE', updated_at = CURRENT_TIMESTAMP
          WHERE number >= 1 AND number <= 50;
        `;

        // Entregar 0051 a 0080 para São José (30 * R$ 25 = R$ 750)
        await sql`
          UPDATE tickets
          SET community_id = ${id2}, status = 'ENTREGUE', updated_at = CURRENT_TIMESTAMP
          WHERE number >= 51 AND number <= 80;
        `;

        // Pagamentos de amostra
        await sql`
          INSERT INTO payments (community_id, amount, payment_method, notes)
          VALUES
            (${id1}, 500.00, 'PIX', 'Adiantamento vendas do fim de semana'),
            (${id1}, 250.00, 'DINHEIRO', 'Entregue na secretaria paroquial'),
            (${id2}, 750.00, 'CREDITO', 'Pagamento integral da cota de convites');
        `;
      }

      // Marca como semeado para nunca mais recriar se o usuário excluir!
      await sql`UPDATE settings SET demo_seeded = TRUE WHERE id = 1`;
    }
  } catch (err) {
    console.error("Erro ao inicializar tabelas no Neon:", err);
  }
}

// ============================================================================
// OPERAÇÕES: CONFIGURAÇÕES (SETTINGS)
// ============================================================================
export async function getSettings(): Promise<Setting> {
  const sql = getDb();
  if (!sql) {
    return getMockStore().settings;
  }
  await ensureDatabaseReady();
  const rows = await sql`SELECT id, ticket_price::float, total_tickets FROM settings WHERE id = 1`;
  if (rows.length === 0) {
    return { id: 1, ticket_price: 25.0, total_tickets: 1000 };
  }
  return {
    id: rows[0].id,
    ticket_price: parseFloat(rows[0].ticket_price),
    total_tickets: parseInt(rows[0].total_tickets, 10),
  };
}

export async function updateSettings(ticketPrice: number, totalTickets: number): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    store.settings.ticket_price = ticketPrice;
    store.settings.total_tickets = totalTickets;
    // Garante que existam convites suficientes até totalTickets sem perder os já cadastrados
    const existingNums = new Set(store.tickets.map((t) => t.number));
    for (let i = 1; i <= totalTickets; i++) {
      if (!existingNums.has(i)) {
        store.tickets.push({
          number: i,
          community_id: null,
          status: "DISPONIVEL",
          updated_at: new Date().toISOString(),
        });
      }
    }
    store.tickets.sort((a, b) => a.number - b.number);
    saveMockStore(store);
    return;
  }
  await ensureDatabaseReady();
  await sql`
    UPDATE settings
    SET ticket_price = ${ticketPrice}, total_tickets = ${totalTickets}
    WHERE id = 1
  `;
  // Caso aumente a quantidade de convites (ex: de 500 para 600), garante que os novos números existam no banco
  await sql`
    INSERT INTO tickets (number, status, updated_at)
    SELECT s, 'DISPONIVEL', CURRENT_TIMESTAMP
    FROM generate_series(1, ${totalTickets}) AS s
    ON CONFLICT (number) DO NOTHING;
  `;
}

// ============================================================================
// OPERAÇÕES: COMUNIDADES E RESUMOS
// ============================================================================
export async function getCommunitiesWithSummaries(): Promise<CommunitySummary[]> {
  const sql = getDb();
  const settings = await getSettings();
  const ticketPrice = settings.ticket_price;

  if (!sql) {
    const store = getMockStore();
    return store.communities.map((c) => {
      const deliveredTickets = store.tickets.filter(
        (t) => t.community_id === c.id && (t.status === "ENTREGUE" || t.status === "VENDIDO")
      );
      const ticketNumbers = deliveredTickets.map((t) => t.number);
      const ticketsCount = ticketNumbers.length;
      const totalTicketsValue = ticketsCount * ticketPrice;

      const commPayments = store.payments.filter((p) => p.community_id === c.id);
      let paidDinheiro = 0;
      let paidPix = 0;
      let paidCredito = 0;

      commPayments.forEach((p) => {
        if (p.payment_method === "DINHEIRO") paidDinheiro += Number(p.amount);
        if (p.payment_method === "PIX") paidPix += Number(p.amount);
        if (p.payment_method === "CREDITO") paidCredito += Number(p.amount);
      });

      const totalPaid = paidDinheiro + paidPix + paidCredito;
      const rawBalanceDue = totalTicketsValue - totalPaid;
      const balanceDue = rawBalanceDue > 0 ? rawBalanceDue : 0;

      let status: 'QUITADO' | 'PENDENTE' | 'SEM_CONVITES' = 'PENDENTE';
      if (ticketsCount === 0) {
        status = 'SEM_CONVITES';
      } else if (rawBalanceDue <= 0) {
        status = 'QUITADO';
      } else {
        status = 'PENDENTE';
      }

      return {
        ...c,
        tickets_count: ticketsCount,
        ticket_ranges: groupIntoRanges(ticketNumbers),
        ticket_numbers: ticketNumbers,
        total_tickets_value: totalTicketsValue,
        total_paid: totalPaid,
        paid_dinheiro: paidDinheiro,
        paid_pix: paidPix,
        paid_credito: paidCredito,
        balance_due: balanceDue,
        financial_status: status,
      };
    });
  }

  await ensureDatabaseReady();

  // Busca comunidades, ingressos agrupados e pagamentos somados
  const communities = await sql`
    SELECT id, name, leader_name, phone, created_at
    FROM communities
    ORDER BY name ASC
  `;

  const tickets = await sql`
    SELECT number, community_id
    FROM tickets
    WHERE (status = 'ENTREGUE' OR status = 'VENDIDO') AND community_id IS NOT NULL
    ORDER BY number ASC
  `;

  const payments = await sql`
    SELECT community_id, payment_method, amount::float
    FROM payments
  `;

  return communities.map((c: any) => {
    const commTickets = tickets.filter((t: any) => t.community_id === c.id);
    const ticketNumbers = commTickets.map((t: any) => Number(t.number));
    const ticketsCount = ticketNumbers.length;
    const totalTicketsValue = ticketsCount * ticketPrice;

    const commPayments = payments.filter((p: any) => p.community_id === c.id);
    let paidDinheiro = 0;
    let paidPix = 0;
    let paidCredito = 0;

    commPayments.forEach((p: any) => {
      const amt = Number(p.amount);
      if (p.payment_method === "DINHEIRO") paidDinheiro += amt;
      if (p.payment_method === "PIX") paidPix += amt;
      if (p.payment_method === "CREDITO") paidCredito += amt;
    });

    const totalPaid = paidDinheiro + paidPix + paidCredito;
    const rawBalanceDue = totalTicketsValue - totalPaid;
    const balanceDue = rawBalanceDue > 0 ? rawBalanceDue : 0;

    let status: 'QUITADO' | 'PENDENTE' | 'SEM_CONVITES' = 'PENDENTE';
    if (ticketsCount === 0) {
      status = 'SEM_CONVITES';
    } else if (rawBalanceDue <= 0) {
      status = 'QUITADO';
    } else {
      status = 'PENDENTE';
    }

    return {
      id: c.id,
      name: c.name,
      leader_name: c.leader_name,
      phone: c.phone,
      created_at: c.created_at,
      tickets_count: ticketsCount,
      ticket_ranges: groupIntoRanges(ticketNumbers),
      ticket_numbers: ticketNumbers,
      total_tickets_value: totalTicketsValue,
      total_paid: totalPaid,
      paid_dinheiro: paidDinheiro,
      paid_pix: paidPix,
      paid_credito: paidCredito,
      balance_due: balanceDue,
      financial_status: status,
    };
  });
}

export async function createCommunity(name: string, leader_name?: string, phone?: string): Promise<number> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    const id = store.nextCommunityId++;
    store.communities.push({
      id,
      name,
      leader_name: leader_name || null,
      phone: phone || null,
      created_at: new Date().toISOString(),
    });
    saveMockStore(store);
    return id;
  }

  await ensureDatabaseReady();
  const rows = await sql`
    INSERT INTO communities (name, leader_name, phone)
    VALUES (${name}, ${leader_name || null}, ${phone || null})
    RETURNING id
  `;
  return rows[0].id;
}

export async function updateCommunity(id: number, name: string, leader_name?: string, phone?: string): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    const comm = store.communities.find((c) => c.id === id);
    if (comm) {
      comm.name = name;
      comm.leader_name = leader_name || null;
      comm.phone = phone || null;
      saveMockStore(store);
    }
    return;
  }

  await ensureDatabaseReady();
  await sql`
    UPDATE communities
    SET name = ${name}, leader_name = ${leader_name || null}, phone = ${phone || null}
    WHERE id = ${id}
  `;
}

export async function deleteCommunity(id: number): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    // Desvincular convites da comunidade e voltar para DISPONIVEL
    store.tickets.forEach((t) => {
      if (t.community_id === id) {
        t.community_id = null;
        t.status = "DISPONIVEL";
      }
    });
    // Excluir pagamentos associados
    store.payments = store.payments.filter((p) => p.community_id !== id);
    // Excluir comunidade
    store.communities = store.communities.filter((c) => c.id !== id);
    saveMockStore(store);
    return;
  }

  await ensureDatabaseReady();
  // Convites voltam para DISPONIVEL
  await sql`
    UPDATE tickets
    SET community_id = NULL, status = 'DISPONIVEL', updated_at = CURRENT_TIMESTAMP
    WHERE community_id = ${id}
  `;
  await sql`DELETE FROM communities WHERE id = ${id}`;
}

// ============================================================================
// OPERAÇÕES: DISTRIBUIÇÃO E DEVOLUÇÃO DE CONVITES
// ============================================================================
export interface DeliveryValidationResult {
  success: boolean;
  message?: string;
  conflictingNumbers?: number[];
}

export async function deliverTicketsRange(
  communityId: number,
  startNum: number,
  endNum: number
): Promise<DeliveryValidationResult> {
  if (startNum > endNum) {
    return {
      success: false,
      message: `Número inicial (${startNum}) não pode ser maior que o final (${endNum}).`,
    };
  }

  const sql = getDb();

  if (!sql) {
    const store = getMockStore();
    const conflicts: number[] = [];

    for (let i = startNum; i <= endNum; i++) {
      const ticket = store.tickets.find((t) => t.number === i);
      if (!ticket) {
        return {
          success: false,
          message: `Convite nº ${i} não existe no sistema (máximo configurado: ${store.settings.total_tickets}).`,
        };
      }
      if (ticket.status === "ENTREGUE" && ticket.community_id !== communityId) {
        conflicts.push(i);
      }
    }

    if (conflicts.length > 0) {
      const rangeStr = groupIntoRanges(conflicts);
      return {
        success: false,
        message: `Não foi possível distribuir: o(s) convite(s) [${rangeStr}] já estão entregues a outra comunidade!`,
        conflictingNumbers: conflicts,
      };
    }

    // Aplica a entrega
    for (let i = startNum; i <= endNum; i++) {
      const ticket = store.tickets.find((t) => t.number === i);
      if (ticket) {
        ticket.community_id = communityId;
        ticket.status = "ENTREGUE";
        ticket.updated_at = new Date().toISOString();
      }
    }
    saveMockStore(store);
    return { success: true };
  }

  await ensureDatabaseReady();

  // Validação no Neon
  const existingTickets = await sql`
    SELECT t.number, t.status, t.community_id, c.name as community_name
    FROM tickets t
    LEFT JOIN communities c ON t.community_id = c.id
    WHERE t.number >= ${startNum} AND t.number <= ${endNum}
  `;

  const conflicts: number[] = [];
  const conflictingNames: string[] = [];

  for (const t of existingTickets) {
    if (t.status === "ENTREGUE" && t.community_id !== communityId) {
      conflicts.push(t.number);
      if (t.community_name && !conflictingNames.includes(t.community_name)) {
        conflictingNames.push(t.community_name);
      }
    }
  }

  if (conflicts.length > 0) {
    const rangeStr = groupIntoRanges(conflicts);
    const commsStr = conflictingNames.join(", ");
    return {
      success: false,
      message: `Conflito! O(s) convite(s) [${rangeStr}] já estão entregues para: ${commsStr || "outra comunidade"}. Devolva-os antes de transferir.`,
      conflictingNumbers: conflicts,
    };
  }

  // Atualiza no banco
  await sql`
    UPDATE tickets
    SET community_id = ${communityId}, status = 'ENTREGUE', updated_at = CURRENT_TIMESTAMP
    WHERE number >= ${startNum} AND number <= ${endNum}
  `;

  return { success: true };
}

export async function returnTicketsRange(
  communityId: number,
  startNum: number,
  endNum: number
): Promise<{ success: boolean; message?: string }> {
  if (startNum > endNum) {
    return {
      success: false,
      message: `Número inicial (${startNum}) não pode ser maior que o final (${endNum}).`,
    };
  }

  const sql = getDb();

  if (!sql) {
    const store = getMockStore();
    let returnedCount = 0;

    for (let i = startNum; i <= endNum; i++) {
      const ticket = store.tickets.find((t) => t.number === i);
      if (ticket && ticket.community_id === communityId) {
        ticket.community_id = null;
        ticket.status = "DISPONIVEL";
        ticket.updated_at = new Date().toISOString();
        returnedCount++;
      }
    }

    if (returnedCount === 0) {
      return {
        success: false,
        message: "Nenhum convite da faixa informada pertencia a esta comunidade.",
      };
    }

    saveMockStore(store);
    return { success: true };
  }

  await ensureDatabaseReady();

  const res = await sql`
    UPDATE tickets
    SET community_id = NULL, status = 'DISPONIVEL', updated_at = CURRENT_TIMESTAMP
    WHERE community_id = ${communityId} AND number >= ${startNum} AND number <= ${endNum}
    RETURNING number
  `;

  if (res.length === 0) {
    return {
      success: false,
      message: "Nenhum convite da faixa informada pertencia a esta comunidade.",
    };
  }

  return { success: true };
}

export async function returnSpecificTickets(
  ticketNumbers: number[]
): Promise<{ success: boolean; message?: string }> {
  if (!ticketNumbers.length) return { success: true };

  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    ticketNumbers.forEach((num) => {
      const t = store.tickets.find((item) => item.number === num);
      if (t) {
        t.community_id = null;
        t.status = "DISPONIVEL";
        t.updated_at = new Date().toISOString();
      }
    });
    saveMockStore(store);
    return { success: true };
  }

  await ensureDatabaseReady();
  await sql`
    UPDATE tickets
    SET community_id = NULL, status = 'DISPONIVEL', updated_at = CURRENT_TIMESTAMP
    WHERE number = ANY(${ticketNumbers})
  `;

  return { success: true };
}

// ============================================================================
// OPERAÇÕES: MAPA COMPLETO DE CONVITES (0001 a total_tickets)
// ============================================================================
export async function getAllTicketsWithCommunity(): Promise<Ticket[]> {
  const sql = getDb();
  const settings = await getSettings();
  const totalTickets = settings.total_tickets;

  if (!sql) {
    const store = getMockStore();
    return store.tickets
      .filter((t) => t.number <= totalTickets || t.status === "ENTREGUE" || t.status === "VENDIDO")
      .map((t) => {
        const comm = store.communities.find((c) => c.id === t.community_id);
        return {
          ...t,
          community_name: comm?.name,
        };
      });
  }

  await ensureDatabaseReady();
  const rows = await sql`
    SELECT t.number, t.community_id, t.status, t.buyer_name, t.buyer_phone, t.payment_method, t.sold_at, t.updated_at, c.name as community_name
    FROM tickets t
    LEFT JOIN communities c ON t.community_id = c.id
    WHERE t.number <= ${totalTickets} OR t.status IN ('ENTREGUE', 'VENDIDO')
    ORDER BY t.number ASC
  `;

  return rows.map((r: any) => ({
    number: r.number,
    community_id: r.community_id,
    status: r.status as TicketStatus,
    buyer_name: r.buyer_name || null,
    buyer_phone: r.buyer_phone || null,
    payment_method: r.payment_method || null,
    sold_at: r.sold_at || null,
    updated_at: r.updated_at,
    community_name: r.community_name || undefined,
  }));
}


// ============================================================================
// OPERAÇÕES: PAGAMENTOS
// ============================================================================
export async function getPaymentsList(
  communityId?: number,
  method?: string
): Promise<Payment[]> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    let filtered = [...store.payments];
    if (communityId) {
      filtered = filtered.filter((p) => p.community_id === communityId);
    }
    if (method && method !== "TODOS") {
      filtered = filtered.filter((p) => p.payment_method === method);
    }
    return filtered
      .map((p) => {
        const c = store.communities.find((item) => item.id === p.community_id);
        return {
          ...p,
          community_name: c?.name || "Comunidade Removida",
        };
      })
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }

  await ensureDatabaseReady();

  let query = `
    SELECT p.id, p.community_id, p.amount::float, p.payment_method, p.notes, p.paid_at, c.name as community_name
    FROM payments p
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (communityId) {
    params.push(communityId);
    query += ` AND p.community_id = $${params.length}`;
  }
  if (method && method !== "TODOS") {
    params.push(method);
    query += ` AND p.payment_method = $${params.length}`;
  }

  query += ` ORDER BY p.paid_at DESC`;

  // Utilizar neon com sql raw ou parameters
  const rows = await (sql as any)(query, params);
  return rows.map((r: any) => ({
    id: r.id,
    community_id: r.community_id,
    amount: parseFloat(r.amount),
    payment_method: r.payment_method as PaymentMethod,
    notes: r.notes,
    paid_at: r.paid_at,
    community_name: r.community_name || "Comunidade Removida",
  }));
}

export async function createPayment(
  communityId: number,
  amount: number,
  paymentMethod: PaymentMethod,
  notes?: string
): Promise<number> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    const id = store.nextPaymentId++;
    store.payments.unshift({
      id,
      community_id: communityId,
      amount: amount,
      payment_method: paymentMethod,
      notes: notes || null,
      paid_at: new Date().toISOString(),
    });
    saveMockStore(store);
    return id;
  }

  await ensureDatabaseReady();
  const rows = await sql`
    INSERT INTO payments (community_id, amount, payment_method, notes)
    VALUES (${communityId}, ${amount}, ${paymentMethod}, ${notes || null})
    RETURNING id
  `;
  return rows[0].id;
}

export async function deletePayment(paymentId: number): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    store.payments = store.payments.filter((p) => p.id !== paymentId);
    saveMockStore(store);
    return;
  }

  await ensureDatabaseReady();
  await sql`DELETE FROM payments WHERE id = ${paymentId}`;
}

// ============================================================================
// ============================================================================
// DASHBOARD CONSOLIDADO
// ============================================================================
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const settings = await getSettings();
  const communities = await getCommunitiesWithSummaries();
  const allTickets = await getAllTicketsWithCommunity();

  let deliveredCount = 0;
  let soldCount = 0;
  let returnedCount = 0;

  allTickets.forEach((t) => {
    if (t.status === "ENTREGUE") deliveredCount++;
    else if (t.status === "VENDIDO") soldCount++;
    else if (t.status === "DEVOLVIDO") returnedCount++;
  });

  const totalDeliveredOrSold = deliveredCount + soldCount;
  const availableCount = Math.max(0, settings.total_tickets - totalDeliveredOrSold);

  let totalPaid = 0;
  let paidDinheiro = 0;
  let paidPix = 0;
  let paidCredito = 0;
  let totalBalanceDue = 0;

  communities.forEach((c) => {
    totalPaid += c.total_paid;
    paidDinheiro += c.paid_dinheiro;
    paidPix += c.paid_pix;
    paidCredito += c.paid_credito;
    if (c.balance_due > 0) {
      totalBalanceDue += c.balance_due;
    }
  });

  const totalExpectedRevenue = (deliveredCount + soldCount) * settings.ticket_price;

  return {
    total_tickets: settings.total_tickets,
    available_tickets: availableCount,
    delivered_tickets: deliveredCount + soldCount,
    sold_tickets: soldCount,
    returned_tickets: returnedCount,
    ticket_price: settings.ticket_price,
    total_expected_revenue: totalExpectedRevenue,
    total_paid: totalPaid,
    paid_dinheiro: paidDinheiro,
    paid_pix: paidPix,
    paid_credito: paidCredito,
    total_balance_due: totalBalanceDue,
    is_mock_mode: isUsingMock(),
  };
}

// ============================================================================
// OPERAÇÕES: VENDA NOMINAL DE CONVITES
// ============================================================================
export interface SellNominalTicketParams {
  ticketNumber: number;
  buyerName: string;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  communityId?: number | null;
  registerPayment: boolean;
}

export async function sellNominalTicket(
  params: SellNominalTicketParams
): Promise<{ success: boolean; message?: string; ticket?: Ticket }> {
  const { ticketNumber, buyerName, buyerPhone, paymentMethod, communityId, registerPayment } = params;

  if (!buyerName || !buyerName.trim()) {
    return { success: false, message: "Nome do comprador é obrigatório." };
  }

  const sql = getDb();
  const settings = await getSettings();

  if (!sql) {
    const store = getMockStore();
    const ticket = store.tickets.find((t) => t.number === ticketNumber);
    if (!ticket) {
      return { success: false, message: `Convite nº ${ticketNumber} não encontrado.` };
    }

    const finalCommunityId = communityId ?? ticket.community_id;

    ticket.status = "VENDIDO";
    ticket.buyer_name = buyerName.trim();
    ticket.buyer_phone = buyerPhone.trim();
    ticket.payment_method = paymentMethod;
    ticket.sold_at = new Date().toISOString();
    ticket.community_id = finalCommunityId;
    ticket.updated_at = new Date().toISOString();

    if (registerPayment && paymentMethod !== "PENDENTE" && finalCommunityId) {
      store.payments.unshift({
        id: store.nextPaymentId++,
        community_id: finalCommunityId,
        amount: settings.ticket_price,
        payment_method: paymentMethod,
        notes: `Convite #${String(ticketNumber).padStart(4, "0")} - Comprador: ${buyerName.trim()}`,
        paid_at: new Date().toISOString(),
      });
    }

    saveMockStore(store);

    const commName = store.communities.find((c) => c.id === finalCommunityId)?.name;
    return {
      success: true,
      message: `Convite #${String(ticketNumber).padStart(4, "0")} vendido nominalmente com sucesso!`,
      ticket: {
        ...ticket,
        community_name: commName,
      },
    };
  }

  await ensureDatabaseReady();

  const existingRows = await sql`SELECT number, community_id, status FROM tickets WHERE number = ${ticketNumber}`;
  if (existingRows.length === 0) {
    return { success: false, message: `Convite nº ${ticketNumber} não encontrado.` };
  }

  const existing = existingRows[0];
  const finalCommunityId = communityId ?? existing.community_id;

  await sql`
    UPDATE tickets
    SET
      status = 'VENDIDO',
      buyer_name = ${buyerName.trim()},
      buyer_phone = ${buyerPhone.trim()},
      payment_method = ${paymentMethod},
      sold_at = CURRENT_TIMESTAMP,
      community_id = ${finalCommunityId},
      updated_at = CURRENT_TIMESTAMP
    WHERE number = ${ticketNumber}
  `;

  if (registerPayment && paymentMethod !== "PENDENTE" && finalCommunityId) {
    await sql`
      INSERT INTO payments (community_id, amount, payment_method, notes)
      VALUES (
        ${finalCommunityId},
        ${settings.ticket_price},
        ${paymentMethod},
        ${`Convite #${String(ticketNumber).padStart(4, "0")} - Comprador: ${buyerName.trim()}`}
      )
    `;
  }

  const updatedRows = await sql`
    SELECT t.number, t.community_id, t.status, t.buyer_name, t.buyer_phone, t.payment_method, t.sold_at, t.updated_at, c.name as community_name
    FROM tickets t
    LEFT JOIN communities c ON t.community_id = c.id
    WHERE t.number = ${ticketNumber}
  `;

  const updated = updatedRows[0];
  return {
    success: true,
    message: `Convite #${String(ticketNumber).padStart(4, "0")} vendido nominalmente com sucesso!`,
    ticket: {
      number: updated.number,
      community_id: updated.community_id,
      status: updated.status,
      buyer_name: updated.buyer_name,
      buyer_phone: updated.buyer_phone,
      payment_method: updated.payment_method,
      sold_at: updated.sold_at,
      updated_at: updated.updated_at,
      community_name: updated.community_name || undefined,
    },
  };
}

export async function cancelNominalSale(
  ticketNumber: number
): Promise<{ success: boolean; message?: string }> {
  const sql = getDb();

  if (!sql) {
    const store = getMockStore();
    const ticket = store.tickets.find((t) => t.number === ticketNumber);
    if (!ticket) {
      return { success: false, message: `Convite nº ${ticketNumber} não encontrado.` };
    }

    ticket.status = ticket.community_id ? "ENTREGUE" : "DISPONIVEL";
    ticket.buyer_name = null;
    ticket.buyer_phone = null;
    ticket.payment_method = null;
    ticket.sold_at = null;
    ticket.updated_at = new Date().toISOString();

    saveMockStore(store);
    return {
      success: true,
      message: `Venda nominal do convite #${String(ticketNumber).padStart(4, "0")} cancelada com sucesso!`,
    };
  }

  await ensureDatabaseReady();
  const existingRows = await sql`SELECT number, community_id FROM tickets WHERE number = ${ticketNumber}`;
  if (existingRows.length === 0) {
    return { success: false, message: `Convite nº ${ticketNumber} não encontrado.` };
  }

  const commId = existingRows[0].community_id;
  const newStatus = commId ? "ENTREGUE" : "DISPONIVEL";

  await sql`
    UPDATE tickets
    SET
      status = ${newStatus},
      buyer_name = NULL,
      buyer_phone = NULL,
      payment_method = NULL,
      sold_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE number = ${ticketNumber}
  `;

  return {
    success: true,
    message: `Venda nominal do convite #${String(ticketNumber).padStart(4, "0")} cancelada com sucesso!`,
  };
}


// ============================================================================
// SEED OU SINCRONIZAÇÃO DO BANCO (Sem apagar os convites já entregues/vendidos)
// ============================================================================
export async function seedTickets(totalTickets: number = 1000): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    store.settings.total_tickets = totalTickets;
    const existingNums = new Set(store.tickets.map((t) => t.number));
    for (let i = 1; i <= totalTickets; i++) {
      if (!existingNums.has(i)) {
        store.tickets.push({
          number: i,
          community_id: null,
          status: "DISPONIVEL",
          updated_at: new Date().toISOString(),
        });
      }
    }
    store.tickets.sort((a, b) => a.number - b.number);
    saveMockStore(store);
    return;
  }

  await ensureDatabaseReady();
  await sql`UPDATE settings SET total_tickets = ${totalTickets} WHERE id = 1`;
  // Insere ingressos faltantes de 1 a totalTickets preservando os já existentes
  await sql`
    INSERT INTO tickets (number, status, updated_at)
    SELECT s, 'DISPONIVEL', CURRENT_TIMESTAMP
    FROM generate_series(1, ${totalTickets}) AS s
    ON CONFLICT (number) DO NOTHING;
  `;
}

// ============================================================================
// LIMPAR DADOS (ZERAR BANCO PARA PRODUÇÃO) OU RESTAURAR DEMONSTRAÇÃO
// ============================================================================
export async function clearAllData(): Promise<void> {
  const sql = getDb();
  if (!sql) {
    const store = getMockStore();
    store.payments = [];
    store.tickets.forEach((t) => {
      t.community_id = null;
      t.status = "DISPONIVEL";
      t.buyer_name = null;
      t.buyer_phone = null;
      t.payment_method = null;
      t.sold_at = null;
      t.updated_at = new Date().toISOString();
    });
    store.communities = [];
    store.settings.demo_seeded = true;
    saveMockStore(store);
    return;
  }

  await ensureDatabaseReady();
  // 1. Excluir pagamentos
  await sql`DELETE FROM payments`;
  // 2. Liberar todos os convites para DISPONIVEL sem comunidade vinculada e limpar compradores
  await sql`
    UPDATE tickets
    SET
      community_id = NULL,
      status = 'DISPONIVEL',
      buyer_name = NULL,
      buyer_phone = NULL,
      payment_method = NULL,
      sold_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  `;
  // 3. Excluir todas as comunidades
  await sql`DELETE FROM communities`;
  // 4. Marcar que já foi semeado, para o banco NUNCA recriar os dados de exemplo automaticamente!
  await sql`UPDATE settings SET demo_seeded = TRUE WHERE id = 1`;
}

export async function restoreDemoData(): Promise<void> {
  const sql = getDb();
  if (!sql) {
    if (fs.existsSync(MOCK_FILE_PATH)) {
      try {
        fs.unlinkSync(MOCK_FILE_PATH);
      } catch (e) {
        console.error("Erro ao remover .mock_db.json:", e);
      }
    }
    global.__mockStore = undefined;
    getMockStore();
    return;
  }

  await ensureDatabaseReady();
  await sql`DELETE FROM payments`;
  await sql`
    UPDATE tickets
    SET community_id = NULL, status = 'DISPONIVEL', updated_at = CURRENT_TIMESTAMP
  `;
  await sql`DELETE FROM communities`;
  // Ao resetar demo_seeded para FALSE e chamar ensureDatabaseReady(), o seed é executado
  await sql`UPDATE settings SET demo_seeded = FALSE WHERE id = 1`;
  await ensureDatabaseReady();
}
