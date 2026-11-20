import { checkAdminSession } from "@/lib/auth";
import { getDistinctDepartments, getApplicationStats } from "@/lib/applications";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import ApplicationForm from "@/components/ApplicationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tambah Aplikasi Baru - Admin Panel | DSTI UNDIP",
};

export default async function TambahAplikasiPage() {
  const session = await checkAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [stats, departmentOptions] = await Promise.all([
    getApplicationStats(),
    getDistinctDepartments(),
  ]);

  return (
    <div className="admin-page-container">
      <AdminNavbar trashCount={stats.trashApplications} />

      <main className="container main-content">
        <div className="form-page-header">
          <div>
            <h1 className="form-page-title">Tambah Aplikasi Baru</h1>
            <p className="form-page-subtitle">
              Daftarkan sistem aplikasi baru ke dalam database katalog internal DSTI UNDIP.
            </p>
          </div>

          <Link href="/admin" className="btn-outline">
            &larr; Kembali ke Daftar
          </Link>
        </div>

        <div className="form-card-container">
          <ApplicationForm
            departmentOptions={departmentOptions}
            isEdit={false}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
