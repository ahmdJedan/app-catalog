import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container nav-container">
        <Link href="/" className="nav-brand" title="Katalog Aplikasi Internal">
          <div className="logo-group">
            <img
              src="/images/undip-logo.png"
              alt="Logo Universitas Diponegoro"
              className="logo-undip"
              width="24"
              height="28"
            />
            <span className="logo-divider" aria-hidden="true"></span>
            <img
              src="/images/dsti-logo.png"
              alt="Logo DSTI"
              className="logo-dsti"
              width="42"
              height="20"
            />
          </div>
          <div className="brand-text">
            <span className="brand-title">Katalog Aplikasi Internal</span>
            <span className="brand-subtitle">DSTI Universitas Diponegoro</span>
          </div>
        </Link>

        <div className="nav-actions">
          <div className="version-pill">
            <span className="version-dot"></span>
            <span>PWA Portal • v2.0</span>
          </div>
          <Link href="/admin" className="admin-link">
            Admin Panel
          </Link>
        </div>
      </div>
    </header>
  );
}
