"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, User, Phone, Check, AlertCircle } from "lucide-react";
import { CommunitySummary } from "@/types";

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityToEdit?: CommunitySummary | null;
  onSaveCommunity: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  communityToEdit,
  onSaveCommunity,
}) => {
  const [name, setName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (communityToEdit) {
        setName(communityToEdit.name);
        setLeaderName(communityToEdit.leader_name || "");
        setPhone(communityToEdit.phone || "");
      } else {
        setName("");
        setLeaderName("");
        setPhone("");
      }
      setErrorMessage(null);
    }
  }, [isOpen, communityToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("O nome da comunidade é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    if (communityToEdit) {
      formData.append("id", String(communityToEdit.id));
    }
    formData.append("name", name.trim());
    if (leaderName.trim()) formData.append("leader_name", leaderName.trim());
    if (phone.trim()) formData.append("phone", phone.trim());

    const res = await onSaveCommunity(formData);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message || "Erro ao salvar comunidade.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90dvh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6 my-0 sm:my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              {communityToEdit ? "Editar Comunidade" : "Cadastrar Nova Comunidade"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {communityToEdit
                ? "Atualize os dados de contato e identificação da comunidade."
                : "Informe o nome da comunidade e os dados do responsável."}
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
              Nome da Comunidade *
            </label>
            <input
              type="text"
              placeholder="Ex: Capela Perpétuo Socorro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Nome do Líder / Responsável
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: Maria Aparecida da Silva"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: (11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-base md:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

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
              disabled={isSubmitting || !name.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-900/20 disabled:opacity-50 transition-all min-h-[44px] touch-manipulation"
            >
              {isSubmitting ? (
                <>Salvando...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {communityToEdit ? "Salvar Alterações" : "Cadastrar Comunidade"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
