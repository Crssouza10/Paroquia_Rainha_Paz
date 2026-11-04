import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número de convite com 4 dígitos (ex: 7 -> "0007")
 */
export function formatTicketNumber(num: number): string {
  return String(num).padStart(4, "0");
}

/**
 * Formata valor em Real Brasileiro (BRL)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Formata data no padrão brasileiro dd/mm/aaaa hh:mm
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formata uma lista de números em faixas/intervalos contínuos.
 * Ex: [1, 2, 3, 4, 10, 11, 15] -> "0001-0004, 0010-0011, 0015"
 */
export function groupIntoRanges(numbers: number[]): string {
  if (!numbers || numbers.length === 0) return "Nenhum";

  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      if (start === prev) {
        ranges.push(formatTicketNumber(start));
      } else {
        ranges.push(`${formatTicketNumber(start)} a ${formatTicketNumber(prev)}`);
      }
      start = curr;
      prev = curr;
    }
  }

  if (start === prev) {
    ranges.push(formatTicketNumber(start));
  } else {
    ranges.push(`${formatTicketNumber(start)} a ${formatTicketNumber(prev)}`);
  }

  return ranges.join(", ");
}

/**
 * Formata quantidade de convites respeitando singular e plural
 * Ex: 1 -> "1 convite", 2 -> "2 convites", 0 -> "0 convites"
 */
export function formatTicketPlural(count: number): string {
  return count === 1 ? "1 convite" : `${count} convites`;
}

/**
 * Formata percentual com precisão de 1 casa decimal quando necessário
 * Ex: 1/1000 -> "0,1%", 999/1000 -> "99,9%", 80/1000 -> "8%"
 */
export function formatPercent(value: number, total: number): string {
  if (!total || total <= 0 || !value || value <= 0) return "0%";
  const pct = (value / total) * 100;
  if (pct >= 100) return "100%";

  if (Number.isInteger(pct)) {
    return `${pct}%`;
  }
  const formatted = pct.toFixed(1).replace(".", ",");
  if (formatted === "100,0" && pct < 100) {
    return "99,9%";
  }
  if (formatted === "0,0" && pct > 0) {
    return "0,1%";
  }
  return `${formatted}%`;
}

/**
 * Gera URL oficial da API do WhatsApp preservando 100% dos caracteres UTF-8
 */
export function getWhatsAppOfficialUrl(phone: string | null | undefined, message?: string): string | null {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (!cleanPhone) return null;
  const baseUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}`;
  if (!message) return baseUrl;
  return `${baseUrl}&text=${encodeURIComponent(message)}`;
}

/**
 * Gera URL oficial do WhatsApp com a mensagem do Convite Nominal (BMP Unicode seguro, zero risco de ??)
 */
export function getWhatsAppTicketUrl(params: {
  buyerPhone: string | null | undefined;
  buyerName: string | null | undefined;
  ticketNumber: string | number;
  communityName: string | null | undefined;
  statusText: string;
  validationCode: string;
}): string | null {
  const cleanPhone = (params.buyerPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return null;

  const buyerName = params.buyerName || "Convidado";
  const ticketNumber = typeof params.ticketNumber === "number"
    ? formatTicketNumber(params.ticketNumber)
    : params.ticketNumber;
  const communityName = params.communityName || "Paróquia Central";

  const message = [
    `Olá, *${buyerName}*! Seu convite para o *Grande Almoço Comunitário* está confirmado!`,
    "",
    "-----------------------------------",
    `▸ *Convite Nº:* #${ticketNumber}`,
    `▸ *Titular:* ${buyerName}`,
    `▸ *Comunidade:* ${communityName}`,
    `▸ *Status:* ${params.statusText}`,
    "▸ *Data:* Domingo, a partir das 12:00h",
    "▸ *Local:* Salão Paroquial Central",
    `▸ *Código de Validação:* ${params.validationCode}`,
    "-----------------------------------",
    "",
    "Apresente este comprovante ou o código do convite na portaria do evento. Agradecemos muito pela sua presença e colaboração!",
  ].join("\n");

  return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Gera URL oficial do WhatsApp com extrato financeiro da comunidade (BMP Unicode seguro)
 */
export function getWhatsAppSummaryUrl(c: import("@/types").CommunitySummary): string | null {
  const cleanPhone = (c.phone || "").replace(/\D/g, "");
  if (!cleanPhone) return null;

  const leaderName = c.leader_name || "Responsável";
  const statusText = c.financial_status === "QUITADO" ? "Quitado" : "Pendente";

  const lines = [
    `Olá, *${leaderName}*! Segue o extrato financeiro atualizado da distribuição de convites para o *Almoço Comunitário* (*${c.name}*):`,
    "",
    "-----------------------------------",
    `▸ *Comunidade:* ${c.name}`,
    `▸ *Responsável:* ${leaderName}`,
    `▸ *Cota de Convites:* ${formatTicketPlural(c.tickets_count)}`,
  ];

  if (c.ticket_ranges) {
    lines.push(`▸ *Faixas:* ${c.ticket_ranges}`);
  }

  lines.push(
    `▸ *Valor Total do Lote:* ${formatCurrency(c.total_tickets_value)}`,
    `▸ *Já Acertado:* ${formatCurrency(c.total_paid)}`,
    `▸ *Saldo a Acertar:* ${formatCurrency(c.balance_due)}`,
    `▸ *Status:* ${statusText}`,
    "-----------------------------------",
    "",
    "Qualquer dúvida ou para novos acertos, estamos à disposição da comissão paroquial! Muito obrigado!"
  );

  const message = lines.join("\n");
  return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
}
