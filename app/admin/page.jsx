import { checkAdminSession } from "@/lib/auth";
import {
  getAllApplications,
  getApplicationStats,
  getDistinctDepartments,
  getDistinctStatuses,
} from "@/lib/applications";
import { redirect } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import AdminDashboardView from "@/components/AdminDashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard - Manajemen Aplikasi Aktif | DSTI UNDIP",
};

export default async function AdminDashboardPage() {
  const session = await checkAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [applications, stats, departmentOptions, statusOptions] =
    await Promise.all([
      getAllApplications({ includeDeleted: false }),
      getApplicationStats(),
      getDistinctDepartments(),
      getDistinctStatuses(),
    ]);

  return (
    <div className="admin-page-container">
      <AdminNavbar trashCount={stats.trashApplications} />

      <main className="container main-content">
        <AdminDashboardView
          initialApplications={applications}
          stats={stats}
          departmentOptions={departmentOptions}
          statusOptions={statusOptions}
        />
      </main>

      <Footer />
    </div>
  );
}
