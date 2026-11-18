"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function ActiveApplicationsTable({
  applications = [],
  departments = [],
  statuses = [],
  archivedCount = 0,
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Compute metrics
  const totalApps = applications.length;
  const activeAppsCount = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || "").toLowerCase();
      return s.includes("aktif") || s.includes("available");
    }).length;
  }, [applications]);

  const publicUrlCount = useMemo(() => {
    return applications.filter((app) => {
      const url = app.diagram || "";
      return url.startsWith("http://") || url.startsWith("https://");
    }).length;
  }, [applications]);

  // Filter applications
  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesSearch =
        !term ||
        (app.app_name || "").toLowerCase().includes(term) ||
        (app.id || "").toLowerCase().includes(term) ||
        (app.department || "").toLowerCase().includes(term) ||
        (app.programmer_name || "").toLowerCase().includes(term) ||
        (app.owner_unit || "").toLowerCase().includes(term) ||
        (Array.isArray(app.modules) &&
          app.modules.some((m) => m.toLowerCase().includes(term)));

      const matchesStatus =
        selectedStatus === "all" || app.status === selectedStatus;
      const matchesDept =
        selectedDept === "all" || app.department === selectedDept;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [applications, search, selectedStatus, selectedDept]);

  const handleSoftDelete = async () => {
    if (!targetToDelete) return;
    setIsDeleting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${targetToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal melakukan soft delete.");
        setIsDeleting(false);
        return;
      }

      setFeedbackMsg(
        `Aplikasi "${targetToDelete.app_name || targetToDelete.id}" berhasil dipindahkan ke tempat sampah.`
      );
      setTargetToDelete(null);
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      console.error("[SoftDelete]", err);
      alert("Terjadi kesalahan jaringan.");
      setIsDeleting(false);
    }
  };

  // Helper to format modules and developers count
  const getTeamAndModuleText = (app) => {
    let devCount = 1;
    if (Array.isArray(app.assigned_employees) && app.assigned_employees.length > 0) {
      devCount = app.assigned_employees.length;
    } else if (app.programmer_name) {
      devCount = app.programmer_name.split(/,|\n/).filter(Boolean).length || 1;
    }

    const modCount = Array.isArray(app.modules) ? app.modules.length : 0;
    return `${devCount} Pengembang • ${modCount} Modul`;
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("aktif") || s.includes("available")) return styles.badgeActive;
    if (s.includes("pilot")) return styles.badgePilot;
    if (s.includes("request")) return styles.badgeRequest;
    if (s.includes("retiring")) return styles.badgeRetiring;
    return styles.badgeDefault;
  };

  return (
    <>
      {/* Top Header */}
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Manajemen Aplikasi Aktif</h1>
          <p className={styles.pageSubtitle}>
            Kelola seluruh data sistem, tautan akses publik, dan inventaris katalog internal DSTI UNDIP.
          </p>
        </div>
        <Link href="/admin/applications/new" className={styles.btnPrimary}>
          <span aria-hidden="true">+</span> Tambah Aplikasi Baru
        </Link>
      </div>

      {feedbackMsg ? (
        <div className={styles.feedbackAlert} role="status">
          <span>&#10003;</span>
          <span>{feedbackMsg}</span>
        </div>
      ) : null}

      {/* 4 Metrics Summary Cards */}
      <section className={styles.metricsGrid} aria-label="Ringkasan Statistik">
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Aplikasi Terdata</div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{totalApps}</span>
            <span className={styles.metricPillGray}>{departments.length} Direktorat</span>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
          <div className={styles.metricLabel}>Layanan Aktif</div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{activeAppsCount}</span>
            <span className={styles.metricPillBlue}>
              <span className={styles.dotBlue} aria-hidden="true" />
              Aktif
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Akses Publik Tersedia</div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{publicUrlCount}</span>
            <span className={styles.metricPillBlueText}>URL Publik &nearr;</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Di Tempat Sampah</div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{archivedCount}</span>
            <span className={styles.metricPillRed}>Soft Deleted</span>
          </div>
        </div>
      </section>

      {/* Table Container Card */}
      <div className={styles.tableCard}>
        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Cari nama aplikasi, direktorat, atau programmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter status"
            >
              <option value="all">Semua Status</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter direktorat"
            >
              <option value="all">Semua Direktorat</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop View Table */}
        <div className={styles.desktopTableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NAMA APLIKASI</th>
                <th>STATUS</th>
                <th>DIREKTORAT / PO</th>
                <th>URL PUBLIK</th>
                <th>TIM &amp; MODUL</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    Tidak ada aplikasi aktif yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isUrl =
                    app.diagram &&
                    (app.diagram.startsWith("http://") ||
                      app.diagram.startsWith("https://"));
                  const acronym = app.owner_unit || app.po_number || "DSTI";

                  return (
                    <tr key={app.id}>
                      <td className={styles.nameCell}>
                        <div className={styles.appName}>{app.app_name}</div>
                        <div className={styles.appDesc}>
                          {app.description || "Tidak ada deskripsi"}
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(app.status)}`}>
                          <span className={styles.badgeDot} aria-hidden="true" />
                          {app.status || "Aktif"}
                        </span>
                      </td>

                      <td>
                        <div className={styles.deptWrap}>
                          <span>{app.department || "DSTI UNDIP"}</span>
                          {acronym ? (
                            <span className={styles.acronymTag}>({acronym})</span>
                          ) : null}
                        </div>
                      </td>

                      <td>
                        {isUrl ? (
                          <a
                            href={app.diagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.urlLink}
                          >
                            <span>{app.diagram}</span>
                            <span aria-hidden="true">&nearr;</span>
                          </a>
                        ) : (
                          <span className={styles.internalOnlyBadge}>Internal Only</span>
                        )}
                      </td>

                      <td className={styles.teamModulCell}>
                        {getTeamAndModuleText(app)}
                      </td>

                      <td>
                        <div className={styles.actionsGroup}>
                          <Link
                            href={`/admin/applications/${app.id}/edit`}
                            className={styles.btnActionEdit}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setTargetToDelete(app)}
                            className={styles.btnActionDelete}
                          >
                            Soft Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className={styles.mobileCardList}>
          {filteredApps.length === 0 ? (
            <div className={styles.emptyState}>
              Tidak ada aplikasi aktif yang cocok dengan filter pencarian.
            </div>
          ) : (
            filteredApps.map((app) => {
              const isUrl =
                app.diagram &&
                (app.diagram.startsWith("http://") ||
                  app.diagram.startsWith("https://"));
              const acronym = app.owner_unit || app.po_number || "DSTI";

              return (
                <article key={app.id} className={styles.mobileCardItem}>
                  <div className={styles.mobileCardHeader}>
                    <h3 className={styles.mobileCardTitle}>{app.app_name}</h3>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(app.status)}`}>
                      <span className={styles.badgeDot} aria-hidden="true" />
                      {app.status || "Aktif"}
                    </span>
                  </div>

                  <p className={styles.mobileCardDesc}>
                    {app.description || "Tidak ada deskripsi"}
                  </p>

                  <div className={styles.mobileDeptRow}>
                    <span>{app.department || "DSTI UNDIP"}</span>
                    {acronym ? (
                      <span className={styles.acronymTag}>({acronym})</span>
                    ) : null}
                  </div>

                  <div className={styles.mobileMetaRow}>
                    <span className={styles.mobileMetaText}>
                      {getTeamAndModuleText(app)}
                    </span>
                    {isUrl ? (
                      <a
                        href={app.diagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.urlLink}
                      >
                        <span>{app.diagram}</span>
                        <span aria-hidden="true">&nearr;</span>
                      </a>
                    ) : (
                      <span className={styles.internalOnlyBadge}>Internal Only</span>
                    )}
                  </div>

                  <div className={styles.mobileCardActions}>
                    <Link
                      href={`/admin/applications/${app.id}/edit`}
                      className={styles.btnActionEdit}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setTargetToDelete(app)}
                      className={styles.btnActionDelete}
                    >
                      Soft Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {targetToDelete ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Pindahkan ke Tempat Sampah?</h3>
            <p className={styles.modalDesc}>
              Aplikasi <strong>&ldquo;{targetToDelete.app_name || targetToDelete.id}&rdquo;</strong> akan diarsipkan (soft delete).
              Aplikasi tidak akan tampil lagi di katalog publik, tetapi dapat dipulihkan kapan saja melalui tab <em>Tempat Sampah</em>.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setTargetToDelete(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnModalDanger}
                onClick={handleSoftDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Memproses..." : "Ya, Soft Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
