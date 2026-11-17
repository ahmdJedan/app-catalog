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
          &larr; Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1>Edit Aplikasi: {application.app_name || application.id}</h1>
          <p>Perbarui informasi sistem, modul, maupun penugasan personil.</p>
        </div>
        <Link href="/admin" className={styles.btnSecondary}>
          &larr; Kembali ke Daftar
        </Link>
      </div>

      <ApplicationForm initialData={application} isEdit={true} />
    </>
  );
}
