import Link from "next/link";
import { getApplicationById } from "@/lib/applications";
import Breadcrumb from "@/app/components/Breadcrumb";
import StatusBadge from "@/app/components/StatusBadge";
import ProductOwner from "@/app/components/ProductOwner";
import EmployeeList from "@/app/components/EmployeeList";
import ModuleList from "@/app/components/ModuleList";
import DiagramViewer from "@/app/components/DiagramViewer";
import styles from "./application-detail.module.css";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }) {
  const { id: rawId } = await params;
  let application = null;
  let loadError = null;

  try {
    application = await getApplicationById(rawId);
  } catch (error) {
    console.error(`[ApplicationDetailPage] ${rawId}`, error);
    loadError = "Unable to load applications.";
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <div className={styles.stateBox}>
          <p className={styles.stateTitle}>{loadError}</p>
          <Link href="/" className={styles.stateLink}>
            &larr; Back to catalog
          </Link>
        </div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className={styles.page}>
        <div className={styles.stateBox}>
          <p className={styles.stateTitle}>Application not found.</p>
          <Link href="/" className={styles.stateLink}>
            &larr; Back to catalog
          </Link>
        </div>
      </main>
    );
  }

  const {
    id,
    app_name,
    description,
    status,
    department,
    owner_unit,
    product_owner,
    assigned_employees,
    modules,
    diagram,
  } = application;

  return (
    <main className={styles.page}>
      <Breadcrumb id={id} department={department} />

      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <div className={styles.appHeader}>
            <h1 className={styles.appName}>{app_name || "Untitled application"}</h1>
            {department ? (
              <div className={styles.appMeta}>
                <span>{department}</span>
              </div>
            ) : null}
            <div className={styles.badges}>
              <StatusBadge status={status} />
            </div>
            <p className={styles.description}>
              {description || "Description not available."}
            </p>
            {owner_unit ? (
              <p className={styles.ownerUnit}>{owner_unit}</p>
            ) : null}
          </div>

          <ProductOwner productOwner={product_owner} />
          <EmployeeList employees={assigned_employees} />
          <ModuleList modules={modules} />
        </aside>

        <section className={styles.rightPanel}>
          <DiagramViewer diagram={diagram} />
        </section>
      </div>
    </main>
  );
}
