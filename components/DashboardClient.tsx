"use client";

import React, { useState } from "react";
import {
  Building2,
  Ticket,
  FileText,
} from "lucide-react";
import {
  Setting,
  CommunitySummary,
  Ticket as TicketType,
  Payment,
  DashboardSummary,
} from "@/types";
import { Navbar } from "./Navbar";
import { SummaryCards } from "./SummaryCards";
import { CommunitiesTable } from "./CommunitiesTable";
import { TicketsMap } from "./TicketsMap";
import { FinancialStatement } from "./FinancialStatement";
import { DeliverTicketsModal } from "./modals/DeliverTicketsModal";
import { RegisterPaymentModal } from "./modals/RegisterPaymentModal";
import { CommunityModal } from "./modals/CommunityModal";
import { CommunityDetailsModal } from "./modals/CommunityDetailsModal";
import { SettingsModal } from "./modals/SettingsModal";
import { SellNominalTicketModal } from "./modals/SellNominalTicketModal";
import { DigitalTicketPreviewModal } from "./modals/DigitalTicketPreviewModal";
import { ToastContainer, ToastMessage } from "./Toast";
import {
  deliverTicketsAction,
  returnTicketsAction,
  returnSpecificTicketAction,
  registerPaymentAction,
  deletePaymentAction,
  saveCommunityAction,
  deleteCommunityAction,
  updateSettingsAction,
  seedTicketsAction,
  clearAllDataAction,
  restoreDemoDataAction,
  sellNominalTicketAction,
  cancelNominalSaleAction,
} from "@/app/actions";


