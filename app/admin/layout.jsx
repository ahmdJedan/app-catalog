import { getArchivedApplications } from "@/lib/applications";
import AdminHeader from "./components/AdminHeader";
import DstiFooter from "../components/DstiFooter";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Panel - Application Catalog",
  description: "Panel pengelolaan dan CRUD katalog aplikasi internal DSTI UNDIP.",
};

export default async function AdminLayout({ children }) {
  let trashCount = 0;
  try {
    const archived = await getArchivedApplications();
    trashCount = archived.length;
  } catch (error) {
    console.error("[AdminLayout] Gagal memuat data arsip:", error);
  }

  return (
    <div className={styles.adminPageWrapper}>
      <AdminHeader trashCount={trashCount} />

      <main className={styles.adminMainContent}>
        {children}
      </main>

      <DstiFooter />
    </div>
  );
}
