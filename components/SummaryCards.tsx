"use client";

import React from "react";
import {
  Ticket,
  Users,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { DashboardSummary } from "@/types";
import { formatCurrency, formatPercent, formatTicketPlural } from "@/lib/utils";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const percentDeliveredFormatted = formatPercent(summary.delivered_tickets, summary.total_tickets);
  const percentAvailableFormatted = formatPercent(summary.available_tickets, summary.total_tickets);
  const percentAvailableWidth = summary.total_tickets > 0
    ? Math.min(100, (summary.available_tickets / summary.total_tickets) * 100)
    : 0;

  // Proporções para barra de pagamento (Pix, Dinheiro, Crédito)
  const totalPaidNum = summary.total_paid || 1;
  const pixPercent = Math.round((summary.paid_pix / totalPaidNum) * 100) || 0;
  const dinPercent = Math.round((summary.paid_dinheiro / totalPaidNum) * 100) || 0;
  const credPercent = Math.round((summary.paid_credito / totalPaidNum) * 100) || 0;

  const percentPaidOfDelivered = summary.total_expected_revenue > 0
    ? Math.min(100, Math.round((summary.total_paid / summary.total_expected_revenue) * 100))
    : 0;
  const percentPaidFormatted = formatPercent(summary.total_paid, summary.total_expected_revenue);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* CARD 1: TOTAL DE CONVITES */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/30 to-transparent" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Convites
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
              <Ticket className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {summary.total_tickets}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-500 font-normal">lote total</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Disponíveis:</span>
              <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">{summary.available_tickets}</strong>
            </span>
            <span className="text-slate-500 tabular-nums font-medium">{percentAvailableFormatted} do lote</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentAvailableWidth}%` }}
              title={`${summary.available_tickets} disponíveis (${percentAvailableFormatted})`}
            />
          </div>
        </div>
      </div>

      {/* CARD 2: CONVITES ENTREGUES */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Convites Entregues
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
              {summary.delivered_tickets}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({percentDeliveredFormatted} do lote)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Em circulação / entregues:</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{summary.delivered_tickets}/{summary.total_tickets}</span>
          </div>
          {summary.sold_tickets > 0 && (
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>Vendas Nominais VIP:</span>
              <span className="font-semibold">{formatTicketPlural(summary.sold_tickets)}</span>
            </div>
          )}
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Potencial financeiro:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-medium tabular-nums">
              {formatCurrency(summary.total_expected_revenue)}
            </strong>
          </div>
        </div>
      </div>



      {/* CARD 3: VALORES PAGOS (ARRECADADO) */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Valores Pagos (Arrecadado)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(summary.total_paid)}
            </span>
          </div>
        </div>

        {/* Barra de Proporção Segmentada Horizontal Elegante */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Pix: <strong className="text-slate-900 dark:text-white tabular-nums font-medium">{formatCurrency(summary.paid_pix)}</strong>
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Din: <strong className="text-slate-900 dark:text-white tabular-nums font-medium">{formatCurrency(summary.paid_dinheiro)}</strong>
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Créd: <strong className="text-slate-900 dark:text-white tabular-nums font-medium">{formatCurrency(summary.paid_credito)}</strong>
            </span>
          </div>

          {/* Barra segmentada */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            {summary.total_paid > 0 ? (
              <>
                <div
                  style={{ width: `${pixPercent}%` }}
                  className="bg-blue-500 h-full transition-all duration-300"
                  title={`Pix: ${formatCurrency(summary.paid_pix)} (${pixPercent}%)`}
                />
                <div
                  style={{ width: `${dinPercent}%` }}
                  className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-300"
                  title={`Dinheiro: ${formatCurrency(summary.paid_dinheiro)} (${dinPercent}%)`}
                />
                <div
                  style={{ width: `${credPercent}%` }}
                  className="bg-purple-500 h-full transition-all duration-300"
                  title={`Crédito: ${formatCurrency(summary.paid_credito)} (${credPercent}%)`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-full" />
            )}
          </div>
        </div>
      </div>

      {/* CARD 4: VALORES EM ABERTO (PENDENTE) */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Valores em Aberto (Pendente)
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {formatCurrency(summary.total_balance_due)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">Taxa de Liquidação:</span>
            <span className="font-medium text-slate-900 dark:text-white tabular-nums">
              {percentPaidFormatted} quitado
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentPaidOfDelivered}%` }}
              title={`${percentPaidFormatted} liquidado`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
