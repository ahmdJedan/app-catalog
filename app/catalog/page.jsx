import Link from "next/link";
import {
  getAllApplications,
  getDistinctDepartments,
  getDistinctStatuses,
} from "@/lib/applications";
import CatalogView from "@/app/components/CatalogView";
import styles from "./catalog.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Aplikasi - Portal Sistem Informasi",
  description: "Daftar katalog aplikasi internal, status operasional, modul, dan penanggung jawab sistem.",
};

export default async function CatalogPage() {
  let applications = [];
  let departmentOptions = [];
  let statusOptions = [];
  let loadError = null;

  try {
    [applications, departmentOptions, statusOptions] = await Promise.all([
      getAllApplications(),
      getDistinctDepartments(),
      getDistinctStatuses(),
    ]);
  } catch (error) {
    console.error("[CatalogPage]", error);
    loadError = "Gagal memuat data aplikasi.";
  }

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/" className={styles.backHomeLink}>
          <span aria-hidden="true">&larr;</span> Kembali ke Beranda
        </Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>Application Catalog</h1>
        <p className={styles.subtitle}>
          Eksplorasi dan pantau seluruh aplikasi internal berdasarkan nama, status, atau unit/direktorat.
        </p>
      </header>

      {loadError ? (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>{loadError}</p>
          <p className={styles.errorHint}>
            Periksa koneksi database dan segarkan halaman kembali.
          </p>
        </div>
      ) : (
        <CatalogView
          applications={applications}
          departmentOptions={departmentOptions}
          statusOptions={statusOptions}
        />
      )}
    </main>
  );
}
