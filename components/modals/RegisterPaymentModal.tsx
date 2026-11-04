"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Check,
  AlertCircle,
} from "lucide-react";
import { CommunitySummary, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: CommunitySummary[];
  defaultCommunityId?: number;
  onRegisterPayment: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  communities,
  defaultCommunityId,
  onRegisterPayment,
}) => {
  const [communityId, setCommunityId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultCommunityId) {
        setCommunityId(String(defaultCommunityId));
      } else if (communities.length > 0) {
        setCommunityId(String(communities[0].id));
      }
      setAmount("");
      setPaymentMethod("PIX");
      setNotes("");
      setErrorMessage(null);
    }
  }, [isOpen, defaultCommunityId, communities]);

  if (!isOpen) return null;

  const selectedCommunity = communities.find((c) => c.id === parseInt(communityId, 10));

  const handleFillTotalDue = () => {
    if (selectedCommunity && selectedCommunity.balance_due > 0) {
      setAmount(selectedCommunity.balance_due.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!communityId) {
      setErrorMessage("Selecione uma comunidade.");
      return;
    }

    const numAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Informe um valor de pagamento válido maior que zero.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("community_id", communityId);
    formData.append("amount", amount);
    formData.append("payment_method", paymentMethod);
    if (notes) formData.append("notes", notes);

    const res = await onRegisterPayment(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message || "Erro ao registrar pagamento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Registrar Pagamento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Baixa financeira de convites via Dinheiro, Pix ou Cartão de Crédito.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Comunidade
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 min-h-[44px] sm:min-h-0"
            >
              <option value="" disabled>
                Selecione a comunidade...
              </option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Falta acertar: {formatCurrency(c.balance_due)})
                </option>
              ))}
            </select>

            {selectedCommunity && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Total de Convites:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedCommunity.tickets_count} convites ({formatCurrency(selectedCommunity.total_tickets_value)})
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Saldo em Aberto:</span>
                  <strong
                    className={`font-semibold tabular-nums text-sm ${
                      selectedCommunity.balance_due > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(selectedCommunity.balance_due)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Valor do Pagamento (R$)
              </label>
              {selectedCommunity && selectedCommunity.balance_due > 0 && (
                <button
                  type="button"
                  onClick={handleFillTotalDue}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium touch-manipulation py-1"
                >
                  Quitar Saldo ({formatCurrency(selectedCommunity.balance_due)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                R$
              </span>
              <input
                type="text"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 tabular-nums min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Forma de Pagamento (Obrigatório)
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* PIX */}
              <button
                type="button"
                onClick={() => setPaymentMethod("PIX")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 min-h-[52px] touch-manipulation ${
                  paymentMethod === "PIX"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-semibold">PIX</span>
              </button>

              {/* DINHEIRO */}
              <button
                type="button"
                onClick={() => setPaymentMethod("DINHEIRO")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 min-h-[52px] touch-manipulation ${
                  paymentMethod === "DINHEIRO"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs font-semibold">Dinheiro</span>
              </button>

              {/* CRÉDITO */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDITO")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 min-h-[52px] touch-manipulation ${
                  paymentMethod === "CREDITO"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="text-xs font-semibold">Crédito</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Observações / Comprovante (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Entregue por Maria, chave pix..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 min-h-[44px] sm:min-h-0"
            />
          </div>

          {selectedCommunity?.phone && parseFloat(amount) > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <span className="text-slate-600 dark:text-slate-400">
                Notificar <strong>{selectedCommunity.leader_name || selectedCommunity.name}</strong>:
              </span>
              <a
                href={`https://api.whatsapp.com/send?phone=55${selectedCommunity.phone.replace(/\D/g, "")}&text=${encodeURIComponent(
                  [
                    `Olá, *${selectedCommunity.leader_name || "Responsável"}*! Confirmamos o recebimento do acerto financeiro dos convites para o *Almoço Comunitário* (*${selectedCommunity.name}*):`,
                    "",
                    "-----------------------------------",
                    `▸ *Valor Recebido:* ${formatCurrency(parseFloat(amount) || 0)} (${paymentMethod})`,
                    `▸ *Saldo Restante a Acertar:* ${formatCurrency(Math.max(0, (selectedCommunity.balance_due || 0) - (parseFloat(amount) || 0)))}`,
                    "-----------------------------------",
                    "",
                    "Muito obrigado pela colaboração!",
                  ].join("\n")
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[40px] touch-manipulation"
              >
                <span>Enviar Recibo WhatsApp</span>
              </a>
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-all min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !communityId || !amount}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-900/20 disabled:opacity-50 transition-all min-h-[44px] touch-manipulation"
            >
              {isSubmitting ? (
                <>Gravando...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Pagamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
