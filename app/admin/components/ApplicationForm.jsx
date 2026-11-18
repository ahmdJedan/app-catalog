"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../admin.module.css";

export default function ApplicationForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  // Parse initial developers and modules
  const getInitialDevelopers = () => {
    if (
      Array.isArray(initialData?.assigned_employees) &&
      initialData.assigned_employees.length > 0
    ) {
      return initialData.assigned_employees.map((p) => ({
        name: typeof p === "string" ? p : p.name || "",
        role: typeof p === "object" && p.role ? p.role : "Programmer",
        modules:
          typeof p === "object" && Array.isArray(p.modules)
            ? p.modules
            : Array.isArray(initialData?.modules)
            ? initialData.modules
            : [],
      }));
    }

    const defaultMods = Array.isArray(initialData?.modules)
      ? initialData.modules
      : [];

    return [
      {
        name: initialData?.programmer_name || "",
        role: "Programmer",
        modules: defaultMods.length > 0 ? defaultMods : ["Modul KRS & Perwalian Mahasiswa"],
      },
    ];
  };

  const [formData, setFormData] = useState({
    app_id: initialData?.app_id || initialData?.id || "",
    app_name: initialData?.app_name || "",
    status: initialData?.status || "Aktif",
    department: initialData?.department || "",
    owner_unit: initialData?.owner_unit || "",
    po_number: initialData?.po_number || "",
    description: initialData?.description || "",
    po_name:
      initialData?.product_owner?.name ||
      (typeof initialData?.product_owner === "string"
        ? initialData.product_owner
        : ""),
    po_position: initialData?.product_owner?.position || "",
    website_url: initialData?.diagram && initialData.diagram.startsWith("http") ? initialData.diagram : "",
    diagram_url: initialData?.diagram && !initialData.diagram.startsWith("http") ? initialData.diagram : "",
  });

  const [developers, setDevelopers] = useState(getInitialDevelopers);
  const [newModuleInputs, setNewModuleInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Developer Handlers
  const handleAddDeveloper = () => {
    setDevelopers((prev) => [
      ...prev,
      { name: "", role: "Programmer", modules: [] },
    ]);
  };

  const handleRemoveDeveloper = (index) => {
    setDevelopers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeveloperChange = (index, field, value) => {
    setDevelopers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Module Handlers within a developer
  const handleAddModule = (devIndex) => {
    const text = (newModuleInputs[devIndex] || "").trim();
    if (!text) return;

    setDevelopers((prev) => {
      const copy = [...prev];
      const mods = copy[devIndex].modules || [];
      if (!mods.includes(text)) {
        copy[devIndex] = { ...copy[devIndex], modules: [...mods, text] };
      }
      return copy;
    });

    setNewModuleInputs((prev) => ({ ...prev, [devIndex]: "" }));
  };

  const handleRemoveModule = (devIndex, modIndex) => {
    setDevelopers((prev) => {
      const copy = [...prev];
      const mods = [...(copy[devIndex].modules || [])];
      mods.splice(modIndex, 1);
      copy[devIndex] = { ...copy[devIndex], modules: mods };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    // Aggregate all modules
    const allModulesSet = new Set();
    developers.forEach((d) => {
      (d.modules || []).forEach((m) => {
        if (m.trim()) allModulesSet.add(m.trim());
      });
    });

    const programmerNames = developers
      .map((d) => d.name.trim())
      .filter(Boolean)
      .join(", ");

    // Determine final diagram / website URL
    const finalUrl = formData.website_url.trim() || formData.diagram_url.trim() || null;

    const payload = {
      app_id: formData.app_id.trim() || undefined,
      app_name: formData.app_name.trim(),
      status: formData.status.trim() || "Aktif",
      department: formData.department.trim() || null,
      owner_unit: formData.owner_unit.trim() || null,
      po_number: formData.po_number.trim() || null,
      diagram: finalUrl,
      description: formData.description.trim() || null,
      modules: Array.from(allModulesSet),
      product_owner: formData.po_name.trim()
        ? {
            name: formData.po_name.trim(),
            position: formData.po_position.trim() || "Product Owner",
          }
        : null,
      programmer_name: programmerNames || null,
      assigned_employees: developers
        .filter((d) => d.name.trim())
        .map((d) => ({
          name: d.name.trim(),
          role: d.role || "Programmer",
          modules: d.modules || [],
        })),
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
      <div className={styles.formCardTopline} />

      {errorMsg ? (
        <div className={styles.feedbackError} role="alert">
          <span aria-hidden="true">&#9888;</span>
          <span>{errorMsg}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={styles.appForm}>
        {/* Row 1: App ID & App Name */}
        <div className={styles.formRow2}>
          <div className={styles.formGroup}>
            <label htmlFor="app_id" className={styles.formLabel}>
              Kode App ID
            </label>
            <input
              id="app_id"
              name="app_id"
              type="text"
              value={formData.app_id}
              onChange={handleFieldChange}
              placeholder="Contoh: APP-007 (kosongkan untuk generate otomatis)"
              className={styles.formInput}
              disabled={isEdit}
            />
            <span className={styles.fieldHelpText}>
              Bila dikosongkan, sistem akan meng-generate ID otomatis.
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="app_name" className={styles.formLabel}>
              Nama <span className={styles.requiredStar}>*</span>
            </label>
            <input
              id="app_name"
              name="app_name"
              type="text"
              required
              value={formData.app_name}
              onChange={handleFieldChange}
              placeholder="Nama resmi aplikasi atau sistem"
              className={styles.formInput}
            />
          </div>
        </div>

        {/* Row 2: Status & Departemen */}
        <div className={styles.formRow2}>
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.formLabel}>
              Status Aplikasi
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFieldChange}
                className={styles.formSelect}
              >
                <option value="Aktif">Aktif</option>
                <option value="Pilot">Pilot</option>
                <option value="Request Access">Request Access</option>
                <option value="Retiring">Retiring</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="department" className={styles.formLabel}>
              Departemen / Direktorat <span className={styles.requiredStar}>*</span>
            </label>
            <input
              id="department"
              name="department"
              type="text"
              required
              value={formData.department}
              onChange={handleFieldChange}
              placeholder="Contoh: Direktorat Akademik"
              className={styles.formInput}
            />
          </div>
        </div>

        {/* Row 3: Owner Unit & Akronim */}
        <div className={styles.formRow2}>
          <div className={styles.formGroup}>
            <label htmlFor="owner_unit" className={styles.formLabel}>
              Unit Pemilik (Owner Unit)
            </label>
            <input
              id="owner_unit"
              name="owner_unit"
              type="text"
              value={formData.owner_unit}
              onChange={handleFieldChange}
              placeholder="Contoh: DSTI, DKAP, DIRINOV"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="po_number" className={styles.formLabel}>
              Kode Singkat / Akronim
            </label>
            <input
              id="po_number"
              name="po_number"
              type="text"
              value={formData.po_number}
              onChange={handleFieldChange}
              placeholder="Contoh: DA, DSTI, BKAP"
              className={styles.formInput}
            />
          </div>
        </div>

        {/* Row 4: Deskripsi Aplikasi */}
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.formLabel}>
            Deskripsi Aplikasi
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleFieldChange}
            placeholder="Tuliskan gambaran ringkas fungsi sistem aplikasi ini..."
            className={styles.formTextarea}
          />
        </div>

        {/* Row 5: Product Owner */}
        <div className={styles.formRow2}>
          <div className={styles.formGroup}>
            <label htmlFor="po_name" className={styles.formLabel}>
              Nama Product Owner (PO)
            </label>
            <input
              id="po_name"
              name="po_name"
              type="text"
              value={formData.po_name}
              onChange={handleFieldChange}
              placeholder="Nama lengkap PIC / Product Owner"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="po_position" className={styles.formLabel}>
              Jabatan Product Owner
            </label>
            <input
              id="po_position"
              name="po_position"
              type="text"
              value={formData.po_position}
              onChange={handleFieldChange}
              placeholder="Contoh: Direktur Akademik / Kasubdit"
              className={styles.formInput}
            />
          </div>
        </div>

        {/* Row 6: Pengembang & Modul Repeater */}
        <div className={styles.devSectionWrapper}>
          <div className={styles.devSectionHeader}>
            <div>
              <h3 className={styles.devSectionTitle}>Daftar Pengembang &amp; Modul Aplikasi</h3>
              <p className={styles.devSectionDesc}>
                Petakan personil pengembang beserta peran teknis dan modul yang ditangani.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDeveloper}
              className={styles.btnAddDeveloper}
            >
              + Tambah Pengembang
            </button>
          </div>

          <div className={styles.devList}>
            {developers.map((dev, devIdx) => (
              <div key={devIdx} className={styles.devItemBox}>
                <div className={styles.devItemTopRow}>
                  <div className={styles.formGroup} style={{ flex: 1.5 }}>
                    <label className={styles.formLabelSmall}>Nama Pengembang</label>
                    <input
                      type="text"
                      value={dev.name}
                      onChange={(e) =>
                        handleDeveloperChange(devIdx, "name", e.target.value)
                      }
                      placeholder="Nama lengkap pengembang / programmer"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabelSmall}>Peran Teknis</label>
                    <select
                      value={dev.role}
                      onChange={(e) =>
                        handleDeveloperChange(devIdx, "role", e.target.value)
                      }
                      className={styles.formSelect}
                    >
                      <option value="Programmer">Programmer</option>
                      <option value="Lead Developer">Lead Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Database Admin">Database Admin</option>
                      <option value="QA Tester">QA Tester</option>
                    </select>
                  </div>

                  {developers.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeveloper(devIdx)}
                      className={styles.btnDeleteDev}
                      title="Hapus Pengembang"
                    >
                      Hapus Pengembang
                    </button>
                  ) : null}
                </div>

                {/* Modules Tags for this dev */}
                <div className={styles.modulesBlock}>
                  <div className={styles.modulesHeader}>
                    <label className={styles.formLabelSmall}>Modul yang Ditangani</label>
                    <div className={styles.moduleAddInputRow}>
                      <input
                        type="text"
                        placeholder="Ketik nama modul baru..."
                        value={newModuleInputs[devIdx] || ""}
                        onChange={(e) =>
                          setNewModuleInputs((prev) => ({
                            ...prev,
                            [devIdx]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddModule(devIdx);
                          }
                        }}
                        className={styles.formInputSmall}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddModule(devIdx)}
                        className={styles.btnAddModule}
                      >
                        + Tambah Modul
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleTagsList}>
                    {(dev.modules || []).map((mod, modIdx) => (
                      <span key={modIdx} className={styles.moduleTagChip}>
                        <span>{mod}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(devIdx, modIdx)}
                          className={styles.moduleTagRemove}
                          aria-label={`Hapus modul ${mod}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {(!dev.modules || dev.modules.length === 0) && (
                      <span className={styles.emptyModulesText}>
                        Belum ada modul yang ditambahkan untuk pengembang ini.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 7: URLs */}
        <div className={styles.formRow2}>
          <div className={styles.formGroup}>
            <label htmlFor="website_url" className={styles.formLabel}>
              URL Website Publik (Opsional)
            </label>
            <input
              id="website_url"
              name="website_url"
              type="text"
              value={formData.website_url}
              onChange={handleFieldChange}
              placeholder="https://... (kosongkan jika internal only)"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="diagram_url" className={styles.formLabel}>
              URL Diagram Arsitektur (Opsional)
            </label>
            <input
              id="diagram_url"
              name="diagram_url"
              type="text"
              value={formData.diagram_url}
              onChange={handleFieldChange}
              placeholder="https://... atau /diagrams/..."
              className={styles.formInput}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={styles.formActionsBar}>
          <Link href="/admin" className={styles.btnSecondary}>
            Batal
          </Link>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading}
          >
            {isLoading
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan Aplikasi Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}
