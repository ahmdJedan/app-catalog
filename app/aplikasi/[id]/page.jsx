import { getApplicationById } from "@/lib/applications";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const app = await getApplicationById(id);
  if (!app) return { title: "Aplikasi Tidak Ditemukan - DSTI UNDIP" };
  return {
    title: `${app.app_name} - Katalog Aplikasi DSTI UNDIP`,
    description: app.description || "Detail sistem informasi internal DSTI UNDIP",
  };
}

export default async function ApplicationDetailPage({ params }) {
  const { id } = await params;
  const app = await getApplicationById(id);

  if (!app) {
    notFound();
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="container detail-content">
        <div className="breadcrumb">
          <Link href="/" className="bc-link">
            &larr; Kembali ke Katalog
          </Link>
          <span className="bc-sep">/</span>
          <span className="bc-current">{app.app_name}</span>
        </div>

        <div className="detail-grid">
          {/* Main Info */}
          <div className="main-col">
            <div className="detail-card main-info-card">
              <div className="card-top-meta">
                <span className="app-id-pill">{app.app_id}</span>
                <StatusBadge status={app.status} />
              </div>

              <h1 className="app-title">{app.app_name}</h1>

              <p className="app-description">
                {app.description || "Deskripsi sistem belum diisi secara lengkap."}
              </p>

              <div className="meta-tags-list">
                <div className="meta-tag-item">
                  <span className="meta-tag-label">Departemen / Direktorat</span>
                  <span className="meta-tag-value">
                    {app.department || "DSTI"}
                  </span>
                </div>

                <div className="meta-tag-item">
                  <span className="meta-tag-label">Unit Pengelola</span>
                  <span className="meta-tag-value">
                    {app.owner_unit || app.po_number || "DSTI"}
                  </span>
                </div>

                {app.po_number && (
                  <div className="meta-tag-item">
                    <span className="meta-tag-label">Kode Akronim</span>
                    <span className="meta-tag-value">{app.po_number}</span>
                  </div>
                )}
              </div>

              {app.public_url && (
                <div className="cta-visit-wrapper">
                  <a
                    href={app.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Buka Website Aplikasi
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* Developers Section */}
            <div className="detail-card">
              <h3 className="section-title">
                Tim Pengembang &bull; {app.assigned_employees?.length || 0} Orang
              </h3>

              {app.assigned_employees && app.assigned_employees.length > 0 ? (
                <div className="dev-list">
                  {app.assigned_employees.map((dev, idx) => (
                    <div key={idx} className="dev-item">
                      <div className="dev-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6"></polyline>
                          <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                      </div>
                      <div className="dev-info">
                        <span className="dev-name">{dev.name}</span>
                        <span className="dev-role">{dev.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-hint">Belum ada data pengembang yang dipetakan.</p>
              )}
            </div>

            {/* Modules Section */}
            <div className="detail-card">
              <h3 className="section-title">
                Modul Sistem &bull; {app.modules?.length || 0} Modul
              </h3>

              {app.modules && app.modules.length > 0 ? (
                <div className="module-tags-grid">
                  {app.modules.map((m, idx) => (
                    <div key={idx} className="module-pill">
                      <span className="mod-dot"></span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-hint">Belum ada modul yang terdaftar.</p>
              )}
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="side-col">
            <div className="detail-card side-info-card">
              <h3 className="side-title">Ringkasan Sistem</h3>
              <div className="side-rows">
                <div className="side-row">
                  <span className="side-label">Status</span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="side-row">
                  <span className="side-label">Akses Layanan</span>
                  <span className="side-val">
                    {app.public_url ? "Publik (Tautan Tersedia)" : "Khusus Internal"}
                  </span>
                </div>
                <div className="side-row">
                  <span className="side-label">Departemen</span>
                  <span className="side-val">{app.department || "DSTI"}</span>
                </div>
                <div className="side-row">
                  <span className="side-label">Unit Pemilik</span>
                  <span className="side-val">{app.owner_unit || "DSTI"}</span>
                </div>
                {app.created_at && (
                  <div className="side-row">
                    <span className="side-label">Terdaftar Sejak</span>
                    <span className="side-val">
                      {new Date(app.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagram Section */}
            {app.diagram && (
              <div className="detail-card diagram-card">
                <h3 className="side-title">Diagram Arsitektur</h3>
                <p className="diagram-desc">Tautan diagram arsitektur sistem:</p>
                <a
                  href={app.diagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="diagram-link"
                >
                  Buka Diagram Arsitektur &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
