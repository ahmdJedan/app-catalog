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

        <div className={styles.rightInfo}>
          <p className={styles.orgTitle}>DSTI Universitas Diponegoro</p>
          <p className={styles.siteTitle}>Katalog Aplikasi Internal</p>
        </div>
      </div>
    </header>
  );
}
