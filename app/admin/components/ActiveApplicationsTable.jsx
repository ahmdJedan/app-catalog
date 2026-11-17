"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import StatusBadge from "@/app/components/StatusBadge";

export default function ActiveApplicationsTable({ applications = [] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applications;
    return applications.filter(
      (app) =>
        (app.app_name || "").toLowerCase().includes(term) ||
        (app.id || "").toLowerCase().includes(term) ||
        (app.department || "").toLowerCase().includes(term)
    );
  }, [applications, search]);

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

      setFeedbackMsg(`Aplikasi "${targetToDelete.app_name || targetToDelete.id}" berhasil dipindahkan ke tempat sampah.`);
      setTargetToDelete(null);
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      console.error("[SoftDelete]", err);
      alert("Terjadi kesalahan jaringan.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.pageTop}>
        <div className={styles.titleArea}>
          <h1>Manajemen Aplikasi Aktif</h1>
          <p>Kelola seluruh data sistem dan inventaris katalog internal.</p>
        </div>
        <Link href="/admin/applications/new" className={styles.btnPrimary}>
          + Tambah Aplikasi Baru
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
            placeholder="Cari berdasarkan nama, ID, atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.countInfo}>
            Menampilkan {filteredApps.length} dari {applications.length} aplikasi
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
                <th>Unit Pemilik</th>
                <th>Modul</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyState}>
                    Tidak ada aplikasi yang ditemukan.
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
                    <td>{app.owner_unit || "-"}</td>
                    <td>
                      {Array.isArray(app.modules) && app.modules.length > 0
                        ? `${app.modules.length} modul`
                        : "-"}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link
                          href={`/admin/applications/${app.id}/edit`}
                          className={styles.actionEditLink}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setTargetToDelete(app)}
                          className={styles.btnDanger}
                        >
                          Soft Delete
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

      {/* Confirmation Modal for Soft Delete */}
      {targetToDelete ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Konfirmasi Soft Delete</h3>
            <p className={styles.modalDesc}>
              Apakah Anda yakin ingin memindahkan aplikasi{" "}
              <strong>&ldquo;{targetToDelete.app_name || targetToDelete.id}&rdquo;</strong> ke tempat sampah? 
              Aplikasi ini tidak akan tampil lagi di katalog publik, namun datanya masih dapat dipulihkan kapan saja di tab <em>Tempat Sampah</em>.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setTargetToDelete(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleSoftDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Memproses..." : "Ya, Pindahkan ke Sampah"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