interface DashboardClientProps {
  initialSettings: Setting;
  initialCommunities: CommunitySummary[];
  initialTickets: TicketType[];
  initialPayments: Payment[];
  initialSummary: DashboardSummary;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialSettings,
  initialCommunities,
  initialTickets,
  initialPayments,
  initialSummary,
}) => {
  const [activeTab, setActiveTab] = useState<"comunidades" | "mapa" | "extrato">("comunidades");

  // Modais de controle
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [deliverCommunityId, setDeliverCommunityId] = useState<number | undefined>();
  const [deliverStartNum, setDeliverStartNum] = useState<number | undefined>();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCommunityId, setPaymentCommunityId] = useState<number | undefined>();

  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [communityToEdit, setCommunityToEdit] = useState<CommunitySummary | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetailsCommunity, setSelectedDetailsCommunity] = useState<CommunitySummary | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Modais de Venda Nominal e Ingresso Digital VIP
  const [isSellNominalModalOpen, setIsSellNominalModalOpen] = useState(false);
  const [sellNominalTicketNum, setSellNominalTicketNum] = useState<number | undefined>();

  const [isDigitalTicketModalOpen, setIsDigitalTicketModalOpen] = useState(false);
  const [digitalTicketToPreview, setDigitalTicketToPreview] = useState<TicketType | null>(null);

  // Sistema de Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // HANDLERS DE AÇÃO
  const handleOpenDeliver = (communityId?: number) => {
    setDeliverCommunityId(communityId);
    setDeliverStartNum(undefined);
    setIsDeliverModalOpen(true);
  };

  const handleOpenDeliverWithTicket = (ticketNumber: number) => {
    setDeliverStartNum(ticketNumber);
    setDeliverCommunityId(undefined);
    setIsDeliverModalOpen(true);
  };

  const handleOpenPayment = (communityId?: number) => {
    setPaymentCommunityId(communityId);
    setIsPaymentModalOpen(true);
  };

  const handleOpenSellNominal = (ticketNumber?: number) => {
    setSellNominalTicketNum(ticketNumber);
    setIsSellNominalModalOpen(true);
  };

  const handleOpenDigitalTicket = (ticket: TicketType) => {
    setDigitalTicketToPreview(ticket);
    setIsDigitalTicketModalOpen(true);
  };

  const handleCancelNominalSale = async (ticketNumber: number) => {
    const res = await cancelNominalSaleAction(ticketNumber);
    if (res.success) {
      addToast("success", res.message || "Venda nominal cancelada!");
    } else {
      addToast("error", res.message || "Erro ao cancelar venda nominal.");
    }
  };

  const handleOpenEditCommunity = (community: CommunitySummary) => {
    setCommunityToEdit(community);
    setIsCommunityModalOpen(true);
  };


  const handleOpenNewCommunity = () => {
    setCommunityToEdit(null);
    setIsCommunityModalOpen(true);
  };

  const handleOpenDetails = (community: CommunitySummary) => {
    setSelectedDetailsCommunity(community);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteCommunity = async (id: number, name: string) => {
    if (
      confirm(
        `Tem certeza que deseja excluir a comunidade "${name}"? Todos os convites entregues voltarão ao estoque.`
      )
    ) {
      const res = await deleteCommunityAction(id);
      if (res.success) {
        addToast("success", res.message || "Comunidade excluída com sucesso!");
      } else {
        addToast("error", res.message || "Erro ao excluir comunidade.");
      }
    }
  };

  const handleReturnSingleTicket = async (ticketNumber: number) => {
    if (confirm(`Deseja devolver o convite nº ${ticketNumber} ao estoque geral?`)) {
      const res = await returnSpecificTicketAction(ticketNumber);
      if (res.success) {
        addToast("success", res.message || "Convite devolvido ao estoque!");
        if (selectedDetailsCommunity) {
          setSelectedDetailsCommunity((prev) => {
            if (!prev) return null;
            const updatedNumbers = prev.ticket_numbers.filter((n) => n !== ticketNumber);
            return {
              ...prev,
              ticket_numbers: updatedNumbers,
              tickets_count: updatedNumbers.length,
            };
          });
        }
      } else {
        addToast("error", res.message || "Erro ao devolver convite.");
      }
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    const res = await deletePaymentAction(paymentId);
    if (res.success) {
      addToast("success", res.message || "Pagamento estornado com sucesso!");
    } else {
      addToast("error", res.message || "Erro ao estornar pagamento.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      {/* NAVBAR */}
      <Navbar
        isMockMode={initialSummary.is_mock_mode}
        ticketPrice={initialSummary.ticket_price}
        onOpenDeliverModal={() => handleOpenDeliver()}
        onOpenPaymentModal={() => handleOpenPayment()}
        onOpenSellNominalModal={() => handleOpenSellNominal()}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 flex-1 w-full">
        {/* CARDS RESUMO GERAL CONSOLIDADOS */}
        <SummaryCards summary={initialSummary} />

        {/* NAVEGAÇÃO DE ABAS: PÍLULAS RESPONSIVAS DE ALTA PRECISÃO */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-900 pb-3 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap w-full -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-950 border border-slate-300/80 dark:border-slate-900 shrink-0">
            {/* ABA 1: PAINEL POR COMUNIDADE */}
            <button
              onClick={() => setActiveTab("comunidades")}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap touch-manipulation ${
                activeTab === "comunidades"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700/80 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
              <span className="sm:hidden">Comunidades</span>
              <span className="hidden sm:inline">Painel por Comunidade</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {initialCommunities.length}
              </span>
            </button>

            {/* ABA 2: MAPA GERAL DE CONVITES (0001 A 1000) */}
            <button
              onClick={() => setActiveTab("mapa")}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap touch-manipulation ${
                activeTab === "mapa"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700/80 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Ticket className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span className="sm:hidden">Mapa Geral</span>
              <span className="hidden sm:inline">Mapa Geral de Convites</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                <span className="hidden sm:inline">0001 a </span>{initialSummary.total_tickets}
              </span>
            </button>

            {/* ABA 3: EXTRATO FINANCEIRO GERAL */}
            <button
              onClick={() => setActiveTab("extrato")}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap touch-manipulation ${
                activeTab === "extrato"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700/80 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
              <span className="sm:hidden">Extrato</span>
              <span className="hidden sm:inline">Extrato Financeiro Geral</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {initialPayments.length}
              </span>
            </button>
          </div>
        </div>

        {/* RENDERIZAÇÃO DA ABA ATIVA */}
        {activeTab === "comunidades" && (
          <CommunitiesTable
            communities={initialCommunities}
            onOpenDeliverModal={handleOpenDeliver}
            onOpenPaymentModal={handleOpenPayment}
            onOpenNewCommunity={handleOpenNewCommunity}
            onOpenEditModal={handleOpenEditCommunity}
            onOpenDetailsModal={handleOpenDetails}
            onDeleteCommunity={handleDeleteCommunity}
          />
        )}

        {activeTab === "mapa" && (
          <TicketsMap
            tickets={initialTickets}
            communities={initialCommunities}
            ticketPrice={initialSummary.ticket_price}
            totalTickets={initialSummary.total_tickets}
            onReturnSingleTicket={handleReturnSingleTicket}
            onOpenDeliverModalWithTicket={handleOpenDeliverWithTicket}
            onOpenSellNominalModal={handleOpenSellNominal}
            onOpenDigitalTicketPreview={handleOpenDigitalTicket}
          />
        )}


        {activeTab === "extrato" && (
          <FinancialStatement
            payments={initialPayments}
            communities={initialCommunities}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </main>

      {/* MODAL 1: ENTREGAR CONVITES */}
      <DeliverTicketsModal
        isOpen={isDeliverModalOpen}
        onClose={() => setIsDeliverModalOpen(false)}
        communities={initialCommunities}
        defaultCommunityId={deliverCommunityId}
        initialStartNum={deliverStartNum}
        ticketPrice={initialSummary.ticket_price}
        totalTickets={initialSummary.total_tickets}
        onDeliver={async (formData) => {
          const res = await deliverTicketsAction(formData);
          if (res.success) {
            addToast("success", res.message || "Convites distribuídos com sucesso!");
          }
          return res;
        }}
      />

      {/* MODAL 2: REGISTRAR PAGAMENTO */}
      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        communities={initialCommunities}
        defaultCommunityId={paymentCommunityId}
        onRegisterPayment={async (formData) => {
          const res = await registerPaymentAction(formData);
          if (res.success) {
            addToast("success", res.message || "Pagamento registrado!");
          }
          return res;
        }}
      />

      {/* MODAL 3: CADASTRAR/EDITAR COMUNIDADE */}
      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        communityToEdit={communityToEdit}
        onSaveCommunity={async (formData) => {
          const res = await saveCommunityAction(formData);
          if (res.success) {
            addToast("success", res.message || "Comunidade salva com sucesso!");
          }
          return res;
        }}
      />

      {/* MODAL 4: DETALHES DA COMUNIDADE */}
      <CommunityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        community={selectedDetailsCommunity}
        payments={initialPayments}
        totalTickets={initialSummary.total_tickets}
        onOpenDeliverModal={(commId) => {
          setIsDetailsModalOpen(false);
          handleOpenDeliver(commId);
        }}
        onOpenPaymentModal={(commId) => {
          setIsDetailsModalOpen(false);
          handleOpenPayment(commId);
        }}
        onDeletePayment={handleDeletePayment}
        onReturnTicketsRange={async (formData) => {
          const res = await returnTicketsAction(formData);
          if (res.success) {
            addToast("success", res.message || "Convites devolvidos com sucesso!");
          }
          return res;
        }}
        onReturnSingleTicket={handleReturnSingleTicket}
      />

      {/* MODAL 5: CONFIGURAÇÕES E SEED */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={initialSettings}
        isMockMode={initialSummary.is_mock_mode}
        onUpdateSettings={async (formData) => {
          const res = await updateSettingsAction(formData);
          if (res.success) {
            addToast("success", res.message || "Configurações atualizadas!");
          }
          return res;
        }}
        onSeedTickets={async (total) => {
          const res = await seedTicketsAction(total);
          if (res.success) {
            addToast("success", res.message || "Seed executado com sucesso!");
          }
          return res;
        }}
        onClearAllData={async () => {
          const res = await clearAllDataAction();
          if (res.success) {
            addToast("success", res.message || "Banco de dados zerado com sucesso!");
          } else {
            addToast("error", res.message || "Erro ao zerar dados.");
          }
          return res;
        }}
        onRestoreDemoData={async () => {
          const res = await restoreDemoDataAction();
          if (res.success) {
            addToast("success", res.message || "Demonstração restaurada com sucesso!");
          } else {
            addToast("error", res.message || "Erro ao restaurar demonstração.");
          }
          return res;
        }}
      />

      {/* MODAL 6: VENDA INDIVIDUAL / NOMINAL DE CONVITE */}
      <SellNominalTicketModal
        isOpen={isSellNominalModalOpen}
        onClose={() => setIsSellNominalModalOpen(false)}
        tickets={initialTickets}
        communities={initialCommunities}
        initialTicketNumber={sellNominalTicketNum}
        ticketPrice={initialSummary.ticket_price}
        totalTickets={initialSummary.total_tickets}
        onSellNominalTicket={async (formData) => {
          const res = await sellNominalTicketAction(formData);
          if (res.success) {
            addToast("success", res.message || "Venda nominal realizada com sucesso!");
          }
          return res;
        }}
        onOpenDigitalTicket={handleOpenDigitalTicket}
      />

      {/* MODAL 7: INGRESSO DIGITAL VIP COM QR CODE E WHATSAPP */}
      <DigitalTicketPreviewModal
        isOpen={isDigitalTicketModalOpen}
        onClose={() => setIsDigitalTicketModalOpen(false)}
        ticket={digitalTicketToPreview}
        ticketPrice={initialSummary.ticket_price}
        onCancelSale={handleCancelNominalSale}
      />

      {/* NOTIFICAÇÕES TOAST FLUTUANTES */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
