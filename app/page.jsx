import {
  getAllApplications,
  getDistinctDepartments,
  getDistinctStatuses,
  getApplicationStats,
} from "@/lib/applications";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CatalogView from "@/components/CatalogView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let applications = [];
  let departmentOptions = [];
  let statusOptions = [];
  let stats = {};
  let errorMsg = null;

  try {
    [applications, departmentOptions, statusOptions, stats] = await Promise.all([
      getAllApplications(),
      getDistinctDepartments(),
      getDistinctStatuses(),
      getApplicationStats(),
    ]);
  } catch (err) {
    console.error("[HomePage Error]", err);
    errorMsg = "Gagal memuat katalog dari database.";
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content">
        <HeroSection stats={stats} />

        <div className="container">
          {errorMsg ? (
            <div className="alert-error" style={{ textAlign: "center", margin: "24px 0" }}>
              <p><strong>Error:</strong> {errorMsg}</p>
              <p>Silakan periksa koneksi database dan segarkan halaman.</p>
            </div>
          ) : (
            <CatalogView
              applications={applications}
              departmentOptions={departmentOptions}
              statusOptions={statusOptions}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
