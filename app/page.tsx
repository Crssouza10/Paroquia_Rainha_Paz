import {
  getSettings,
  getCommunitiesWithSummaries,
  getAllTicketsWithCommunity,
  getPaymentsList,
  getDashboardSummary,
} from "@/lib/db";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const communities = await getCommunitiesWithSummaries();
  const tickets = await getAllTicketsWithCommunity();
  const payments = await getPaymentsList();
  const summary = await getDashboardSummary();

  return (
    <DashboardClient
      initialSettings={settings}
      initialCommunities={communities}
      initialTickets={tickets}
      initialPayments={payments}
      initialSummary={summary}
    />
  );
}
