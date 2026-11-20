export default function HeroSection({ stats = {} }) {
  const total = stats.totalApplications || 0;
  const depts = stats.totalDepartments || 0;
  const active = stats.activeApplications || 0;

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-card">
          <div className="hero-content">
            <span className="hero-tag">— DIREKTORI LAYANAN DIGITAL</span>
            <h1 className="hero-title">Katalog Aplikasi Internal DSTI UNDIP</h1>
            <p className="hero-desc">
              Portal inventarisasi terpusat sistem informasi, pembagian modul pengembang,
              dan tautan akses layanan di lingkungan Gedung ICT Center Universitas Diponegoro.
            </p>

            <div className="hero-stats">
              <div className="stat-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span><strong>{total}</strong> Aplikasi Terdata</span>
              </div>

              <div className="stat-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"></path>
                  <path d="M9 8h1"></path>
                  <path d="M9 12h1"></path>
                  <path d="M9 16h1"></path>
                  <path d="M14 8h1"></path>
                  <path d="M14 12h1"></path>
                  <path d="M14 16h1"></path>
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                </svg>
                <span><strong>{depts}</strong> Direktorat & Unit</span>
              </div>

              <div className="stat-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span><strong>{active}</strong> Layanan Aktif</span>
              </div>
            </div>

            <a href="#katalog" className="hero-cta">
              Jelajahi katalog <span aria-hidden="true">&darr;</span>
            </a>
          </div>

          <div className="hero-media">
            <div className="image-wrapper">
              <img
                src="/images/gedung-ict.png"
                alt="Gedung ICT Center Universitas Diponegoro"
                className="building-img"
              />
              <div className="image-overlay-tag">
                GEDUNG ICT CENTER &mdash; UNDIP
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
