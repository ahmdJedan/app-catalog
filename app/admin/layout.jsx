import Link from "next/link";
import styles from "./admin.module.css";

export const metadata = {
  title: "Admin Panel - Application Catalog",
  description: "Panel pengelolaan dan CRUD katalog aplikasi internal.",
};

export default function AdminLayout({ children }) {
  return (
    <div className={styles.adminContainer}>
      <header className={styles.headerNav}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>Application Catalog</h2>
          <span className={styles.adminBadge}>Admin Panel</span>
        </div>

        <nav className={styles.navLinks}>
          <Link href="/admin" className={styles.navLink}>
            Aplikasi Aktif
          </Link>
          <Link href="/admin/trash" className={styles.navLink}>
            Tempat Sampah (Trash)
          </Link>
          <span className={styles.navDivider} aria-hidden="true" />
          <Link href="/catalog" className={styles.navLink} target="_blank">
            Lihat Katalog Publik &rarr;
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className={styles.logoutBtn}>
              Logout
            </button>
          </form>
        </nav>
      </header>

      {children}
    </div>
  );
}
