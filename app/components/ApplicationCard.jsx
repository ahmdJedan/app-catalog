import Link from "next/link";
import styles from "./ApplicationCard.module.css";

export default function ApplicationCard({ application, index }) {
  const {
    id,
    app_id,
    app_name,
    description,
    status,
    department,
    owner_unit,
    po_number,
    diagram,
  } = application;

  // Determine badge styling based on status string
  const normStatus = (status || "").toLowerCase();
  let badgeClass = styles.badgeDefault;
  if (
    normStatus.includes("tidak aktif") ||
    normStatus.includes("nonaktif") ||
    normStatus.includes("non-aktif") ||
    normStatus.includes("inactive")
  ) {
    badgeClass = styles.badgeInactive;
  } else if (normStatus.includes("aktif") || normStatus.includes("available")) {
    badgeClass = styles.badgeActive;
  } else if (normStatus.includes("pilot")) {
    badgeClass = styles.badgePilot;
  } else if (normStatus.includes("request")) {
    badgeClass = styles.badgeRequest;
  } else if (normStatus.includes("retiring")) {
    badgeClass = styles.badgeRetiring;
  }

  // Format index or app number (e.g. APLIKASI · 04)
  const appNumber =
    index !== undefined
      ? String(index + 1).padStart(2, "0")
      : app_id
      ? String(app_id).replace(/\D/g, "").slice(-2) || "01"
      : "01";

  // Check if diagram is a valid external URL
  const isUrl = diagram && (diagram.startsWith("http://") || diagram.startsWith("https://"));

  return (
    <article className={styles.card}>
      <div className={styles.cardTopline} />

      <div className={styles.cardBody}>
        <div className={styles.cardHeaderRow}>
          <div className={styles.appIdentity}>
            <span className={styles.categoryTag}>APLIKASI &middot; {appNumber}</span>
            <h3 className={styles.appName}>{app_name || "Untitled application"}</h3>
          </div>

          <span className={`${styles.badge} ${badgeClass}`}>
            <span className={styles.badgeDot} aria-hidden="true" />
            {status || "Aktif"}
          </span>
        </div>

        <p className={styles.description}>
          {description || "Deskripsi aplikasi internal belum tersedia."}
        </p>

        {department ? (
          <div className={styles.departmentTag} title={department}>
            {department}
          </div>
        ) : null}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.acronym}>
          {owner_unit || po_number || "DSTI"}
        </span>

        <div className={styles.cardActions}>
          {isUrl ? (
            <a
              href={diagram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              <span>Kunjungi Situs</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : (
            <span className={styles.internalLabel}>Internal</span>
          )}

          <Link href={`/applications/${id}`} className={styles.detailLink}>
            <span>Detail</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
