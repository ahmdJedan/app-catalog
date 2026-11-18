"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../admin.module.css";

export default function AdminHeader({ trashCount = 0 }) {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/applications");
    }
    return pathname.startsWith(path);
  };

  return (
    <header className={styles.headerNav}>
      <div className={styles.headerLeft}>
        <Link href="/" className={styles.brandLink} aria-label="Beranda Katalog">
          <img
            src="/images/undip-logo.png"
            alt="Lambang Universitas Diponegoro"
            className={styles.undipLogo}
          />
          <img
            src="/images/dsti-logo.png"
            alt="Logo DSTI UNDIP"
            className={styles.dstiLogo}
          />
        </Link>
        <span className={styles.brandTitle}>Katalog Aplikasi Internal</span>
        <span className={styles.adminBadge}>ADMIN PANEL</span>
      </div>

      <nav className={styles.navLinks} aria-label="Navigasi Admin">
        <Link
          href="/admin"
          className={`${styles.navTab} ${isActive("/admin") && !pathname.startsWith("/admin/trash") ? styles.navTabActive : ""}`}
        >
          Aplikasi Aktif
        </Link>

        <Link
          href="/admin/trash"
          className={`${styles.navTab} ${isActive("/admin/trash") ? styles.navTabActive : ""}`}
        >
          Tempat Sampah {trashCount > 0 ? `(${trashCount})` : ""}
        </Link>

        <span className={styles.navDivider} aria-hidden="true" />

        <Link href="/" className={styles.navExternalLink} target="_blank">
          <span>Lihat Katalog Publik</span>
          <span aria-hidden="true">&nearr;</span>
        </Link>

        <form action="/api/auth/logout" method="POST" className={styles.logoutForm}>
          <button type="submit" className={styles.logoutBtn}>
            Logout
          </button>
        </form>
      </nav>
    </header>
  );
}
