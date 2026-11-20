import Link from "next/link";
import StatusBadge from "./StatusBadge";

export default function ApplicationTable({
  applications = [],
  onSoftDelete,
  onRestore,
  isTrashView = false,
}) {
  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">
          {isTrashView
            ? "Tempat sampah kosong."
            : "Tidak ada aplikasi yang sesuai dengan pencarian atau filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive-wrapper">
      {/* Desktop Table View */}
      <table className="app-table desktop-only">
        <thead>
          <tr>
            <th>NAMA APLIKASI</th>
            <th>STATUS</th>
            <th>DIREKTORAT / PO</th>
            <th>URL PUBLIK</th>
            <th>TIM & MODUL</th>
            <th className="td-action">AKSI</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const devCount = app.developer_count || 1;
            const modCount = app.module_count || 1;

            return (
              <tr key={app.id}>
                <td className="td-name">
                  <div className="app-main-info">
                    <span className="app-title">{app.app_name}</span>
                    <span className="app-sub-desc">{app.description}</span>
                  </div>
                </td>

                <td>
                  <StatusBadge status={app.status} />
                </td>

                <td className="td-dept">
                  <span className="dept-name">
                    {app.department || "DSTI"}
                  </span>
                  {app.po_number && (
                    <span className="po-code">({app.po_number})</span>
                  )}
                </td>

                <td>
                  {app.public_url ? (
                    <a
                      href={app.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-url-link"
                    >
                      {app.public_url}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </a>
                  ) : (
                    <span className="badge-internal-only">Internal Only</span>
                  )}
                </td>

                <td className="td-meta">
                  <span>
                    {devCount} Pengembang &bull; {modCount} Modul
                  </span>
                </td>

                <td className="td-action">
                  <div className="action-buttons">
                    {!isTrashView ? (
                      <>
                        <Link
                          href={`/admin/aplikasi/${app.id}/edit`}
                          className="btn-soft-blue"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onSoftDelete && onSoftDelete(app)}
                          className="btn-soft-danger"
                        >
                          Soft Delete
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRestore && onRestore(app)}
                        className="btn-soft-blue"
                      >
                        Pulihkan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile Card List View */}
      <div className="mobile-only card-list-mobile">
        {applications.map((app) => {
          const devCount = app.developer_count || 1;
          const modCount = app.module_count || 1;

          return (
            <div key={app.id} className="mobile-app-card">
              <div className="card-top">
                <span className="m-app-name">{app.app_name}</span>
                <StatusBadge status={app.status} />
              </div>

              <p className="m-app-desc">{app.description}</p>

              <div className="m-row">
                <span className="m-label">Direktorat:</span>
                <span className="m-val">
                  {app.department || "DSTI"}{" "}
                  {app.po_number && <strong>({app.po_number})</strong>}
                </span>
              </div>

              <div className="m-row">
                <span className="m-label">URL Publik:</span>
                {app.public_url ? (
                  <a
                    href={app.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-url-link"
                  >
                    {app.public_url} ↗
                  </a>
                ) : (
                  <span className="badge-internal-only">Internal Only</span>
                )}
              </div>

              <div className="m-row">
                <span className="m-label">Tim & Modul:</span>
                <span className="m-val">
                  {devCount} Pengembang &bull; {modCount} Modul
                </span>
              </div>

              <div className="m-actions">
                {!isTrashView ? (
                  <>
                    <Link
                      href={`/admin/aplikasi/${app.id}/edit`}
                      className="btn-soft-blue"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onSoftDelete && onSoftDelete(app)}
                      className="btn-soft-danger"
                      style={{ flex: 1 }}
                    >
                      Soft Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestore && onRestore(app)}
                    className="btn-soft-blue"
                    style={{ flex: 1 }}
                  >
                    Pulihkan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
