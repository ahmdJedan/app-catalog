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
      <table className="app-table">
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
    </div>
  );
}
