import ApplicationForm from "@/app/admin/components/ApplicationForm";
import styles from "@/app/admin/admin.module.css";
import Link from "next/link";

export const metadata = {
  title: "Tambah Aplikasi Baru - Admin Panel",
};

export default function NewApplicationPage() {
  return (
    <>
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1>Tambah Aplikasi Baru</h1>
          <p>Daftarkan sistem aplikasi baru ke dalam database katalog internal.</p>
        </div>
        <Link href="/admin" className={styles.btnSecondary}>
          &larr; Kembali ke Daftar
        </Link>
      </div>

      <ApplicationForm isEdit={false} />
    </>
  );
}
