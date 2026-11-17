import Link from "next/link";
import styles from "./Breadcrumb.module.css";

export default function Breadcrumb({ id, department }) {
  return (
    <div className={styles.breadcrumb}>
      <Link href="/catalog" className={styles.back}>
        <span aria-hidden="true">&larr;</span> Back to catalog
      </Link>
      <span className={styles.divider} aria-hidden="true" />
      <span className={styles.trail}>
        <span className={styles.id}>{id}</span>
        {department ? (
          <>
            <span className={styles.slash}>/</span>
            <span>{department}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
