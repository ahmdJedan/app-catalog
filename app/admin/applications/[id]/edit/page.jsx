import { getApplicationById } from "@/lib/applications";
import ApplicationForm from "@/app/admin/components/ApplicationForm";
import styles from "@/app/admin/admin.module.css";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Aplikasi - Admin Panel",
};

export default async function EditApplicationPage({ params }) {
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  let application = null;

  try {
    application = await getApplicationById(id);
  } catch (error) {
    console.error(`[EditApplicationPage] ${id}`, error);
  }

  if (!application) {
    return (
      <div className={styles.emptyState}>
        <h2>Aplikasi Tidak Ditemukan</h2>
        <p>Aplikasi dengan ID &quot;{id}&quot; tidak ditemukan dalam database.</p>
        <Link href="/admin" className={styles.btnSecondary} style={{ marginTop: "16px" }}>
          <span aria-hidden="true">&larr;</span> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Edit Aplikasi: {application.app_name || application.id}</h1>
          <p className={styles.pageSubtitle}>
            Perbarui data sistem, tautan akses publik, dan modul pengembang di database internal DSTI UNDIP.
          </p>
        </div>
        <Link href="/admin" className={styles.btnSecondary}>
          <span aria-hidden="true">&larr;</span> Kembali ke Daftar
        </Link>
      </div>

      <ApplicationForm initialData={application} isEdit={true} />
    </>
  );
}
