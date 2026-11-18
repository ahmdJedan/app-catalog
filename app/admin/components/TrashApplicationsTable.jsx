"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export default function TrashApplicationsTable({ archivedApplications = [] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [targetToHardDelete, setTargetToHardDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return archivedApplications;
    return archivedApplications.filter(
      (app) =>
        (app.app_name || "").toLowerCase().includes(term) ||
        (app.id || "").toLowerCase().includes(term) ||
        (app.app_id || "").toLowerCase().includes(term) ||
        (app.department || "").toLowerCase().includes(term)
    );
  }, [archivedApplications, search]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleRestore = async (app) => {
    setIsProcessing(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${app.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal memulihkan aplikasi.");
        setIsProcessing(false);
        return;
      }

      setFeedbackMsg(
        `Aplikasi "${app.app_name || app.id}" berhasil dipulihkan ke daftar aplikasi aktif.`
      );
      setIsProcessing(false);
      router.refresh();
    } catch (err) {
      console.error("[Restore]", err);
      alert("Terjadi kesalahan jaringan.");
      setIsProcessing(false);
    }
  };

  const handleHardDelete = async () => {
    if (!targetToHardDelete) return;
    setIsProcessing(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(
        `/api/admin/applications/${targetToHardDelete.id}/hard-delete`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal menghapus permanen.");
        setIsProcessing(false);
        return;
      }

      setFeedbackMsg(
        `Aplikasi "${targetToHardDelete.app_name || targetToHardDelete.id}" telah dihapus secara permanen dari database.`
      );
      setTargetToHardDelete(null);
      setIsProcessing(false);
      router.refresh();
    } catch (err) {
      console.error("[HardDelete]", err);
      alert("Terjadi kesalahan jaringan.");
      setIsProcessing(false);
    }
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
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Tempat Sampah (Trash)</h1>
          <p className={styles.pageSubtitle}>
            Daftar aplikasi yang terkena soft delete. Anda dapat memulihkannya atau menghapus permanen dari database.
          </p>
        </div>
        <Link href="/admin" className={styles.btnSecondary}>
          <span aria-hidden="true">&larr;</span> Kembali ke Aplikasi Aktif
        </Link>
      </div>

      {feedbackMsg ? (
        <div className={styles.feedbackAlert} role="status">
          <span>&#10003;</span>
          <span>{feedbackMsg}</span>
        </div>
      ) : null}

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Cari aplikasi terhapus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <span className={styles.countInfo}>
            {filteredApps.length} aplikasi di tempat sampah
          </span>
        </div>

        {/* Desktop Table View */}
        <div className={styles.desktopTableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>APP ID</th>
                <th>NAMA APLIKASI</th>
                <th>STATUS</th>
                <th>DEPARTEMEN</th>
                <th>WAKTU DIHAPUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    Tempat sampah kosong. Tidak ada aplikasi yang diarsipkan.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <span className={styles.appIdCode}>
                        {app.app_id || app.id}
                      </span>
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.appName}>{app.app_name}</div>
                      {app.description ? (
                        <div className={styles.appDesc}>{app.description}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(app.status)}`}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {app.status || "Arsip"}
                      </span>
                    </td>
                    <td>{app.department || "-"}</td>
                    <td className={styles.dateCell}>{formatDate(app.deleted_at)}</td>
                    <td>
                      <div className={styles.actionsGroup}>
                        <button
                          type="button"
                          onClick={() => handleRestore(app)}
                          className={styles.btnRestore}
                          disabled={isProcessing}
                        >
                          <span aria-hidden="true">&#8635;</span> Pulihkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetToHardDelete(app)}
                          className={styles.btnHardDelete}
                          disabled={isProcessing}
                        >
                          <span aria-hidden="true">&times;</span> Hapus Permanen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className={styles.mobileCardList}>
          {filteredApps.length === 0 ? (
            <div className={styles.emptyState}>
              Tempat sampah kosong. Tidak ada aplikasi yang diarsipkan.
            </div>
          ) : (
            filteredApps.map((app) => (
              <article key={app.id} className={styles.mobileCardItem}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.appIdCode}>{app.app_id || app.id}</span>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(app.status)}`}>
                    <span className={styles.badgeDot} aria-hidden="true" />
                    {app.status || "Arsip"}
                  </span>
                </div>

                <h3 className={styles.mobileCardTitle}>{app.app_name}</h3>
                <p className={styles.mobileCardDesc}>
                  {app.description || "Tidak ada deskripsi"}
                </p>

                <div className={styles.mobileDeptRow}>
                  <span>{app.department || "DSTI UNDIP"}</span>
                  {app.owner_unit ? (
                    <span className={styles.acronymTag}>({app.owner_unit})</span>
                  ) : null}
                </div>

                <div className={styles.mobileMetaRow}>
                  <span className={styles.mobileMetaLabel}>Waktu Dihapus</span>
                  <span className={styles.mobileMetaText}>
                    {formatDate(app.deleted_at)}
                  </span>
                </div>

                <div className={styles.mobileCardActions}>
                  <button
                    type="button"
                    onClick={() => handleRestore(app)}
                    className={styles.btnRestore}
                    disabled={isProcessing}
                  >
                    <span aria-hidden="true">&#8635;</span> Pulihkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetToHardDelete(app)}
                    className={styles.btnHardDelete}
                    disabled={isProcessing}
                  >
                    <span aria-hidden="true">&times;</span> Hapus Permanen
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal for Hard Delete */}
      {targetToHardDelete ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitleDanger}>Hapus Permanen?</h3>
            <p className={styles.modalDesc}>
              Aplikasi <strong>&ldquo;{targetToHardDelete.app_name || targetToHardDelete.id}&rdquo;</strong> akan dihapus selamanya dari database PostgreSQL.
              <br /><br />
              <strong style={{ color: "var(--color-status-retiring-text)" }}>
                Peringatan: Tindakan ini bersifat destruktif dan tidak dapat dibatalkan kembali!
              </strong>
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setTargetToHardDelete(null)}
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnModalHardDanger}
                onClick={handleHardDelete}
                disabled={isProcessing}
              >
                {isProcessing ? "Menghapus..." : "Hapus Selamanya"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
