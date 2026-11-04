"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  User,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Trash2,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { Ticket, PaymentMethod } from "@/types";
import { formatTicketNumber, formatCurrency, getWhatsAppTicketUrl } from "@/lib/utils";

interface DigitalTicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  ticketPrice: number;
  onCancelSale?: (ticketNumber: number) => Promise<void>;
}

export const DigitalTicketPreviewModal: React.FC<DigitalTicketPreviewModalProps> = ({
  isOpen,
  onClose,
  ticket,
  ticketPrice,
  onCancelSale,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isCanceling, setIsCanceling] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const formattedNum = ticket ? formatTicketNumber(ticket.number) : "0000";
  const authCode = ticket ? `ALM-${formattedNum}-${(ticket.payment_method || "PIX").slice(0, 3)}-${((ticket.number * 7919) % 9999).toString(16).toUpperCase().padStart(4, "0")}` : "";

  // Gerar QR Code autêntico
  useEffect(() => {
    if (ticket && isOpen) {
      const qrPayload = `https://conviva.paroquia.app/validar?ticket=${ticket.number}&auth=${authCode}&buyer=${encodeURIComponent(ticket.buyer_name || "")}`;
      QRCode.toDataURL(qrPayload, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("Erro ao gerar QR Code:", err));
    }
  }, [ticket, isOpen, authCode]);

  if (!isOpen || !ticket) return null;

  const isPaid = ticket.payment_method && ticket.payment_method !== "PENDENTE";
  const statusLabel = isPaid
    ? `PAGO (${ticket.payment_method})`
    : "RESERVA PENDENTE";

  // Gerar URL oficial do WhatsApp com mensagem segura (BMP Unicode, sem surrogate pairs)
  const whatsappUrl = getWhatsAppTicketUrl({
    buyerPhone: ticket.buyer_phone,
    buyerName: ticket.buyer_name,
    ticketNumber: formattedNum,
    communityName: ticket.community_name,
    statusText: `${statusLabel} (${formatCurrency(ticketPrice)})`,
    validationCode: authCode,
  });

  // Imprimir apenas o ticket
  const handlePrint = () => {
    window.print();
  };

  const handleCancelSale = async () => {
    if (!onCancelSale) return;
    if (
      confirm(
        `Tem certeza que deseja cancelar a venda nominal do convite #${formattedNum}? O convite voltará a ficar disponível.`
      )
    ) {
      setIsCanceling(true);
      try {
        await onCancelSale(ticket.number);
        onClose();
      } finally {
        setIsCanceling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* ESTILOS DE IMPRESSÃO LIMPA DO INGRESSO */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-digital-ticket,
          #printable-digital-ticket * {
            visibility: visible !important;
          }
          #printable-digital-ticket {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 380px !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DO MODAL */}
        <div className="no-print flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Convite Digital VIP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresso nominal emitido com autenticação QR Code.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD DO INGRESSO VIP (ESTILO SYMPLA/TICKET COM RECORTES LATERAIS)        */}
        {/* ========================================================================= */}
        <div
          id="printable-digital-ticket"
          ref={ticketRef}
          className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#080d1a] text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* TOPO DO INGRESSO: BANNER DE AUTENTICIDADE */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-white shadow-inner">
            <span className="flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4" />
              Ingresso Oficial • Almoço Comunitário
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPaid
                  ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
              }`}
            >
              {isPaid ? "PAGO" : "RESERVADO"}
            </span>
          </div>

          {/* CORPO DO INGRESSO */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* NÚMERO DO CONVITE EM DESTAQUE GIGANTE */}
            <div className="flex items-end justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
                  Número do Convite
                </span>
                <span className="text-4xl font-extrabold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">
                  #{formattedNum}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
                  Valor Unitário
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatCurrency(ticketPrice)}
                </span>
              </div>
            </div>

            {/* DADOS NOMINAIS DO COMPRADOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-0.5">
                  <User className="w-3 h-3 text-purple-400" />
                  Titular / Comprador
                </span>
                <strong className="text-slate-100 font-semibold text-sm block truncate">
                  {ticket.buyer_name || "Não informado"}
                </strong>
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-0.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  WhatsApp
                </span>
                <span className="text-slate-100 font-medium font-mono text-xs block">
                  {ticket.buyer_phone || "Não informado"}
                </span>
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 sm:col-span-2">
                <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-0.5">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  Comunidade / Setor
                </span>
                <span className="text-slate-100 font-medium block">
                  {ticket.community_name || "Coordenação Geral / Paróquia"}
                </span>
              </div>
            </div>

            {/* DATA E LOCAL */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Domingo • A partir das 12h
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Salão Paroquial
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* DIVISÓRIA SERRILHADA COM RECORTES LATERAIS (TICKET NOTCHES)          */}
          {/* ===================================================================== */}
          <div className="relative py-2 flex items-center">
            {/* Recorte circular esquerdo */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
            {/* Linha pontilhada / tracejada */}
            <div className="w-full border-t-2 border-dashed border-slate-700/80 mx-6" />
            {/* Recorte circular direito */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800" />
          </div>

          {/* RODAPÉ DO INGRESSO: QR CODE DE VALIDAÇÃO E CÓDIGO DE AUTENTICIDADE */}
          <div className="p-4 sm:p-5 bg-slate-950/70 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Código de Autenticação
              </span>
              <span className="font-mono text-xs font-bold text-purple-300 tracking-wider">
                {authCode}
              </span>
              <p className="text-[10px] text-slate-500 leading-tight max-w-[200px]">
                Apresente na portaria para conferência de presença e retirada do almoço.
              </p>
            </div>

            {/* QR CODE GERADO */}
            <div className="shrink-0 bg-white p-1.5 rounded-xl shadow-lg border border-slate-800">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR Code Convite #${formattedNum}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-200 animate-pulse rounded" />
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AÇÕES: ENVIAR WHATSAPP / IMPRIMIR / CANCELAR VENDA                        */}
        {/* ========================================================================= */}
        <div className="no-print mt-5 space-y-2.5">
          {/* BOTÃO 1: ENVIAR VIA WHATSAPP (DESTAQUE VERDE OFICIAL) */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full min-h-[44px] px-4 rounded-xl font-semibold text-sm bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-emerald-950/20 touch-manipulation"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar Convite no WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="w-full min-h-[44px] px-4 rounded-xl font-medium text-sm bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>WhatsApp não informado para envio</span>
            </button>
          )}

          {/* BOTÃO 2: IMPRIMIR / SALVAR PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 min-h-[44px] px-4 rounded-xl font-medium text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar Ingresso</span>
            </button>

            {onCancelSale && (
              <button
                onClick={handleCancelSale}
                disabled={isCanceling}
                className="min-h-[44px] px-3 rounded-xl font-medium text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900/50 flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
                title="Cancelar venda e liberar convite de volta"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancelar Venda</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
