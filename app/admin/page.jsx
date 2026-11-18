import {
  getAllApplications,
  getDistinctDepartments,
  getDistinctStatuses,
  getArchivedApplications,
} from "@/lib/applications";
import ActiveApplicationsTable from "./components/ActiveApplicationsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Aplikasi Aktif - Admin Panel",
};

export default async function AdminDashboardPage() {
  let applications = [];
  let departments = [];
  let statuses = [];
  let archivedCount = 0;

  try {
    const [appsData, deptsData, statusesData, archivedData] = await Promise.all([
      getAllApplications(),
      getDistinctDepartments(),
      getDistinctStatuses(),
      getArchivedApplications(),
    ]);
    applications = appsData || [];
    departments = deptsData || [];
    statuses = statusesData || [];
    archivedCount = archivedData?.length || 0;
  } catch (error) {
    console.error("[AdminDashboardPage] Error loading data:", error);
  }

  return (
    <ActiveApplicationsTable
      applications={applications}
      departments={departments}
      statuses={statuses}
      archivedCount={archivedCount}
    />
  );
}
