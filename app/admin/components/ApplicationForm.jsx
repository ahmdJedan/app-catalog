"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../admin.module.css";

export default function ApplicationForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  // Normalize initial modules to string
  const defaultModules = Array.isArray(initialData?.modules)
    ? initialData.modules.join("\n")
    : initialData?.modules || "";

  // Normalize initial programmers to string
  const defaultProgrammers = Array.isArray(initialData?.assigned_employees)
    ? initialData.assigned_employees.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean).join("\n")
    : initialData?.programmer_name || "";

  const [formData, setFormData] = useState({
    app_id: initialData?.app_id || initialData?.id || "",
    app_name: initialData?.app_name || "",
    status: initialData?.status || "Aktif",
    department: initialData?.department || "",
    owner_unit: initialData?.owner_unit || "",
    po_number: initialData?.po_number || "",
    diagram: initialData?.diagram || "",
    description: initialData?.description || "",
    modules: defaultModules,
    product_owner_name: initialData?.product_owner?.name || (typeof initialData?.product_owner === "string" ? initialData.product_owner : ""),
    product_owner_pos: initialData?.product_owner?.position || "",
    programmers: defaultProgrammers,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const payload = {
      app_id: formData.app_id.trim() || undefined,
      app_name: formData.app_name.trim(),
      status: formData.status.trim() || null,
      department: formData.department.trim() || null,
      owner_unit: formData.owner_unit.trim() || null,
      po_number: formData.po_number.trim() || null,
      diagram: formData.diagram.trim() || null,
      description: formData.description.trim() || null,
      modules: formData.modules
        ? formData.modules.split(/\r?\n|,/).map((m) => m.trim()).filter(Boolean)
        : [],
      product_owner: formData.product_owner_name.trim()
        ? {
            name: formData.product_owner_name.trim(),
            position: formData.product_owner_pos.trim() || "Product Owner",
          }
        : null,
      programmer_name: formData.programmers.trim() || null,
    };

    try {
      const url = isEdit
        ? `/api/admin/applications/${initialData.id}`
        : "/api/admin/applications";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setErrorMsg(resData.error || "Gagal menyimpan data aplikasi.");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("[ApplicationForm]", err);
      setErrorMsg("Terjadi gangguan koneksi saat mengirim formulir.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formCard}>
      {errorMsg ? (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--color-status-retiring-bg)",
            color: "var(--color-status-retiring-text)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* App ID */}
          <div className={styles.formGroup}>
            <label htmlFor="app_id" className={styles.label}>
              Kode App ID
            </label>
            <input
              id="app_id"
              name="app_id"
              type="text"
              value={formData.app_id}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: APP-1042 (kosongkan untuk generate otomatis)"
              disabled={isEdit} // jangan ubah ID saat edit untuk konsistensi
            />
            <span className={styles.hint}>
              {isEdit ? "App ID tidak dapat diubah setelah dibuat." : "Bila dikosongkan, sistem akan meng-generate ID otomatis."}
            </span>
          </div>

          {/* App Name */}
          <div className={styles.formGroup}>
            <label htmlFor="app_name" className={styles.label}>
              Nama Aplikasi <span style={{ color: "#b23b3b" }}>*</span>
            </label>
            <input
              id="app_name"
              name="app_name"
              type="text"
              required
              value={formData.app_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nama resmi aplikasi atau sistem"
            />
          </div>

          {/* Status */}
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Status Aplikasi
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="Aktif">Aktif / Available</option>
              <option value="Request Access">Request Access</option>
              <option value="Pilot">Pilot</option>
              <option value="Retiring">Retiring</option>
              <option value="Pengembangan">Pengembangan</option>
            </select>
          </div>

          {/* Department */}
          <div className={styles.formGroup}>
            <label htmlFor="department" className={styles.label}>
              Departemen / Direktorat
            </label>
            <input
              id="department"
              name="department"
              type="text"
              value={formData.department}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: Direktorat Sistem dan Teknologi Informasi"
            />
          </div>

          {/* Owner Unit */}
          <div className={styles.formGroup}>
            <label htmlFor="owner_unit" className={styles.label}>
              Unit Pemilik (Owner Unit)
            </label>
            <input
              id="owner_unit"
              name="owner_unit"
              type="text"
              value={formData.owner_unit}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: DSTI, DKAP, LPPM"
            />
          </div>

          {/* PO Number / Kode */}
          <div className={styles.formGroup}>
            <label htmlFor="po_number" className={styles.label}>
              Kode Singkat / PO
            </label>
            <input
              id="po_number"
              name="po_number"
              type="text"
              value={formData.po_number}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: DSTI, BRAP"
            />
          </div>

          {/* Description */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label htmlFor="description" className={styles.label}>
              Deskripsi Aplikasi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Jelaskan fungsi utama dan ruang lingkup layanan aplikasi..."
            />
          </div>

          {/* Product Owner */}
          <div className={styles.formGroup}>
            <label htmlFor="product_owner_name" className={styles.label}>
              Nama Product Owner (PO)
            </label>
            <input
              id="product_owner_name"
              name="product_owner_name"
              type="text"
              value={formData.product_owner_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nama lengkap PIC / Product Owner"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="product_owner_pos" className={styles.label}>
              Jabatan Product Owner
            </label>
            <input
              id="product_owner_pos"
              name="product_owner_pos"
              type="text"
              value={formData.product_owner_pos}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: Kasubdit Sistem Informasi"
            />
          </div>

          {/* Modules */}
          <div className={styles.formGroup}>
            <label htmlFor="modules" className={styles.label}>
              Daftar Modul Aplikasi
            </label>
            <textarea
              id="modules"
              name="modules"
              value={formData.modules}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Tuliskan modul (satu modul per baris atau pisahkan dengan koma)"
            />
            <span className={styles.hint}>Pisahkan setiap modul dengan baris baru.</span>
          </div>

          {/* Programmers */}
          <div className={styles.formGroup}>
            <label htmlFor="programmers" className={styles.label}>
              Daftar Programmer / Penanggung Jawab
            </label>
            <textarea
              id="programmers"
              name="programmers"
              value={formData.programmers}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Nama programmer (pisahkan dengan koma atau baris baru)"
            />
            <span className={styles.hint}>Pisahkan setiap nama programmer dengan baris baru atau koma.</span>
          </div>

          {/* Diagram URL */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label htmlFor="diagram" className={styles.label}>
              URL Diagram Arsitektur (Opsional)
            </label>
            <input
              id="diagram"
              name="diagram"
              type="text"
              value={formData.diagram}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://... atau /diagrams/..."
            />
          </div>
        </div>

        <div className={styles.formFooter}>
          <Link href="/admin" className={styles.btnSecondary}>
            Batal
          </Link>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : isEdit ? "Perbarui Aplikasi" : "Simpan Aplikasi Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}
