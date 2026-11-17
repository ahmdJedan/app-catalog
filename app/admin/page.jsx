import { getAllApplications } from "@/lib/applications";
import ActiveApplicationsTable from "./components/ActiveApplicationsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Aplikasi Aktif - Admin Panel",
};

export default async function AdminDashboardPage() {
  let applications = [];

  try {
    applications = await getAllApplications();
  } catch (error) {
    console.error("[AdminDashboardPage]", error);
  }

  return <ActiveApplicationsTable applications={applications} />;
}
