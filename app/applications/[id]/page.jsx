import Link from "next/link";
import { getApplicationById } from "@/lib/applications";
import Breadcrumb from "@/app/components/Breadcrumb";
import StatusBadge from "@/app/components/StatusBadge";
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
    po_number,
    product_owner,
    programmer_groups,
    diagram,
  } = application;

  const productOwnerDisplay =
    owner_unit ||
    (typeof product_owner === "string"
      ? product_owner
      : product_owner?.name) ||
    "Product owner not available.";

  return (
    <main className={styles.page}>
      <Breadcrumb id={id} department={department} />

      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <div className={styles.appHeader}>
            <h1 className={styles.appName}>{app_name || "Untitled application"}</h1>
            <p className={styles.description}>
              {description || "Description not available."}
            </p>

            <div className={styles.badges}>
              <StatusBadge status={status} />
            </div>

            <div className={styles.poAndDepartment}>
              {po_number ? (
                <p className={styles.poNumber}>{po_number}</p>
              ) : null}
              {department ? (
                <p className={styles.departmentText}>{department}</p>
              ) : null}
            </div>
          </div>

          <div className={styles.productOwnerSection}>
            <h2 className={styles.sectionHeading}>Product Owner</h2>
            <p className={styles.productOwnerValue}>{productOwnerDisplay}</p>
          </div>

          <div className={styles.programmersSection}>
            {programmer_groups && programmer_groups.length > 0 ? (
              <div className={styles.programmerGroupsList}>
                {programmer_groups.map((group, groupIdx) => (
                  <div key={groupIdx} className={styles.programmerGroup}>
                    {group.programmers && group.programmers.length > 0 ? (
                      group.programmers.map((prog, pIdx) => (
                        <div key={pIdx} className={styles.programmerItem}>
                          <p className={styles.programmerName}>
                            {prog.name || "Programmer"}
                          </p>
                          <p className={styles.programmerRole}>
                            {prog.position || "Programmer"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className={styles.programmerItem}>
                        <p className={styles.programmerName}>Unassigned</p>
                        <p className={styles.programmerRole}>Programmer</p>
                      </div>
                    )}

                    {group.modules && group.modules.length > 0 ? (
                      <div className={styles.modulesBlock}>
                        <span className={styles.modulesHeading}>Modules</span>
                        <ul className={styles.modulesBulletList}>
                          {group.modules.map((mod, mIdx) => (
                            <li key={mIdx} className={styles.moduleBulletItem}>
                              {mod}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.placeholder}>No programmers assigned yet.</p>
            )}
          </div>
        </aside>

        <section className={styles.rightPanel}>
          <DiagramViewer diagram={diagram} />
        </section>
      </div>
    </main>
  );
}
