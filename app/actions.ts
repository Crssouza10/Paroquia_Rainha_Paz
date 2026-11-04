"use server";

import { revalidatePath } from "next/cache";
import {
  createCommunity,
  updateCommunity,
  deleteCommunity,
  deliverTicketsRange,
  returnTicketsRange,
  returnSpecificTickets,
  createPayment,
  deletePayment,
  updateSettings,
  seedTickets,
  clearAllData,
  restoreDemoData,
  sellNominalTicket,
  cancelNominalSale,
} from "@/lib/db";
import { PaymentMethod, Ticket } from "@/types";

export interface ActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  ticket?: Ticket;
}


/**
 * Salvar Comunidade (Criar ou Atualizar)
 */
export async function saveCommunityAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const idStr = formData.get("id") as string | null;
    const name = (formData.get("name") as string)?.trim();
    const leader_name = (formData.get("leader_name") as string)?.trim() || undefined;
    const phone = (formData.get("phone") as string)?.trim() || undefined;

    if (!name) {
      return { success: false, message: "O nome da comunidade é obrigatório." };
    }

    if (idStr && parseInt(idStr, 10)) {
      const id = parseInt(idStr, 10);
      await updateCommunity(id, name, leader_name, phone);
      revalidatePath("/");
      return { success: true, message: `Comunidade "${name}" atualizada com sucesso!` };
    } else {
      await createCommunity(name, leader_name, phone);
      revalidatePath("/");
      return { success: true, message: `Comunidade "${name}" cadastrada com sucesso!` };
    }
  } catch (error: any) {
    console.error("Erro ao salvar comunidade:", error);
    return { success: false, message: error?.message || "Erro ao salvar comunidade." };
  }
}

/**
 * Excluir Comunidade
 */
export async function deleteCommunityAction(
  communityId: number
): Promise<ActionResult> {
  try {
    await deleteCommunity(communityId);
    revalidatePath("/");
    return { success: true, message: "Comunidade excluída e convites devolvidos ao estoque." };
  } catch (error: any) {
    console.error("Erro ao excluir comunidade:", error);
    return { success: false, message: error?.message || "Erro ao excluir comunidade." };
  }
}

/**
 * Distribuir / Entregar Convites por Lote
 */
export async function deliverTicketsAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const communityId = parseInt(formData.get("community_id") as string, 10);
    const startNum = parseInt(formData.get("start_number") as string, 10);
    const endNum = parseInt(formData.get("end_number") as string, 10);

    if (isNaN(communityId) || communityId <= 0) {
      return { success: false, message: "Selecione uma comunidade válida." };
    }
    if (isNaN(startNum) || isNaN(endNum) || startNum <= 0 || endNum <= 0) {
      return { success: false, message: "Informe números de convite válidos." };
    }
    if (startNum > endNum) {
      return {
        success: false,
        message: `O número inicial (${startNum}) não pode ser superior ao final (${endNum}).`,
      };
    }

    const result = await deliverTicketsRange(communityId, startNum, endNum);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    const qty = endNum - startNum + 1;
    revalidatePath("/");
    return {
      success: true,
      message: `${qty} convite(s) entregue(s) com sucesso (nº ${startNum} ao ${endNum})!`,
    };
  } catch (error: any) {
    console.error("Erro ao distribuir convites:", error);
    return { success: false, message: error?.message || "Erro ao distribuir convites." };
  }
}

/**
 * Devolver Convites por Lote
 */
export async function returnTicketsAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const communityId = parseInt(formData.get("community_id") as string, 10);
    const startNum = parseInt(formData.get("start_number") as string, 10);
    const endNum = parseInt(formData.get("end_number") as string, 10);

    if (isNaN(communityId) || communityId <= 0) {
      return { success: false, message: "Selecione uma comunidade válida." };
    }
    if (isNaN(startNum) || isNaN(endNum) || startNum <= 0 || endNum <= 0) {
      return { success: false, message: "Informe números válidos de convite." };
    }

    const result = await returnTicketsRange(communityId, startNum, endNum);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    revalidatePath("/");
    return {
      success: true,
      message: `Convites do nº ${startNum} ao ${endNum} devolvidos com sucesso ao estoque geral.`,
    };
  } catch (error: any) {
    console.error("Erro ao devolver convites:", error);
    return { success: false, message: error?.message || "Erro ao devolver convites." };
  }
}

/**
 * Devolver Convite Individual
 */
export async function returnSpecificTicketAction(
  ticketNumber: number
): Promise<ActionResult> {
  try {
    await returnSpecificTickets([ticketNumber]);
    revalidatePath("/");
    return {
      success: true,
      message: `Convite nº ${ticketNumber} devolvido ao estoque com sucesso!`,
    };
  } catch (error: any) {
    console.error("Erro ao devolver convite:", error);
    return { success: false, message: error?.message || "Erro ao devolver convite." };
  }
}

/**
 * Registrar Pagamento
 */
