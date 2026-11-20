import {
  getAllApplications,
  getDistinctDepartments,
  getDistinctStatuses,
} from "@/lib/applications";
import DstiNavbar from "./components/DstiNavbar";
import DstiCatalogSection from "./components/DstiCatalogSection";
import DstiFooter from "./components/DstiFooter";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Aplikasi Internal - DSTI UNDIP",
  description:
    "Direktori layanan digital dan katalog aplikasi internal Direktorat Sistem dan Teknologi Informasi Universitas Diponegoro.",
};

export default async function LandingPage() {
  let applications = [];
  let departments = [];
  let statuses = [];

  try {
    const [appsData, deptsData, statusesData] = await Promise.all([
      getAllApplications(),
      getDistinctDepartments(),
      getDistinctStatuses(),
    ]);
    applications = appsData || [];
    departments = deptsData || [];
    statuses = statusesData || [];
  } catch (error) {
    console.error("[LandingPage] Gagal memuat data katalog:", error);
  }

  const totalApps = applications.length;
  const totalDepts = departments.length;
  const activeApps = applications.filter((app) => {
    const s = (app.status || "").toLowerCase().replace(/[\s\-_]+/g, "");
    if (
      s.includes("tidakaktif") ||
      s.includes("nonaktif") ||
      s.includes("inactive") ||
      s.includes("disabled") ||
      s.includes("arsip") ||
      s.includes("archived")
    ) {
      return false;
    }
    return s.includes("aktif") || s.includes("available");
  }).length;

  return (
    <div className={styles.page}>
      <DstiNavbar />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroBanner} aria-label="Sorotan Katalog">
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDash} aria-hidden="true">—</span>
              <span>DIREKTORI LAYANAN DIGITAL</span>
            </div>

            <h1 className={styles.heroTitle}>
              Katalog Aplikasi Internal DSTI UNDIP
            </h1>

            <p className={styles.heroDescription}>
              Portal inventarisasi terpusat sistem informasi, pembagian modul pengembang,
              dan tautan akses layanan di lingkungan Gedung ICT Center Universitas Diponegoro.
            </p>

            <div className={styles.metricsRow} aria-label="Statistik Layanan">
              <div className={styles.metricPill}>
                <strong>{totalApps}</strong>
                <span>Aplikasi Terdata</span>
              </div>
              <div className={styles.metricPill}>
                <strong>{totalDepts}</strong>
                <span>Direktorat &amp; Unit</span>
              </div>
              <div className={styles.metricPill}>
                <strong>{activeApps}</strong>
                <span>Layanan Aktif</span>
              </div>
            </div>

            <a href="#katalog" className={styles.heroCta}>
              <span>Jelajahi katalog</span>
              <span className={styles.ctaArrow} aria-hidden="true">&darr;</span>
            </a>
          </div>

          <div className={styles.heroVisual}>
            <img
              src="/images/ict-center.png"
              alt="Gedung ICT Center Universitas Diponegoro"
              className={styles.heroImage}
            />
            <div className={styles.imageOverlay} aria-hidden="true" />
            <div className={styles.locationBadge}>
              GEDUNG ICT CENTER &mdash; UNDIP
            </div>
          </div>
        </section>

        {/* Floating Filter Bar & Interactive Catalog Grid */}
        <DstiCatalogSection
          applications={applications}
          departmentOptions={departments}
          statusOptions={statuses}
        />
      </main>

      <DstiFooter />
    </div>
  );
}
