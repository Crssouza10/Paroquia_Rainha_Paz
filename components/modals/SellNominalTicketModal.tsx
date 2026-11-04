"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  UserCheck,
  User,
  Phone,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Ticket as TicketIcon,
} from "lucide-react";
import { Ticket, CommunitySummary, PaymentMethod } from "@/types";
import { formatTicketNumber, formatCurrency } from "@/lib/utils";

interface SellNominalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  communities: CommunitySummary[];
  initialTicketNumber?: number;
  ticketPrice: number;
  totalTickets?: number;
  onSellNominalTicket: (formData: FormData) => Promise<{ success: boolean; message?: string; ticket?: Ticket }>;
  onOpenDigitalTicket: (ticket: Ticket) => void;
}

export const SellNominalTicketModal: React.FC<SellNominalTicketModalProps> = ({
  isOpen,
  onClose,
  tickets,
  communities,
  initialTicketNumber,
  ticketPrice,
  totalTickets = 1000,
  onSellNominalTicket,
  onOpenDigitalTicket,
}) => {
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [communityId, setCommunityId] = useState<string>("");
  const [registerPayment, setRegisterPayment] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (initialTicketNumber) {
        setTicketNumber(String(initialTicketNumber));
      } else {
        // Encontrar primeiro convite disponível ou entregue
        const firstAvailable = tickets.find((t) => t.status === "DISPONIVEL" || t.status === "ENTREGUE");
        setTicketNumber(firstAvailable ? String(firstAvailable.number) : "1");
      }
      setBuyerName("");
      setBuyerPhone("");
      setPaymentMethod("PIX");
      setRegisterPayment(true);
      setErrorMessage(null);
    }
  }, [isOpen, initialTicketNumber, tickets]);

  // Convite atualmente selecionado
  const selectedTicket = useMemo(() => {
    const num = parseInt(ticketNumber, 10);
    if (isNaN(num)) return null;
    return tickets.find((t) => t.number === num) || null;
  }, [ticketNumber, tickets]);

  // Atualizar comunidade padrão quando o convite mudar
  useEffect(() => {
    if (selectedTicket) {
      if (selectedTicket.community_id) {
        setCommunityId(String(selectedTicket.community_id));
      } else {
        setCommunityId("");
      }
    }
  }, [selectedTicket]);

  // Máscara de telefone WhatsApp
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    setBuyerPhone(formatted);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const num = parseInt(ticketNumber, 10);
    if (isNaN(num) || num <= 0) {
      setErrorMessage("Informe um número de convite válido.");
      return;
    }

    if (!buyerName.trim()) {
      setErrorMessage("Por favor, informe o nome completo do comprador.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("ticket_number", String(num));
      formData.append("buyer_name", buyerName.trim());
      formData.append("buyer_phone", buyerPhone.trim());
      formData.append("payment_method", paymentMethod);
      if (communityId) {
        formData.append("community_id", communityId);
      }
      formData.append("register_payment", registerPayment ? "true" : "false");

      const result = await onSellNominalTicket(formData);
      if (result.success && result.ticket) {
        onClose();
        // Abrir diretamente o Preview VIP do ingresso
        onOpenDigitalTicket(result.ticket);
      } else if (!result.success) {
        setErrorMessage(result.message || "Erro ao processar venda do convite.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTicketAlreadySold = selectedTicket?.status === "VENDIDO";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Venda Individual de Convite
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Venda nominal com emissão de ingresso digital e envio por WhatsApp.
            </p>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NÚMERO DO CONVITE E STATUS */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TicketIcon className="w-3.5 h-3.5 text-purple-500" />
                Número do Convite
              </label>

              <div className="relative w-36">
                <input
                  type="number"
                  min="1"
                  max={totalTickets}
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="Ex: 12"
                  className="w-full px-3 py-2 text-center font-mono text-base font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            {/* STATUS DO CONVITE DIGITADO */}
            {selectedTicket ? (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">
                  Status atual:
                </span>
                {selectedTicket.status === "VENDIDO" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Já Vendido para {selectedTicket.buyer_name || "Comprador"}
                  </span>
                ) : selectedTicket.status === "ENTREGUE" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                    <Building2 className="w-3 h-3" />
                    Cota de: {selectedTicket.community_name || "Comunidade"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                    Livre no Estoque Geral
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-rose-500">Convite não cadastrado.</div>
            )}
          </div>

          {/* DADOS NOMINAIS: NOME E WHATSAPP */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Nome Completo do Comprador *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Ex: João Carlos Ferreira"
                  className="w-full pl-9 pr-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp do Comprador (para envio do ingresso)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                <input
                  type="text"
                  value={buyerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full pl-9 pr-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>
          </div>

          {/* VINCULAÇÃO COM COMUNIDADE */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Comunidade / Vendedor de Origem
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 min-h-[44px] sm:min-h-0"
              >
                <option value="">Coordenação Geral / Paróquia (Sem comunidade)</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Forma de Pagamento ({formatCurrency(ticketPrice)})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "PIX", label: "PIX" },
                { id: "DINHEIRO", label: "Dinheiro" },
                { id: "CREDITO", label: "Cartão" },
                { id: "PENDENTE", label: "Reservado" },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setPaymentMethod(m.id as PaymentMethod);
                    if (m.id === "PENDENTE") {
                      setRegisterPayment(false);
                    } else {
                      setRegisterPayment(true);
                    }
                  }}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center min-h-[44px] touch-manipulation ${
                    paymentMethod === m.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-900/30"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* CHECKBOX LANÇAR NO FINANCEIRO */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={registerPayment && paymentMethod !== "PENDENTE"}
                disabled={paymentMethod === "PENDENTE" || !communityId}
                onChange={(e) => setRegisterPayment(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-medium text-slate-900 dark:text-white block">
                  Lançar no Financeiro Automaticamente
                </span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  Registra entrada de {formatCurrency(ticketPrice)} no caixa/saldo da comunidade selecionada.
                </span>
              </div>
            </label>
          </div>

          {/* BOTÕES DE SUBMISSÃO */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isTicketAlreadySold}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all shadow-md shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Emitindo..." : "Confirmar Venda Nominal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
