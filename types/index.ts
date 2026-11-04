export type TicketStatus = 'DISPONIVEL' | 'ENTREGUE' | 'VENDIDO' | 'DEVOLVIDO';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'PENDENTE';

export interface Setting {
  id: number;
  ticket_price: number;
  total_tickets: number;
  demo_seeded?: boolean;
}

export interface Community {
  id: number;
  name: string;
  leader_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Ticket {
  number: number;
  community_id: number | null;
  status: TicketStatus;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  payment_method?: PaymentMethod | null;
  sold_at?: string | null;
  updated_at: string;
  community_name?: string;
}

export interface Payment {
  id: number;
  community_id: number;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  paid_at: string;
  community_name?: string;
}

export interface CommunitySummary extends Community {
  tickets_count: number;
  ticket_ranges: string;
  ticket_numbers: number[];
  total_tickets_value: number;
  total_paid: number;
  paid_dinheiro: number;
  paid_pix: number;
  paid_credito: number;
  balance_due: number;
  financial_status: 'QUITADO' | 'PENDENTE' | 'SEM_CONVITES' | 'CREDITO';
}

export interface DashboardSummary {
  total_tickets: number;
  available_tickets: number;
  delivered_tickets: number;
  sold_tickets: number;
  returned_tickets: number;
  ticket_price: number;
  total_expected_revenue: number;
  total_paid: number;
  paid_dinheiro: number;
  paid_pix: number;
  paid_credito: number;
  total_balance_due: number;
  is_mock_mode: boolean;
}
