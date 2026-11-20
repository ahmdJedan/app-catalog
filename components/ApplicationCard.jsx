import Link from "next/link";

export default function ApplicationCard({ application, index }) {
  const {
    id,
    app_name,
    description,
    status = "Aktif",
    department,
    owner_unit,
    po_number,
    public_url,
  } = application;

  const appNumber = String(index + 1).padStart(2, "0");
  const codeLabel = `APLIKASI • ${appNumber}`;

  return (
    <article className="app-card">
      <div className="card-header">
        <span className="app-code">{codeLabel}</span>
        <span className="badge-active">{status || "Aktif"}</span>
      </div>

      <h3 className="app-name">{app_name || "Aplikasi"}</h3>

      <p className="app-desc">{description || "Deskripsi sistem belum tersedia."}</p>

      {department && (
        <div className="app-dept-wrapper">
          <span className="dept-tag">{department}</span>
        </div>
      )}

      <div className="card-footer">
        <span className="owner-badge">{po_number || owner_unit || "DSTI"}</span>

        <div className="footer-links">
          {public_url ? (
            <a
              href={public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-visit"
            >
              Kunjungi Situs
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ) : (
            <span className="badge-internal">Internal</span>
          )}

          <Link href={`/aplikasi/${id}`} className="link-detail">
            Detail
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
