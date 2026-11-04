"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  Ticket,
  DollarSign,
  PlusCircle,
  CreditCard,
  Undo2,
  Trash2,
  Calendar,
  Banknote,
  QrCode,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { CommunitySummary, Payment } from "@/types";
import {
  formatCurrency,
  formatDateTime,
  formatTicketNumber,
  formatTicketPlural,
  getWhatsAppSummaryUrl,
  getWhatsAppOfficialUrl,
} from "@/lib/utils";

interface CommunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: CommunitySummary | null;
  payments: Payment[];
  totalTickets?: number;
  onOpenDeliverModal: (communityId: number) => void;
  onOpenPaymentModal: (communityId: number) => void;
  onDeletePayment: (paymentId: number) => void;
  onReturnTicketsRange: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
  onReturnSingleTicket: (ticketNumber: number) => void;
}

export const CommunityDetailsModal: React.FC<CommunityDetailsModalProps> = ({
  isOpen,
  onClose,
  community,
  payments,
  totalTickets = 1000,
  onOpenDeliverModal,
  onOpenPaymentModal,
  onDeletePayment,
  onReturnTicketsRange,
  onReturnSingleTicket,
}) => {
  const [activeTab, setActiveTab] = useState<"convites" | "pagamentos" | "devolucao">("convites");
  const [returnStart, setReturnStart] = useState("");
  const [returnEnd, setReturnEnd] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  if (!isOpen || !community) return null;

  const communityPayments = payments.filter((p) => p.community_id === community.id);

  const handleReturnRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError(null);

    const start = parseInt(returnStart, 10);
    const end = parseInt(returnEnd, 10);

    if (isNaN(start) || isNaN(end) || start <= 0 || end < start) {
      setReturnError("Informe uma faixa válida de números para devolver.");
      return;
    }

    setIsReturning(true);
    const formData = new FormData();
    formData.append("community_id", String(community.id));
    formData.append("start_number", String(start));
    formData.append("end_number", String(end));

    const res = await onReturnTicketsRange(formData);
    setIsReturning(false);

    if (res.success) {
      setReturnStart("");
      setReturnEnd("");
      setActiveTab("convites");
    } else {
      setReturnError(res.message || "Erro ao devolver convites.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto text-slate-900 dark:text-slate-100">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DA COMUNIDADE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{community.name}</h3>
                {community.financial_status === "QUITADO" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Quitado
                  </span>
                )}
                {community.financial_status === "PENDENTE" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                    Pendente
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                {community.leader_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {community.leader_name}
                  </span>
                )}
                {community.phone && (
                  <a
                    href={getWhatsAppOfficialUrl(community.phone) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium touch-manipulation py-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {community.phone}
                    <ExternalLink className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* BOTÕES RÁPIDOS NO TOPO */}
          <div className="flex flex-wrap items-center gap-2">
            {community.phone && (
              <a
                href={getWhatsAppSummaryUrl(community) || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/20 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
                title="Enviar extrato completo via WhatsApp para o responsável"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Extrato WhatsApp</span>
              </a>
            )}
            <button
              onClick={() => onOpenDeliverModal(community.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Entregar
            </button>
            <button
              onClick={() => onOpenPaymentModal(community.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              + Pagamento
            </button>
          </div>
        </div>


        {/* CARDS FINANCEIROS CONSOLIDADOS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Qtd. Convites</span>
            <div className="text-xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">{community.tickets_count}</div>
            <span className="text-[10px] text-slate-500">sob custódia</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Valor Total</span>
            <div className="text-xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">{formatCurrency(community.total_tickets_value)}</div>
            <span className="text-[10px] text-slate-500">cota de convites</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Total Pago</span>
            <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{formatCurrency(community.total_paid)}</div>
            <span className="text-[10px] text-slate-500">
              Pix: {formatCurrency(community.paid_pix)}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Falta Acertar</span>
            <div
              className={`text-xl font-semibold mt-1 tabular-nums ${
                community.balance_due > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(community.balance_due)}
            </div>
            <span className="text-[10px] text-slate-500">
              {community.balance_due <= 0 ? "100% liquidado" : "saldo pendente"}
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS INTERNAS */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 text-sm font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("convites")}
            className={`pb-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm min-h-[44px] touch-manipulation transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "convites"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Convites ({community.tickets_count})
          </button>

          <button
            onClick={() => setActiveTab("pagamentos")}
            className={`pb-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm min-h-[44px] touch-manipulation transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "pagamentos"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Pagamentos ({communityPayments.length})
          </button>

          <button
            onClick={() => setActiveTab("devolucao")}
            className={`pb-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm min-h-[44px] touch-manipulation transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "devolucao"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Devolver Convites
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === "convites" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Faixas Numéricas Atribuídas:
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  {community.ticket_ranges}
                </span>
              </div>

              {community.ticket_numbers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Esta comunidade não possui nenhum convite atribuído no momento.
                </div>
              ) : (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    Convites sob posse da comunidade:
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto p-1">
                    {community.ticket_numbers.map((num) => (
                      <div
                        key={num}
                        className="p-1.5 rounded-lg text-center font-mono text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1 group hover:border-slate-400 dark:hover:border-slate-700 min-h-[36px]"
                      >
                        <span>#{formatTicketNumber(num)}</span>
                        <button
                          onClick={() => onReturnSingleTicket(num)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 transition-opacity p-1 touch-manipulation"
                          title="Devolver este convite individual ao estoque"
                        >
                          <Undo2 className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "pagamentos" && (
            <div className="space-y-3">
              {communityPayments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Nenhum pagamento registrado para esta comunidade até o momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {communityPayments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
                          {p.payment_method === "PIX" && <QrCode className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                          {p.payment_method === "DINHEIRO" && <Banknote className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                          {p.payment_method === "CREDITO" && <CreditCard className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm tabular-nums">
                              {formatCurrency(p.amount)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase border border-slate-200 dark:border-slate-700">
                              {p.payment_method}
                            </span>
                          </div>
                          <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            {formatDateTime(p.paid_at)}
                            {p.notes && ` • "${p.notes}"`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja estornar o pagamento de ${formatCurrency(p.amount)}?`
                            )
                          ) {
                            onDeletePayment(p.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        title="Estornar pagamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "devolucao" && (
            <form onSubmit={handleReturnRangeSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                <strong>Atenção:</strong> Ao devolver convites, eles voltam para o status{" "}
                <span className="font-bold">DISPONIVEL</span> no estoque geral e o saldo devedor desta comunidade é recalculado na hora.
              </div>

              {returnError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{returnError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Número Inicial (De)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalTickets}
                    placeholder="Ex: 1"
                    value={returnStart}
                    onChange={(e) => setReturnStart(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-base md:text-sm font-mono focus:outline-none focus:border-amber-500 min-h-[44px] sm:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Número Final (Até)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalTickets}
                    placeholder="Ex: 25"
                    value={returnEnd}
                    onChange={(e) => setReturnEnd(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-base md:text-sm font-mono focus:outline-none focus:border-amber-500 min-h-[44px] sm:min-h-0"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isReturning || !returnStart || !returnEnd}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-amber-900/20 disabled:opacity-50 transition-all min-h-[44px] touch-manipulation"
                >
                  <Undo2 className="w-4 h-4" />
                  {isReturning ? "Processando..." : "Confirmar Devolução ao Estoque"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