export async function registerPaymentAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const communityId = parseInt(formData.get("community_id") as string, 10);
    const amountStr = formData.get("amount") as string;
    const paymentMethod = formData.get("payment_method") as PaymentMethod;
    const notes = (formData.get("notes") as string)?.trim() || undefined;

    if (isNaN(communityId) || communityId <= 0) {
      return { success: false, message: "Selecione uma comunidade." };
    }

    // Tratar vírgula decimal brasileira ou ponto
    const cleanAmount = amountStr ? amountStr.replace(/\./g, "").replace(",", ".") : "";
    const amount = parseFloat(cleanAmount);

    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "Informe um valor de pagamento válido maior que zero." };
    }

    if (!["DINHEIRO", "PIX", "CREDITO"].includes(paymentMethod)) {
      return { success: false, message: "Selecione uma forma de pagamento válida (Dinheiro, Pix ou Crédito)." };
    }

    await createPayment(communityId, amount, paymentMethod, notes);
    revalidatePath("/");
    return {
      success: true,
      message: `Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!`,
    };
  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return { success: false, message: error?.message || "Erro ao registrar pagamento." };
  }
}

/**
 * Excluir/Estornar Pagamento
 */
export async function deletePaymentAction(
  paymentId: number
): Promise<ActionResult> {
  try {
    await deletePayment(paymentId);
    revalidatePath("/");
    return { success: true, message: "Lançamento de pagamento estornado com sucesso." };
  } catch (error: any) {
    console.error("Erro ao excluir pagamento:", error);
    return { success: false, message: error?.message || "Erro ao excluir pagamento." };
  }
}

/**
 * Atualizar Configurações Gerais (Preço do Convite e Total de Convites)
 */
export async function updateSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const priceStr = formData.get("ticket_price") as string;
    const totalTicketsStr = formData.get("total_tickets") as string;

    const cleanPrice = priceStr ? priceStr.replace(/\./g, "").replace(",", ".") : "";
    const ticketPrice = parseFloat(cleanPrice);
    const totalTickets = parseInt(totalTicketsStr, 10);

    if (isNaN(ticketPrice) || ticketPrice <= 0) {
      return { success: false, message: "Informe um valor unitário válido." };
    }
    if (isNaN(totalTickets) || totalTickets < 1) {
      return { success: false, message: "Informe uma quantidade total de convites válida (mínimo 1)." };
    }

    await updateSettings(ticketPrice, totalTickets);
    revalidatePath("/");
    return { success: true, message: "Configurações atualizadas com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao atualizar configurações:", error);
    return { success: false, message: error?.message || "Erro ao atualizar configurações." };
  }
}

/**
 * Seed Inicial / Recriar Convites
 */
export async function seedTicketsAction(totalTickets: number = 1000): Promise<ActionResult> {
  try {
    await seedTickets(totalTickets);
    revalidatePath("/");
    return { success: true, message: `${totalTickets} convites sincronizados com sucesso!` };
  } catch (error: any) {
    console.error("Erro no seed:", error);
    return { success: false, message: error?.message || "Erro ao sincronizar convites." };
  }
}

/**
 * Zerar Todos os Dados (Limpar para Produção)
 */
export async function clearAllDataAction(): Promise<ActionResult> {
  try {
    await clearAllData();
    revalidatePath("/");
    return {
      success: true,
      message: "Banco de dados zerado com sucesso! Pronto para cadastrar seus dados reais.",
    };
  } catch (error: any) {
    console.error("Erro ao zerar dados:", error);
    return { success: false, message: error?.message || "Erro ao zerar banco de dados." };
  }
}

/**
 * Restaurar Dados de Demonstração
 */
export async function restoreDemoDataAction(): Promise<ActionResult> {
  try {
    await restoreDemoData();
    revalidatePath("/");
    return {
      success: true,
      message: "Dados de demonstração restaurados com sucesso!",
    };
  } catch (error: any) {
    console.error("Erro ao restaurar demonstração:", error);
    return { success: false, message: error?.message || "Erro ao restaurar dados de demonstração." };
  }
}

/**
 * Venda Individual/Nominal de Convite (Comprador Final)
 */
export async function sellNominalTicketAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const ticketNumber = parseInt(formData.get("ticket_number") as string, 10);
    const buyerName = (formData.get("buyer_name") as string)?.trim();
    const buyerPhone = (formData.get("buyer_phone") as string)?.trim() || "";
    const paymentMethod = (formData.get("payment_method") as PaymentMethod) || "PIX";
    const communityIdStr = formData.get("community_id") as string | null;
    const communityId = communityIdStr ? parseInt(communityIdStr, 10) : undefined;
    const registerPayment = formData.get("register_payment") === "true" || formData.get("register_payment") === "on";

    if (isNaN(ticketNumber) || ticketNumber <= 0) {
      return { success: false, message: "Informe um número de convite válido." };
    }
    if (!buyerName) {
      return { success: false, message: "Informe o nome completo do comprador." };
    }

    const res = await sellNominalTicket({
      ticketNumber,
      buyerName,
      buyerPhone,
      paymentMethod,
      communityId,
      registerPayment,
    });

    if (!res.success) {
      return { success: false, message: res.message };
    }

    revalidatePath("/");
    return {
      success: true,
      message: res.message,
      ticket: res.ticket,
    };
  } catch (error: any) {
    console.error("Erro na venda nominal:", error);
    return { success: false, message: error?.message || "Erro ao processar venda de convite." };
  }
}

/**
 * Cancelar Venda Nominal (Estornar para Estoque ou Comunidade)
 */
export async function cancelNominalSaleAction(
  ticketNumber: number
): Promise<ActionResult> {
  try {
    const res = await cancelNominalSale(ticketNumber);
    if (!res.success) {
      return { success: false, message: res.message };
    }
    revalidatePath("/");
    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao cancelar venda nominal:", error);
    return { success: false, message: error?.message || "Erro ao cancelar venda nominal." };
  }
}
