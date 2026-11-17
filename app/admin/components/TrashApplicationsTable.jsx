"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import StatusBadge from "@/app/components/StatusBadge";

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
        (app.department || "").toLowerCase().includes(term)
    );
  }, [archivedApplications, search]);

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

      setFeedbackMsg(`Aplikasi "${app.app_name || app.id}" berhasil dipulihkan ke daftar aktif.`);
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

  return (
    <>
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1>Tempat Sampah (Trash)</h1>
          <p>
            Daftar aplikasi yang terkena soft delete. Anda dapat memulihkannya atau menghapus permanen dari database.
          </p>
        </div>
        <Link href="/admin" className={styles.btnSecondary}>
          &larr; Kembali ke Aplikasi Aktif
        </Link>
      </div>

      {feedbackMsg ? (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--color-status-available-bg)",
            color: "var(--color-status-available-text)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {feedbackMsg}
        </div>
      ) : null}

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <input
            type="text"
            placeholder="Cari aplikasi terhapus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.countInfo}>
            {filteredApps.length} aplikasi di tempat sampah
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>App ID</th>
                <th>Nama Aplikasi</th>
                <th>Status</th>
                <th>Departemen</th>
                <th>Waktu Dihapus</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    Tempat sampah kosong. Tidak ada aplikasi yang dihapus sementara.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <span className={styles.appIdCode}>{app.id}</span>
                    </td>
                    <td className={styles.appNameCol}>
                      {app.app_name || "Tanpa Judul"}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td>{app.department || "-"}</td>
                    <td>
                      {app.deleted_at
                        ? new Date(app.deleted_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Baru saja"}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          onClick={() => handleRestore(app)}
                          className={styles.btnSuccess}
                          disabled={isProcessing}
                        >
                          &#x21bb; Pulihkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetToHardDelete(app)}
                          className={styles.btnDanger}
                          disabled={isProcessing}
                        >
                          &#x2715; Hapus Permanen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Modal for Hard Delete */}
      {targetToHardDelete ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={`${styles.modalTitle} ${styles.modalDangerTitle}`}>
              &#9888; Konfirmasi Hapus Permanen (Hard Delete)
            </h3>
            <p className={styles.modalDesc}>
              PERINGATAN: Anda akan menghapus data aplikasi{" "}
              <strong>&ldquo;{targetToHardDelete.app_name || targetToHardDelete.id}&rdquo;</strong>{" "}
              secara permanen dari database NeonDB beserta seluruh modul dan relasi penugasannya.
              <br /><br />
              <strong>Tindakan ini tidak dapat dibatalkan (irreversible)!</strong> Apakah Anda benar-benar yakin?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setTargetToHardDelete(null)}
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                style={{ background: "#b23b3b", color: "#ffffff", borderColor: "#8c2828" }}
                onClick={handleHardDelete}
                disabled={isProcessing}
              >
                {isProcessing ? "Menghapus..." : "Ya, Hapus Selamanya"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
