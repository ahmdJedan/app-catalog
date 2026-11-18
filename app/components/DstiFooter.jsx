import styles from "./DstiFooter.module.css";

export default function DstiFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.brandName}>Direktorat Sistem dan Teknologi Informasi</p>
          <p className={styles.brandSub}>Universitas Diponegoro &middot; Semarang, Indonesia</p>
        </div>

        <p className={styles.address}>
          Gedung ICT Center Lt. 2, Jl. Prof. Sudarto, S.H., Tembalang, Semarang
        </p>

        <p className={styles.copyright}>
          &copy; 2026 DSTI UNDIP
        </p>
      </div>
    </footer>
  );
}
