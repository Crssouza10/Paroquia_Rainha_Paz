"use client";

import React, { useState, useMemo } from "react";
import {
  Ticket as TicketIcon,
  Search,
  Building2,
  User,
  Phone,
  Undo2,
  X,
  Layers,
  ExternalLink,
  UserCheck,
  Sparkles,
  Share2,
} from "lucide-react";
import { Ticket, CommunitySummary } from "@/types";
import { formatTicketNumber, formatCurrency, getWhatsAppOfficialUrl } from "@/lib/utils";

interface TicketsMapProps {
  tickets: Ticket[];
  communities: CommunitySummary[];
  ticketPrice: number;
  totalTickets: number;
  onReturnSingleTicket: (ticketNumber: number) => void;
  onOpenDeliverModalWithTicket: (ticketNumber: number) => void;
  onOpenSellNominalModal: (ticketNumber?: number) => void;
  onOpenDigitalTicketPreview: (ticket: Ticket) => void;
}

export const TicketsMap: React.FC<TicketsMapProps> = ({
  tickets,
  communities,
  ticketPrice,
  totalTickets,
  onReturnSingleTicket,
  onOpenDeliverModalWithTicket,
  onOpenSellNominalModal,
  onOpenDigitalTicketPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState<string>("TODOS");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [pageRange, setPageRange] = useState<number>(0);

  const rangeOptions = useMemo(() => {
    const maxNum = Math.max(totalTickets, ...tickets.map((t) => t.number), 100);
    const options: { label: string; start: number; end: number }[] = [];
    for (let start = 1; start <= maxNum; start += 100) {
      const end = Math.min(start + 99, maxNum);
      options.push({
        label: `${formatTicketNumber(start)} - ${formatTicketNumber(end)}`,
        start,
        end,
      });
    }
    options.push({
      label: `Ver Todos (${tickets.length})`,
      start: 1,
      end: maxNum,
    });
    return options;
  }, [totalTickets, tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchTerm.trim()) {
        const formatted = formatTicketNumber(t.number);
        const raw = String(t.number);
        const search = searchTerm.trim().toLowerCase();
        const matchesNum = formatted.includes(search) || raw.includes(search);
        const matchesComm = t.community_name?.toLowerCase().includes(search);
        const matchesBuyer =
          t.buyer_name?.toLowerCase().includes(search) ||
          t.buyer_phone?.includes(search);
        if (!matchesNum && !matchesComm && !matchesBuyer) return false;
      }

      if (statusFilter !== "TODOS" && t.status !== statusFilter) {
        return false;
      }

      if (selectedCommunityFilter !== "TODOS") {
        if (selectedCommunityFilter === "SEM_COMUNIDADE") {
          if (t.community_id !== null) return false;
        } else {
          if (t.community_id !== parseInt(selectedCommunityFilter, 10)) return false;
        }
      }

      const activePageIndex = pageRange >= rangeOptions.length ? 0 : pageRange;
      if (!searchTerm.trim() && activePageIndex >= 0 && activePageIndex < rangeOptions.length - 1) {
        const opt = rangeOptions[activePageIndex];
        if (t.number < opt.start || t.number > opt.end) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, searchTerm, statusFilter, selectedCommunityFilter, pageRange, rangeOptions]);

  const availableCount = tickets.filter((t) => t.status === "DISPONIVEL").length;
  const deliveredCount = tickets.filter((t) => t.status === "ENTREGUE").length;
  const soldCount = tickets.filter((t) => t.status === "VENDIDO").length;

  const selectedCommunityDetails = selectedTicket?.community_id
    ? communities.find((c) => c.id === selectedTicket.community_id)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* BARRA DE CONTROLE SUPERIOR */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* TÍTULO E LEGENDA COM 3 STATUS: DISPONÍVEL, ENTREGUE E VENDIDO NOMINAL */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                Mapa Geral de Convites (0001 a {formatTicketNumber(totalTickets)})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-500/50 inline-block"></span>
                Disponível ({availableCount})
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-blue-100 dark:bg-blue-500/30 border border-blue-500/60 inline-block"></span>
                Entregue ({deliveredCount})
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300">
                <span className="w-2.5 h-2.5 rounded bg-purple-200 dark:bg-purple-500/40 border border-purple-500/80 inline-block"></span>
                Vendido Nominal ({soldCount})
              </span>
            </div>
          </div>

          {/* BUSCA, FILTROS E BOTÃO "+ VENDA INDIVIDUAL" */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Input de busca rápida */}
            <div className="relative flex-1 sm:flex-initial min-w-[170px] sm:min-w-[210px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar nº ou comprador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-sans transition-all min-h-[44px] sm:min-h-[36px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Status com opção VENDIDO */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500 min-h-[44px] sm:min-h-[36px]"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="DISPONIVEL">Apenas Disponíveis</option>
              <option value="ENTREGUE">Apenas Entregues</option>
              <option value="VENDIDO">Apenas Vendidos (Nominais)</option>
            </select>

            {/* Filtro Comunidade */}
            <select
              value={selectedCommunityFilter}
              onChange={(e) => setSelectedCommunityFilter(e.target.value)}
              className="px-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500 max-w-[180px] min-h-[44px] sm:min-h-[36px]"
            >
              <option value="TODOS">Todas as Comunidades</option>
              <option value="SEM_COMUNIDADE">Sem Comunidade (Estoque)</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Botão de Destaque: "Venda Individual (Nominal)" */}
            <button
              onClick={() => onOpenSellNominalModal()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all shadow-sm shadow-purple-900/20 whitespace-nowrap ml-auto sm:ml-0 min-h-[44px] sm:min-h-[36px] touch-manipulation"
              title="Vender convite nominal para comprador final"
            >
              <UserCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span>Venda Nominal</span>
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO POR CENTENAS */}
        {!searchTerm && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Faixa:
            </span>
            <div className="flex items-center gap-1.5">
              {rangeOptions.map((opt, idx) => (
                <button
                  key={opt.label}
                  onClick={() => setPageRange(idx)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap min-h-[38px] sm:min-h-0 touch-manipulation transition-all ${
                    pageRange === idx
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-850"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRADE VISUAL DE CONVITES */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Exibindo <strong>{filteredTickets.length}</strong> de {tickets.length} convites
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
            Clique em qualquer convite para ver detalhes, emitir ou enviar via WhatsApp
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            Nenhum convite corresponde aos filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-20 gap-1.5">
            {filteredTickets.map((t) => {
              const isDelivered = t.status === "ENTREGUE";
              const isSold = t.status === "VENDIDO";
              const isSelected = selectedTicket?.number === t.number;

              return (
                <button
                  key={t.number}
                  onClick={() => {
                    if (isSold) {
                      onOpenDigitalTicketPreview(t);
                    } else {
                      setSelectedTicket(t);
                    }
                  }}
                  className={`relative p-1 sm:p-2 min-h-[44px] rounded-lg text-center font-mono text-xs font-semibold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border touch-manipulation ${
                    isSelected
                      ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900 z-10 scale-105"
                      : ""
                  } ${
                    isSold
                      ? "bg-purple-100 hover:bg-purple-200/80 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-600/40 shadow-sm"
                      : isDelivered
                      ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 shadow-sm"
                      : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  }`}
                  title={`Convite #${formatTicketNumber(t.number)} - ${
                    isSold
                      ? `Vendido para: ${t.buyer_name || "Comprador"} (Clique para ver ingresso VIP)`
                      : isDelivered
                      ? `Entregue para: ${t.community_name}`
                      : "Disponível no estoque"
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-tight">
                    {formatTicketNumber(t.number)}
                  </span>
                  {isSold ? (
                    <span className="text-[9px] font-sans font-medium text-purple-700 dark:text-purple-300 truncate max-w-[50px] leading-tight">
                      {t.buyer_name?.split(" ")[0] || "Vendido"}
                    </span>
                  ) : isDelivered ? (
                    <span className="text-[9px] font-sans font-medium text-slate-500 dark:text-slate-400 truncate max-w-[50px] leading-tight">
                      {t.community_name?.slice(0, 6)}..
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL / BOTTOM SHEET DE DETALHES DO CONVITE SELECIONADO */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
                  selectedTicket.status === "VENDIDO"
                    ? "bg-purple-600 shadow-purple-900/20"
                    : selectedTicket.status === "ENTREGUE"
                    ? "bg-blue-600 shadow-blue-900/20"
                    : "bg-emerald-600 shadow-emerald-900/20"
                }`}
              >
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">
                  Ficha do Convite
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                  #{formatTicketNumber(selectedTicket.number)}
                </h3>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status Atual:</span>
                {selectedTicket.status === "VENDIDO" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    VENDIDO NOMINAL
                  </span>
                ) : selectedTicket.status === "ENTREGUE" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    ENTREGUE À COMUNIDADE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    DISPONÍVEL NO ESTOQUE
                  </span>
                )}
              </div>

              {selectedTicket.status === "ENTREGUE" ? (
                <>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Comunidade Vinculada</span>
                    <strong className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      {selectedTicket.community_name || "Comunidade"}
                    </strong>
                  </div>

                  {selectedCommunityDetails?.leader_name && (
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Responsável</span>
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5 font-medium">
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {selectedCommunityDetails.leader_name}
                      </span>
                    </div>
                  )}

                  {selectedCommunityDetails?.phone && (
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Telefone / WhatsApp</span>
                      <a
                        href={getWhatsAppOfficialUrl(selectedCommunityDetails.phone) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5 font-semibold hover:underline touch-manipulation"
                      >
                        <Phone className="w-4 h-4" />
                        {selectedCommunityDetails.phone}
                        <ExternalLink className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      </a>
                    </div>
                  )}
                </>
              ) : selectedTicket.status === "VENDIDO" ? (
                <>
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Comprador Titular</span>
                    <strong className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-purple-500" />
                      {selectedTicket.buyer_name}
                    </strong>
                  </div>
                  {selectedTicket.buyer_phone && (
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">WhatsApp</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {selectedTicket.buyer_phone}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Este convite está livre no estoque geral da coordenação e pode ser vendido individualmente ou distribuído para uma comunidade.
                </div>
              )}
            </div>

            {/* AÇÕES NO POPUP */}
            <div className="mt-5 space-y-2.5">
              {/* BOTÃO PRIMÁRIO: VENDER NOMINAL */}
              <button
                onClick={() => {
                  const num = selectedTicket.number;
                  setSelectedTicket(null);
                  onOpenSellNominalModal(num);
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-900/20 active:scale-95 touch-manipulation"
              >
                <UserCheck className="w-4 h-4" />
                Vender Convite Nominal (#{formatTicketNumber(selectedTicket.number)})
              </button>

              {/* AÇÃO SECUNDÁRIA (DISTRIBUIR OU DEVOLVER) */}
              {selectedTicket.status === "ENTREGUE" ? (
                <button
                  onClick={() => {
                    onReturnSingleTicket(selectedTicket.number);
                    setSelectedTicket(null);
                  }}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/20 transition-all touch-manipulation"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Devolver Convite ao Estoque
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenDeliverModalWithTicket(selectedTicket.number);
                    setSelectedTicket(null);
                  }}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-all touch-manipulation"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Distribuir em Lote para Comunidade
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
