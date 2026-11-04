"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  User,
  Phone,
  Plus,
  CreditCard,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
} from "lucide-react";
import { CommunitySummary } from "@/types";
import {
  formatCurrency,
  formatTicketPlural,
  getWhatsAppSummaryUrl,
  getWhatsAppOfficialUrl,
} from "@/lib/utils";

export { getWhatsAppSummaryUrl } from "@/lib/utils";

interface CommunitiesTableProps {

  communities: CommunitySummary[];
  onOpenDeliverModal: (communityId?: number) => void;
  onOpenPaymentModal: (communityId?: number) => void;
  onOpenNewCommunity: () => void;
  onOpenEditModal: (community: CommunitySummary) => void;
  onOpenDetailsModal: (community: CommunitySummary) => void;
  onDeleteCommunity: (communityId: number, name: string) => void;
}

export const CommunitiesTable: React.FC<CommunitiesTableProps> = ({
  communities,
  onOpenDeliverModal,
  onOpenPaymentModal,
  onOpenNewCommunity,
  onOpenEditModal,
  onOpenDetailsModal,
  onDeleteCommunity,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [activeDropdown, setActiveDropdown] = useState<{
    id: number;
    community: CommunitySummary;
    buttonRect: DOMRect;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const portalMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechar dropdown ao clicar fora, ao scrollar a página/tabela ou ao pressionar Escape
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (portalMenuRef.current && !portalMenuRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleWindowEvents = () => {
      setActiveDropdown(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleWindowEvents, true);
    window.addEventListener("resize", handleWindowEvents);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleWindowEvents, true);
      window.removeEventListener("resize", handleWindowEvents);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown]);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, c: CommunitySummary) => {
    e.stopPropagation();
    if (activeDropdown?.id === c.id) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveDropdown({
        id: c.id,
        community: c,
        buttonRect: rect,
      });
    }
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.leader_name && c.leader_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (statusFilter === "PENDENTE") return c.financial_status === "PENDENTE";
    if (statusFilter === "QUITADO") return c.financial_status === "QUITADO";
    if (statusFilter === "SEM_CONVITES") return c.financial_status === "SEM_CONVITES";

    return true;
  });

  // Cálculo de posicionamento do menu portal
  const MENU_WIDTH = 224; // 14rem = 224px
  const MENU_HEIGHT = 185;
  const PADDING = 8;

  let showAbove = false;
  let menuLeft = 0;

  if (activeDropdown && typeof window !== "undefined") {
    const rect = activeDropdown.buttonRect;
    const spaceBelow = window.innerHeight - rect.bottom;
    showAbove = spaceBelow < MENU_HEIGHT && rect.top > MENU_HEIGHT;

    menuLeft = rect.right - MENU_WIDTH;
    if (menuLeft < PADDING) {
      menuLeft = PADDING;
    }
    if (menuLeft + MENU_WIDTH > window.innerWidth - PADDING) {
      menuLeft = window.innerWidth - MENU_WIDTH - PADDING;
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      {/* HEADER DA TABELA COM FILTROS E BOTÃO "+ NOVA COMUNIDADE" */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 rounded-t-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Painel por Comunidade
            </h2>
            <span className="text-xs text-slate-500 font-normal">
              ({communities.length} cadastradas)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribuição de cota de convites, conciliação financeira e saldo devedor por comunidade.
          </p>
        </div>

        {/* CONTROLES: BUSCA, FILTRO E BOTÃO "+ NOVA COMUNIDADE" */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Caixa de Busca com Bordas Nítidas */}
          <div className="relative flex-1 sm:flex-initial min-w-[160px] sm:min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar comunidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-base md:text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[44px] sm:min-h-[36px]"
            />
          </div>

          {/* Filtros de Status em Pílulas */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-850 text-xs">
            <button
              onClick={() => setStatusFilter("TODOS")}
              className={`px-3 py-2 sm:py-1 rounded-md font-medium min-h-[40px] sm:min-h-0 touch-manipulation transition-all ${
                statusFilter === "TODOS"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("PENDENTE")}
              className={`px-3 py-2 sm:py-1 rounded-md font-medium min-h-[40px] sm:min-h-0 touch-manipulation transition-all ${
                statusFilter === "PENDENTE"
                  ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-300 dark:border-amber-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter("QUITADO")}
              className={`px-3 py-2 sm:py-1 rounded-md font-medium min-h-[40px] sm:min-h-0 touch-manipulation transition-all ${
                statusFilter === "QUITADO"
                  ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-300 dark:border-emerald-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Quitados
            </button>
          </div>

          {/* Botão Oficial: "+ Nova Comunidade" */}
          <button
            onClick={onOpenNewCommunity}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-sm shadow-blue-900/20 ml-auto sm:ml-0 min-h-[44px] sm:min-h-[36px] touch-manipulation"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span>Nova Comunidade</span>
          </button>
        </div>
      </div>

      {/* ESTADO VAZIO */}
      {filteredCommunities.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Nenhuma comunidade encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
            {searchTerm
              ? "Tente refinar sua busca por outro termo ou nome."
              : "Clique no botão '+ Nova Comunidade' acima para cadastrar a primeira."}
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. VISÃO MOBILE OTIMIZADA (md:hidden) - CARDS EXECUTIVOS MOBILE           */}
          {/* ========================================================================= */}
          <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800/60">
            {filteredCommunities.map((c) => {
              const isPaid = c.financial_status === "QUITADO";
              const isPending = c.financial_status === "PENDENTE";
              const isNoTickets = c.financial_status === "SEM_CONVITES";
              const isDropdownOpen = activeDropdown?.id === c.id;

              return (
                <div key={c.id} className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  {/* Topo do Card: Nome da Comunidade + Badge de Status + Botão ... no canto direito */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                          {c.name}
                        </h3>
                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Quitado
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                          )}
                          {isNoTickets && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Sem Convites
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Abaixo: Nome do responsável e link clicável direto no telefone */}
                      <div className="flex flex-col mt-1.5 text-xs text-slate-500 dark:text-slate-400 gap-1">
                        {c.leader_name && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{c.leader_name}</span>
                          </span>
                        )}
                        {c.phone && (
                          <a
                            href={getWhatsAppOfficialUrl(c.phone) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap active:opacity-75 touch-manipulation py-0.5"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>{c.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Botão ... no canto direito com área de toque confortável */}
                    <button
                      onClick={(e) => handleToggleDropdown(e, c)}
                      className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center shrink-0 touch-manipulation transition-colors ${
                        isDropdownOpen
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                      }`}
                      title="Mais opções"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Meio do Card (Grid 3 colunas com fundo bg-slate-100/80 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800/80) */}
                  <div className="bg-slate-100/80 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                    {/* 1. Convites: Qtd e faixa */}
                    <div className="flex flex-col justify-center border-r border-slate-200/60 dark:border-slate-800/60 pr-1.5">
                      <span className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400 block tracking-tight">
                        Convites
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums mt-0.5">
                        {c.tickets_count}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.ticket_ranges || "Nenhum"}
                      </span>
                    </div>

                    {/* 2. Já Pagou: Valor em verde */}
                    <div className="flex flex-col justify-center border-r border-slate-200/60 dark:border-slate-800/60 px-1">
                      <span className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400 block tracking-tight">
                        Já Pagou
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm tabular-nums mt-0.5">
                        {formatCurrency(c.total_paid)}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Total Pago
                      </span>
                    </div>

                    {/* 3. Falta Acertar: Valor em destaque */}
                    <div className="flex flex-col justify-center pl-1.5">
                      <span className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400 block tracking-tight">
                        Falta Acertar
                      </span>
                      <span
                        className={`font-semibold text-xs sm:text-sm tabular-nums mt-0.5 ${
                          c.balance_due > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                        }`}
                      >
                        {formatCurrency(c.balance_due)}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {c.balance_due > 0 ? "Pendente" : "Quitado"}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do Card (Botões Lado a Lado 50%/50% com min-h-[44px] e touch-manipulation) */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => onOpenDeliverModal(c.id)}
                      className="w-full flex-1 min-h-[44px] py-2.5 px-3 text-xs font-semibold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation transition-all"
                    >
                      <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span>+ Convites</span>
                    </button>

                    <button
                      onClick={() => onOpenPaymentModal(c.id)}
                      className="w-full flex-1 min-h-[44px] py-2.5 px-3 text-xs font-semibold rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation transition-all"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>+ Pagar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 2. TABELA DESKTOP COMPLETA (hidden md:block) - ALTO NÍVEL, SEM QUEBRAS    */}
          {/* ========================================================================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Comunidade</th>
                  <th className="py-3 px-4">Qtd. & Faixas</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Já Pagou</th>
                  <th className="py-3 px-4 text-right">Falta Acertar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredCommunities.map((c) => {
                  const isPaid = c.financial_status === "QUITADO";
                  const isPending = c.financial_status === "PENDENTE";
                  const isNoTickets = c.financial_status === "SEM_CONVITES";

                  // Detalhes menores de pagamento
                  const paymentParts: string[] = [];
                  if (c.paid_pix > 0) paymentParts.push(`Pix: ${formatCurrency(c.paid_pix)}`);
                  if (c.paid_dinheiro > 0) paymentParts.push(`Din: ${formatCurrency(c.paid_dinheiro)}`);
                  if (c.paid_credito > 0) paymentParts.push(`Créd: ${formatCurrency(c.paid_credito)}`);
                  const paymentDetails = paymentParts.join(" / ");

                  const isDropdownOpen = activeDropdown?.id === c.id;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* NOME / RESPONSÁVEL / TELEFONE */}
                      <td className="py-3.5 px-4 sm:px-6 min-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {c.name}
                          </span>
                          <div className="flex flex-col mt-0.5 text-xs text-slate-500 dark:text-slate-400 gap-0.5">
                            {c.leader_name && (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="truncate">{c.leader_name}</span>
                              </span>
                            )}
                            {c.phone && (
                              <a
                                href={getWhatsAppOfficialUrl(c.phone) || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-medium whitespace-nowrap"
                                title="Conversar no WhatsApp"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{c.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* QTD CONVITES & FAIXAS */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
                              {formatTicketPlural(c.tickets_count)}
                            </span>
                          </div>
                          <span
                            className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]"
                            title={c.ticket_ranges}
                          >
                            {c.ticket_ranges}
                          </span>
                        </div>
                      </td>

                      {/* VALOR TOTAL */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatCurrency(c.total_tickets_value)}
                        </span>
                      </td>

                      {/* JÁ PAGOU */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(c.total_paid)}
                          </span>
                          {paymentDetails ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                              {paymentDetails}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">-</span>
                          )}
                        </div>
                      </td>

                      {/* FALTA ACERTAR: NUNCA NEGATIVO */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            c.balance_due > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 dark:text-slate-500 font-normal"
                          }`}
                        >
                          {formatCurrency(c.balance_due)}
                        </span>
                      </td>

                      {/* STATUS: NUNCA EM BRANCO */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Quitado
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                        {isNoTickets && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Sem Convites
                          </span>
                        )}
                      </td>

                      {/* AÇÕES: EM LINHA HORIZONTAL ÚNICA COM DROPDOWN VIA PORTAL */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {/* Botão 1: + Convites (Azul sutil) */}
                          <button
                            onClick={() => onOpenDeliverModal(c.id)}
                            className="h-8 px-3 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 inline-flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
                            title="Entregar lote de convites"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            <span>+ Convites</span>
                          </button>

                          {/* Botão 2: + Pagar (Verde sutil) */}
                          <button
                            onClick={() => onOpenPaymentModal(c.id)}
                            className="h-8 px-3 text-xs font-medium rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
                            title="Registrar pagamento"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>+ Pagar</span>
                          </button>

                          {/* Botão 3: Menu Dropdown '...' para Ações Secundárias */}
                          <button
                            onClick={(e) => handleToggleDropdown(e, c)}
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
                              isDropdownOpen
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                            }`}
                            title="Mais opções"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PORTAL DO MENU DROPDOWN DE AÇÕES - FLUTUA LIVREMENTE POR CIMA DE QUALQUER BORDA/OVERFLOW */}
      {mounted && activeDropdown && typeof document !== "undefined" && createPortal(
        <div
          ref={portalMenuRef}
          style={{
            position: "fixed",
            top: showAbove ? "auto" : `${activeDropdown.buttonRect.bottom + 4}px`,
            bottom: showAbove ? `${window.innerHeight - activeDropdown.buttonRect.top + 4}px` : "auto",
            left: `${menuLeft}px`,
            zIndex: 9999,
          }}
          className="w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 animate-scale-up text-left ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* 1. Visualizar Detalhes */}
          <button
            onClick={() => {
              const comm = activeDropdown.community;
              setActiveDropdown(null);
              onOpenDetailsModal(comm);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Visualizar Detalhes</span>
          </button>

          {/* 2. Enviar Resumo WhatsApp */}
          {activeDropdown.community.phone ? (
            <a
              href={getWhatsAppSummaryUrl(activeDropdown.community) || "#"}
              target="_blank"
              rel="noreferrer"
              onClick={() => setActiveDropdown(null)}
              className="w-full px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Enviar Resumo WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="w-full px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center gap-2.5 opacity-60"
              title="Nenhum WhatsApp cadastrado"
            >
              <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              <span>Enviar Resumo WhatsApp</span>
            </button>
          )}

          {/* 3. Editar Comunidade */}
          <button
            onClick={() => {
              const comm = activeDropdown.community;
              setActiveDropdown(null);
              onOpenEditModal(comm);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Editar Comunidade</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {/* 4. Excluir Comunidade */}
          <button
            onClick={() => {
              const comm = activeDropdown.community;
              setActiveDropdown(null);
              onDeleteCommunity(comm.id, comm.name);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>Excluir Comunidade</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
