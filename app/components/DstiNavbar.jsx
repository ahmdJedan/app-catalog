import Link from "next/link";
import styles from "./DstiNavbar.module.css";

export default function DstiNavbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandLink} aria-label="Beranda Katalog Aplikasi DSTI UNDIP">
          <img
            src="/images/undip-logo.png"
            alt="Lambang Universitas Diponegoro"
            className={styles.undipLogo}
          />
          <span className={styles.divider} aria-hidden="true" />
          <img
            src="/images/dsti-logo.png"
            alt="Logo Direktorat Sistem dan Teknologi Informasi UNDIP"
            className={styles.dstiLogo}
          />
        </Link>

        <div className={styles.centerInfo}>
          <p className={styles.siteTitle}>Katalog Aplikasi Internal</p>
          <p className={styles.orgTitle}>DSTI Universitas Diponegoro</p>
        </div>

        <div className={styles.rightInfo}>
          <div className={styles.desktopText}>
            <p className={styles.orgTitle}>DSTI Universitas Diponegoro</p>
            <p className={styles.siteTitle}>Katalog Aplikasi Internal</p>
          </div>
          <div className={styles.pwaBadge}>
            <span className={styles.pwaDot} aria-hidden="true" />
            <span>PWA Portal &middot; v2.0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
