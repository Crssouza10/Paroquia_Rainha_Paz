"use client";

import React, { useState } from "react";
import {
  X,
  Settings,
  RefreshCw,
  Check,
  AlertCircle,
  Database,
  Sun,
  Moon,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Setting } from "@/types";
import { useTheme } from "../ThemeProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Setting;
  isMockMode: boolean;
  onUpdateSettings: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
  onSeedTickets: (total: number) => Promise<{ success: boolean; message?: string }>;
  onClearAllData?: () => Promise<{ success: boolean; message?: string }>;
  onRestoreDemoData?: () => Promise<{ success: boolean; message?: string }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  isMockMode,
  onUpdateSettings,
  onSeedTickets,
  onClearAllData,
  onRestoreDemoData,
}) => {
  const { theme, setTheme } = useTheme();
  const [ticketPrice, setTicketPrice] = useState(settings.ticket_price.toFixed(2));
  const [totalTickets, setTotalTickets] = useState(String(settings.total_tickets));
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData();
    formData.append("ticket_price", ticketPrice);
    formData.append("total_tickets", totalTickets);

    const res = await onUpdateSettings(formData);
    setIsSaving(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message || "Configurações salvas com sucesso!" });
    } else {
      setMessage({ type: "error", text: res.message || "Erro ao salvar configurações." });
    }
  };

  const handleSeed = async () => {
    if (
      !confirm(
        `Deseja sincronizar/gerar a base de ${totalTickets} convites numerados (0001 a ${totalTickets})?`
      )
    ) {
      return;
    }

    setMessage(null);
    setIsSeeding(true);
    const res = await onSeedTickets(parseInt(totalTickets, 10) || 1000);
    setIsSeeding(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message || "Base de convites sincronizada com sucesso!" });
    } else {
      setMessage({ type: "error", text: res.message || "Erro ao sincronizar base." });
    }
  };

  const handleClearAllData = async () => {
    if (
      !confirm(
        "Tem certeza que deseja ZERAR todos os dados de teste (comunidades e pagamentos)? Os 1000 convites ficarão 100% disponíveis para seu evento real e o banco NUNCA mais recriará dados de exemplo."
      )
    ) {
      return;
    }

    if (!onClearAllData) return;
    setMessage(null);
    setIsClearing(true);
    const res = await onClearAllData();
    setIsClearing(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message || "Banco de dados zerado com sucesso!" });
    } else {
      setMessage({ type: "error", text: res.message || "Erro ao limpar dados." });
    }
  };

  const handleRestoreDemo = async () => {
    if (
      !confirm(
        "Deseja restaurar as 3 comunidades de demonstração e o histórico de pagamentos de teste?"
      )
    ) {
      return;
    }

    if (!onRestoreDemoData) return;
    setMessage(null);
    setIsRestoring(true);
    const res = await onRestoreDemoData();
    setIsRestoring(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message || "Dados de demonstração restaurados com sucesso!" });
    } else {
      setMessage({ type: "error", text: res.message || "Erro ao restaurar demonstração." });
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
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Configurações do Evento & Sistema
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajuste do tema visual, valor unitário e sincronização do Neon Postgres.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* OPÇÃO DE TEMA CLARO OU ESCURO */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Tema Visual</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Alternar entre Modo Claro (SaaS clean) e Escuro (Cinematográfico).
              </span>
            </div>
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`px-3 py-2 rounded-md font-medium text-xs flex items-center gap-1.5 transition-all min-h-[38px] sm:min-h-0 touch-manipulation ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-300"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`px-3 py-2 rounded-md font-medium text-xs flex items-center gap-1.5 transition-all min-h-[38px] sm:min-h-0 touch-manipulation ${
                  theme === "dark"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Escuro</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATUS DA CONEXÃO NEON POSTGRES */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Banco de Dados (Neon Postgres)
            </span>
            {isMockMode ? (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 text-[10px]">
                Modo Demonstração (Persistido Localmente)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 text-[10px]">
                Conectado ao Neon
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            {isMockMode ? (
              <>
                A variável <code className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded">DATABASE_URL</code> não foi encontrada no ambiente local. Os dados são salvos em arquivo JSON local e persistem normalmente. Na Vercel, o Neon Postgres já está conectado.
              </>
            ) : (
              <>Conexão ativa com o banco Serverless Neon. As alterações são sincronizadas e persistidas instantaneamente.</>
            )}
          </p>
        </div>

        {/* FORMULÁRIO DE PREÇO E TOTAL */}
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Valor do Convite (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  required
                  placeholder="25,00"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base md:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Total de Convites
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={totalTickets}
                onChange={(e) => setTotalTickets(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base md:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-blue-900/20 disabled:opacity-50 min-h-[44px] touch-manipulation"
            >
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>

        {/* BOTÃO DE SEED DOS 1000 CONVITES */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Sincronizar Base de Convites (0001 a {totalTickets})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Garante que todos os números de 0001 a {totalTickets} existam com status DISPONÍVEL.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {isSeeding ? "Sincronizando..." : "Executar Seed"}
            </button>
          </div>
        </div>

        {/* GESTÃO AVANÇADA DE DADOS: LIMPAR PARA PRODUÇÃO OU RESTAURAR DEMO */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <div>
              <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Zerar Todos os Dados (Pronto para o Evento Real)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Remove comunidades e pagamentos de teste, liberando os 1000 convites para cadastrar seus dados reais.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearAllData}
              disabled={isClearing}
              className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {isClearing ? "Limpando..." : "Limpar para Produção"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Restaurar Dados de Demonstração
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Recarrega as 3 comunidades de exemplo e histórico de pagamentos de teste.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestoreDemo}
              disabled={isRestoring}
              className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {isRestoring ? "Restaurando..." : "Restaurar Demonstração"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
