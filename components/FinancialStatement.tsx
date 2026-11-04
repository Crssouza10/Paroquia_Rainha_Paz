"use client";

import React, { useState } from "react";
import {
  Calendar,
  Building2,
  CreditCard,
  Banknote,
  QrCode,
  Trash2,
  Printer,
  Download,
  Search,
} from "lucide-react";
import { Payment, CommunitySummary } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface FinancialStatementProps {
  payments: Payment[];
  communities: CommunitySummary[];
  onDeletePayment: (paymentId: number) => void;
}

export const FinancialStatement: React.FC<FinancialStatementProps> = ({
  payments,
  communities,
  onDeletePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("TODAS");
  const [selectedMethod, setSelectedMethod] = useState<string>("TODOS");

  const filteredPayments = payments.filter((p) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchComm = p.community_name?.toLowerCase().includes(search);
      const matchNotes = p.notes?.toLowerCase().includes(search);
      if (!matchComm && !matchNotes) return false;
    }

    if (selectedCommunity !== "TODAS" && p.community_id !== parseInt(selectedCommunity, 10)) {
      return false;
    }

    if (selectedMethod !== "TODOS" && p.payment_method !== selectedMethod) {
      return false;
    }

    return true;
  });

  const totalFiltered = filteredPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPix = filteredPayments
    .filter((p) => p.payment_method === "PIX")
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const totalDinheiro = filteredPayments
    .filter((p) => p.payment_method === "DINHEIRO")
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const totalCredito = filteredPayments
    .filter((p) => p.payment_method === "CREDITO")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const handleExportCSV = () => {
    const headers = ["ID", "Data", "Comunidade", "Forma de Pagamento", "Valor (R$)", "Observacoes"];
    const rows = filteredPayments.map((p) => [
      p.id,
      formatDateTime(p.paid_at),
      `"${p.community_name?.replace(/"/g, '""') || ""}"`,
      p.payment_method,
      Number(p.amount).toFixed(2).replace(".", ","),
      `"${(p.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_convites_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* TOTAIS CONSOLIDADOS DO EXTRATO FILTRADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Arrecadado (Filtro)
          </span>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalFiltered)}
          </div>
          <span className="text-xs text-slate-500 mt-1 tabular-nums">
            {filteredPayments.length} lançamento(s) registrado(s)
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Total em Pix
          </span>
          <div className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
            {formatCurrency(totalPix)}
          </div>
          <span className="text-xs text-slate-500 mt-1">Transferências instantâneas</span>
        </div>

        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Total em Dinheiro
          </span>
          <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalDinheiro)}
          </div>
          <span className="text-xs text-slate-500 mt-1">Espécie / Caixa físico</span>
        </div>

        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Total em Crédito
          </span>
          <div className="mt-2 text-2xl font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
            {formatCurrency(totalCredito)}
          </div>
          <span className="text-xs text-slate-500 mt-1">Maquininhas de cartão</span>
        </div>
      </div>

      {/* PAINEL PRINCIPAL DE LANÇAMENTOS */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {/* CABEÇALHO & FILTROS */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Extrato Financeiro Geral
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Histórico detalhado de recebimentos por comunidade e forma de pagamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Busca */}
            <div className="relative flex-1 sm:flex-initial min-w-[160px] sm:min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 min-h-[44px] sm:min-h-[36px]"
              />
            </div>

            {/* Filtro Comunidade */}
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="px-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/60 min-h-[44px] sm:min-h-[36px]"
            >
              <option value="TODAS">Todas as Comunidades</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filtro Forma de Pagamento */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/60 min-h-[44px] sm:min-h-[36px]"
            >
              <option value="TODOS">Todas as Formas</option>
              <option value="PIX">Pix</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CREDITO">Crédito</option>
            </select>

            {/* Botão Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/60 transition-all active:scale-95 min-h-[44px] sm:min-h-[36px] touch-manipulation"
              title="Baixar planilha CSV para Excel"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Exportar </span>CSV
            </button>

            {/* Botão Imprimir */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              title="Imprimir extrato"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABELA DE LANÇAMENTOS */}
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            Nenhum pagamento registrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Data / Hora</th>
                  <th className="py-3 px-4">Comunidade</th>
                  <th className="py-3 px-4">Forma de Pagamento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      {/* DATA */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {formatDateTime(p.paid_at)}
                        </div>
                      </td>

                      {/* COMUNIDADE */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          {p.community_name}
                        </span>
                      </td>

                      {/* FORMA DE PAGAMENTO */}
                      <td className="py-3.5 px-4">
                        {p.payment_method === "PIX" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                            <QrCode className="w-3 h-3" />
                            PIX
                          </span>
                        )}
                        {p.payment_method === "DINHEIRO" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            <Banknote className="w-3 h-3" />
                            Dinheiro
                          </span>
                        )}
                        {p.payment_method === "CREDITO" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                            <CreditCard className="w-3 h-3" />
                            Crédito
                          </span>
                        )}
                      </td>

                      {/* VALOR */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>

                      {/* OBSERVAÇÕES */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {p.notes || <span className="text-slate-400 dark:text-slate-600">-</span>}
                      </td>

                      {/* ESTORNO */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Deseja realmente estornar/excluir este pagamento de ${formatCurrency(
                                  p.amount
                                )} da comunidade ${p.community_name}?`
                              )
                            ) {
                              onDeletePayment(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Estornar este lançamento financeiro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
