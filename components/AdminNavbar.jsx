"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNavbar({ trashCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const isTrash = pathname.startsWith("/admin/trash");
  const isAplikasi = !isTrash && pathname.startsWith("/admin");

  return (
    <header className="admin-header">
      <div className="container header-container">
        <div className="header-left">
          <Link href="/admin" className="admin-brand">
            <div className="logo-group">
              <img
                src="/images/undip-logo.png"
                alt="Logo Universitas Diponegoro"
                className="logo-img"
                width="22"
                height="26"
              />
              <span className="logo-divider"></span>
              <img
                src="/images/dsti-logo.png"
                alt="Logo DSTI"
                className="logo-img"
                width="38"
                height="18"
              />
            </div>
            <span className="brand-title">Katalog Aplikasi Internal</span>
            <span className="badge-admin">ADMIN PANEL</span>
          </Link>
        </div>

        <nav className="header-nav">
          <Link
            href="/admin"
            className={`nav-item ${isAplikasi ? "active" : ""}`}
          >
            Aplikasi Aktif
          </Link>

          <Link
            href="/admin/trash"
            className={`nav-item ${isTrash ? "active" : ""}`}
          >
            Tempat Sampah ({trashCount})
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item external-link"
          >
            Lihat Katalog Publik
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="logout-btn"
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}
