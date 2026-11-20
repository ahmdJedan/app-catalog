import { checkAdminSession } from "@/lib/auth";
import { getApplicationById, getDistinctDepartments, getApplicationStats } from "@/lib/applications";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import ApplicationForm from "@/components/ApplicationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Aplikasi - Admin Panel | DSTI UNDIP",
};

export default async function EditAplikasiPage({ params }) {
  const session = await checkAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [app, stats, departmentOptions] = await Promise.all([
    getApplicationById(id),
    getApplicationStats(),
    getDistinctDepartments(),
  ]);

  if (!app) {
    notFound();
  }

  return (
    <div className="admin-page-container">
      <AdminNavbar trashCount={stats.trashApplications} />

      <main className="container main-content">
        <div className="form-page-header">
          <div>
            <h1 className="form-page-title">Edit Aplikasi</h1>
            <p className="form-page-subtitle">
              Perbarui data informasi, pengembang, modul, dan tautan akses sistem.
            </p>
          </div>

          <Link href="/admin" className="btn-outline">
            &larr; Kembali ke Daftar
          </Link>
        </div>

        <div className="form-card-container">
          <ApplicationForm
            initialData={app}
            departmentOptions={departmentOptions}
            isEdit={true}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
