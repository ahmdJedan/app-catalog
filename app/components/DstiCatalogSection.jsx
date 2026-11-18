"use client";

import { useState, useMemo } from "react";
import ApplicationCard from "./ApplicationCard";
import styles from "./DstiCatalogSection.module.css";

export default function DstiCatalogSection({
  applications = [],
  departmentOptions = [],
  statusOptions = [],
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  // Filter logic
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesSearch =
        !term ||
        (app.app_name || "").toLowerCase().includes(term) ||
        (app.id || "").toLowerCase().includes(term) ||
        (app.department || "").toLowerCase().includes(term) ||
        (app.description || "").toLowerCase().includes(term) ||
        (Array.isArray(app.modules) &&
          app.modules.some((m) => m.toLowerCase().includes(term)));

      const matchesStatus = status === "all" || app.status === status;
      const matchesDepartment =
        department === "all" || app.department === department;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [applications, search, status, department]);

  const displayedApps = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMore = visibleCount < filtered.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <section id="katalog" className={styles.catalogSection} aria-label="Direktori Layanan Digital">
      {/* Floating Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg
            className={styles.searchIcon}
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cari nama aplikasi, modul, atau unit kerja..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(6); // reset pagination on search
            }}
          />
        </div>

        <div className={styles.selectBox}>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setVisibleCount(6);
            }}
            aria-label="Filter berdasarkan status"
          >
            <option value="all">Semua Status</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <span className={styles.selectArrow} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        <div className={styles.selectBox}>
          <select
            className={styles.select}
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setVisibleCount(6);
            }}
            aria-label="Filter berdasarkan direktorat"
          >
            <option value="all">Semua Direktorat</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <span className={styles.selectArrow} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Catalog Header */}
      <div className={styles.catalogHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>DIREKTORI LAYANAN</span>
          <h2 className={styles.sectionTitle}>Aplikasi internal</h2>
          <p className={styles.resultSubtitle}>
            Menampilkan <strong>{displayedApps.length}</strong> aplikasi internal
          </p>
        </div>

        <div className={styles.catalogCount}>
          <strong>{displayedApps.length}</strong> dari {applications.length} aplikasi
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {displayedApps.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Tidak ada aplikasi yang cocok</p>
            <p className={styles.emptyHint}>
              Coba sesuaikan kata kunci pencarian atau ubah filter status/direktorat.
            </p>
          </div>
        ) : (
          displayedApps.map((app, idx) => (
            <ApplicationCard key={app.id || idx} application={app} index={idx} />
          ))
        )}
      </div>

      {/* Bottom Footnote & Show More */}
      <div className={styles.bottomToolbar}>
        <div className={styles.footnote}>
          <span className={styles.infoIcon} aria-hidden="true">
            i
          </span>
          <span>
            Katalog terpusat untuk mendukung tata kelola layanan digital Universitas Diponegoro.
          </span>
        </div>

        {hasMore ? (
          <button
            type="button"
            onClick={handleShowMore}
            className={styles.showMoreBtn}
          >
            <span aria-hidden="true">&#9654;</span> Lihat Lebih banyak
          </button>
        ) : filtered.length > 6 ? (
          <button
            type="button"
            onClick={() => setVisibleCount(6)}
            className={styles.showMoreBtn}
          >
            Tampilkan Lebih Sedikit &uarr;
          </button>
        ) : null}
      </div>
    </section>
  );
}
