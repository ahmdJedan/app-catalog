import Link from "next/link";
import {
  getAllApplications,
  getDistinctDepartments,
  getDistinctStatuses,
} from "@/lib/applications";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal Katalog Aplikasi Internal",
  description: "Pusat inventarisasi dan informasi sistem aplikasi internal organisasi.",
};

export default async function LandingPage() {
  let appCount = 0;
  let deptCount = 0;
  let statusCount = 0;

  try {
    const [apps, depts, statuses] = await Promise.all([
      getAllApplications(),
      getDistinctDepartments(),
      getDistinctStatuses(),
    ]);
    appCount = apps.length;
    deptCount = depts.length;
    statusCount = statuses.length;
  } catch (error) {
    console.error("[LandingPage] Gagal memuat ringkasan metriks:", error);
  }

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <span className={styles.heroTag}>Portal Sistem Informasi</span>
          <h1 className={styles.heroTitle}>
            Pusat Katalog &amp; Pemetaan Aplikasi Internal
          </h1>
          <p className={styles.heroSubtitle}>
            Solusi satu pintu untuk meninjau status operasional, modul teknis,
            struktur penanggung jawab (Product Owner &amp; Programmer), serta
            diagram arsitektur seluruh sistem layanan.
          </p>
          <div className={styles.heroActions}>
            <Link href="/catalog" className={styles.primaryCta}>
              Jelajahi Katalog Aplikasi <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>

        {/* Quick Metrics */}
        <section className={styles.metricsGrid} aria-label="Statistik Katalog">
          <div className={styles.metricCard}>
            <div className={styles.metricNumber}>{appCount}</div>
            <div className={styles.metricLabel}>Aplikasi Aktif</div>
            <div className={styles.metricDesc}>Terdata dalam ekosistem sistem</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricNumber}>{deptCount}</div>
            <div className={styles.metricLabel}>Unit &amp; Direktorat</div>
            <div className={styles.metricDesc}>Pemilik dan pengelola layanan</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricNumber}>{statusCount}</div>
            <div className={styles.metricLabel}>Kategori Status</div>
            <div className={styles.metricDesc}>Siklus pengembangan &amp; rilis</div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Fitur &amp; Kemampuan Katalog</h2>
            <p className={styles.sectionSubtitle}>
              Dirancang untuk transparansi tata kelola teknologi informasi.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                🗂️
              </div>
              <h3 className={styles.featureTitle}>Sentralisasi Informasi Aplikasi</h3>
              <p className={styles.featureDescription}>
                Pencarian instan dan penyaringan fleksibel berdasarkan nama aplikasi,
                kode identifikasi, unit pemilik, hingga klasifikasi status operasional.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                👥
              </div>
              <h3 className={styles.featureTitle}>Pemetaan Modul &amp; PIC</h3>
              <p className={styles.featureDescription}>
                Transparansi pembagian tugas tim teknis. Ketahui programmer yang
                bertanggung jawab pada setiap modul serta kontak Product Owner terkait.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                📊
              </div>
              <h3 className={styles.featureTitle}>Monitoring Status &amp; Arsitektur</h3>
              <p className={styles.featureDescription}>
                Pantau kesiapan layanan mulai dari status Pilot, Request Access,
                hingga Aktif, lengkap dengan visualisasi diagram alur arsitektur sistem.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} Application Catalog Portal &mdash; Sistem Informasi Internal.
        </p>
      </footer>
    </div>
  );
}
