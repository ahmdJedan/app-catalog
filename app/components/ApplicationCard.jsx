import Link from "next/link";
import StatusBadge from "./StatusBadge";
import styles from "./ApplicationCard.module.css";

export default function ApplicationCard({ application }) {
  const {
    id,
    app_name,
    description,
    status,
    department,
    owner_unit,
  } = application;

  return (
    <article className={styles.card}>

      <h3 className={styles.name}>{app_name || "Untitled application"}</h3>

      <p className={styles.description}>
        {description || "Description not available."}
      </p>

      <div className={styles.tags}>
        {department ? (
          <span className={styles.department}>{department}</span>
        ) : null}
      </div>

      <div className={styles.footer}>
        <span className={styles.owner}>
          {owner_unit || "Owner unit not available"}
        </span>
        <Link href={`/applications/${id}`} className={styles.link}>
          View Details <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
