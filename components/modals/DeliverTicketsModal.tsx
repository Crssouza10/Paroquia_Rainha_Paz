"use client";

import React, { useState, useEffect } from "react";
import { X, Layers, AlertCircle, Check } from "lucide-react";
import { CommunitySummary } from "@/types";
import { formatCurrency, formatTicketNumber, formatTicketPlural } from "@/lib/utils";

interface DeliverTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: CommunitySummary[];
  defaultCommunityId?: number;
  initialStartNum?: number;
  ticketPrice: number;
  totalTickets?: number;
  onDeliver: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

export const DeliverTicketsModal: React.FC<DeliverTicketsModalProps> = ({
  isOpen,
  onClose,
  communities,
  defaultCommunityId,
  initialStartNum,
  ticketPrice,
  totalTickets = 1000,
  onDeliver,
}) => {
  const [communityId, setCommunityId] = useState<string>("");
  const [startNumber, setStartNumber] = useState<string>("");
  const [endNumber, setEndNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultCommunityId) {
        setCommunityId(String(defaultCommunityId));
      } else if (communities.length > 0) {
        setCommunityId(String(communities[0].id));
      }

      if (initialStartNum) {
        setStartNumber(String(initialStartNum));
        setEndNumber(String(initialStartNum));
      } else {
        setStartNumber("");
        setEndNumber("");
      }
      setErrorMessage(null);
    }
  }, [isOpen, defaultCommunityId, initialStartNum, communities]);

  if (!isOpen) return null;

  const start = parseInt(startNumber, 10);
  const end = parseInt(endNumber, 10);
  const isValidRange = !isNaN(start) && !isNaN(end) && start > 0 && end >= start;
  const quantity = isValidRange ? end - start + 1 : 0;
  const estimatedValue = quantity * ticketPrice;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!communityId) {
      setErrorMessage("Selecione uma comunidade de destino.");
      return;
    }
    if (!isValidRange) {
      setErrorMessage("Informe uma faixa de números válida (ex: 0001 a 0050).");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("community_id", communityId);
    formData.append("start_number", String(start));
    formData.append("end_number", String(end));

    const result = await onDeliver(formData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message || "Erro ao distribuir convites.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto">
        {/* FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Entregar Convites por Lote
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Associe uma faixa contínua de convites numerados a uma comunidade.
            </p>
          </div>
        </div>

        {/* MENSAGEM DE ERRO/CONFLITO */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Comunidade de Destino
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
            >
              <option value="" disabled>
                Selecione uma comunidade...
              </option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.leader_name ? `(${c.leader_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Convite Inicial (De)
              </label>
              <input
                type="number"
                min="1"
                max={totalTickets}
                placeholder="Ex: 1"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
              />
              {start > 0 && (
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Formatado: #{formatTicketNumber(start)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Convite Final (Até)
              </label>
              <input
                type="number"
                min="1"
                max={totalTickets}
                placeholder="Ex: 50"
                value={endNumber}
                onChange={(e) => setEndNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
              />
              {end > 0 && (
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Formatado: #{formatTicketNumber(end)}
                </span>
              )}
            </div>
          </div>

          {/* RESUMO EM TEMPO REAL DO LOTE */}
          {isValidRange && (
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-medium font-mono">
                    Faixa: #{formatTicketNumber(start)} a #{formatTicketNumber(end)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Total de <strong className="text-blue-600 dark:text-blue-400">{quantity} convites</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Valor a Cobrar</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                    {formatCurrency(estimatedValue)}
                  </span>
                </div>
              </div>

              {communities.find((c) => c.id === parseInt(communityId, 10))?.phone && (
                <div className="text-right">
                  <a
                    href={`https://api.whatsapp.com/send?phone=55${(communities.find((c) => c.id === parseInt(communityId, 10))?.phone || "").replace(/\D/g, "")}&text=${encodeURIComponent(
                      [
                        `Olá, *${communities.find((c) => c.id === parseInt(communityId, 10))?.leader_name || "Responsável"}*! Registramos a entrega de um novo lote de convites para o *Almoço Comunitário* (*${communities.find((c) => c.id === parseInt(communityId, 10))?.name}*):`,
                        "",
                        "-----------------------------------",
                        `▸ *Faixa de Convites:* #${formatTicketNumber(start)} a #${formatTicketNumber(end)} (${formatTicketPlural(quantity)})`,
                        `▸ *Valor Correspondente:* ${formatCurrency(estimatedValue)}`,
                        "-----------------------------------",
                        "",
                        "Bom trabalho nas vendas! Agradecemos pela colaboração!",
                      ].join("\n")
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/20 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <span>Enviar Notificação WhatsApp ao Responsável</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* BOTÕES */}
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
              disabled={isSubmitting || !isValidRange || !communityId}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-900/20 disabled:opacity-50 transition-all min-h-[44px] touch-manipulation"
            >
              {isSubmitting ? (
                <>Processando...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Entrega
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
