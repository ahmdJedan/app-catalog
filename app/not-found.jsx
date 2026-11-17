import Link from "next/link";
import styles from "./applications/[id]/application-detail.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.stateBox}>
        <p className={styles.stateTitle}>Page not found.</p>
        <Link href="/catalog" className={styles.stateLink}>
          &larr; Back to catalog
        </Link>
      </div>
    </main>
  );
}
