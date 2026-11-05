"use client";

import React from "react";
import {
  Ticket,
  CreditCard,
  Settings,
  Layers,
  Sun,
  Moon,
  UserCheck,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  isMockMode: boolean;
  ticketPrice: number;
  onOpenDeliverModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenSellNominalModal: () => void;
  onOpenSettingsModal: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  isMockMode,
  ticketPrice,
  onOpenDeliverModal,
  onOpenPaymentModal,
  onOpenSellNominalModal,
  onOpenSettingsModal,
}) => {

  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Contexto do Evento */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
              <Ticket className="w-4 h-4 transform -rotate-12" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Gestão Pariquial
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                Almoço Comunitário
              </span>
            </div>
          </div>

          {/* Ações do Topo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Indicador de Status do Banco (apenas em telas maiores para poupar espaço mobile) */}
            {isMockMode ? (
              <span
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20"
                title="Modo Demonstração com dados em memória."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                Modo Demonstração
              </span>
            ) : (
              <span
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Neon Postgres
              </span>
            )}

            {/* BOTÕES DESKTOP (MD+) */}
            {/* Botão Secundário: "Entregar Convites" */}
            <button
              onClick={onOpenDeliverModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 border border-blue-200 dark:border-blue-500/20 active:scale-[0.98] transition-all shadow-sm touch-manipulation"
              title="Distribuir lote de convites para uma comunidade"
            >
              <Layers className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Entregar Convites</span>
            </button>

            {/* Botão Primário: "Registrar Pagamento" */}
            <button
              onClick={onOpenPaymentModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-950/20 active:scale-[0.98] transition-all touch-manipulation"
              title="Registrar pagamento de convites"
            >
              <CreditCard className="w-4 h-4 shrink-0 text-emerald-100" />
              <span>Pagar</span>
            </button>

            {/* Botão Destaque: "Venda Nominal" */}
            <button
              onClick={onOpenSellNominalModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm shadow-purple-950/20 active:scale-[0.98] transition-all touch-manipulation"
              title="Vender convite nominal com emissão de ingresso VIP e envio por WhatsApp"
            >
              <UserCheck className="w-4 h-4 shrink-0 text-purple-100" />
              <span>Venda Nominal</span>
            </button>

            {/* Alternador de Tema Claro / Escuro */}
            <button
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors flex items-center justify-center touch-manipulation"
              title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
              aria-label="Alternar tema de cores"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>

            {/* Configurações (Minimalista e Discreto) */}
            <button
              onClick={onOpenSettingsModal}
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors flex items-center justify-center touch-manipulation"
              title="Configurações gerais e sincronização da base"
              aria-label="Abrir configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES RÁPIDAS MOBILE (< 768px): GRADE 3 COLUNAS TOUCH-FRIENDLY */}
      <div className="md:hidden border-t border-slate-200/80 dark:border-slate-900 bg-slate-50/90 dark:bg-slate-950/95 backdrop-blur-md px-3 py-2">
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            onClick={onOpenDeliverModal}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/20 active:scale-95 transition-all touch-manipulation shadow-xs"
            title="Entregar lote de convites"
          >
            <Layers className="w-4 h-4 shrink-0 text-blue-500" />
            <span>+ Convites</span>
          </button>

          <button
            onClick={onOpenPaymentModal}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all touch-manipulation shadow-xs"
            title="Registrar pagamento"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-white" />
            <span>+ Pagar</span>
          </button>

          <button
            onClick={onOpenSellNominalModal}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 active:scale-95 transition-all touch-manipulation shadow-xs"
            title="Venda nominal com ingresso VIP"
          >
            <UserCheck className="w-4 h-4 shrink-0 text-white" />
            <span>Nominal VIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
