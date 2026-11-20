"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplicationForm({
  initialData = {},
  isEdit = false,
  departmentOptions = [],
}) {
  const router = useRouter();

  const [appId, setAppId] = useState(initialData.app_id || "");
  const [appName, setAppName] = useState(initialData.app_name || "");
  const [status, setStatus] = useState(initialData.status || "Aktif");
  const [department, setDepartment] = useState(initialData.department || "");
  const [ownerUnit, setOwnerUnit] = useState(initialData.owner_unit || "");
  const [poNumber, setPoNumber] = useState(initialData.po_number || "");
  const [description, setDescription] = useState(initialData.description || "");

  const [poName, setPoName] = useState(initialData.product_owner?.name || "");
  const [poPosition, setPoPosition] = useState(initialData.product_owner?.position || "");

  const parsedInitialModules = Array.isArray(initialData.modules)
    ? initialData.modules.map((m) => (typeof m === "string" ? m : m?.name || ""))
    : [];

  const [developers, setDevelopers] = useState(
    initialData.assigned_employees && initialData.assigned_employees.length > 0
      ? initialData.assigned_employees.map((e) => ({
          name: e.name || "",
          role: e.role || "Programmer",
          modules: Array.isArray(e.modules)
            ? e.modules.map((m) => (typeof m === "string" ? m : m?.name || ""))
            : parsedInitialModules,
        }))
      : [
          {
            name: "",
            role: "Programmer",
            modules: parsedInitialModules.length > 0 ? parsedInitialModules : [""],
          },
        ]
  );

  const [publicUrl, setPublicUrl] = useState(initialData.public_url || "");
  const [diagramUrl, setDiagramUrl] = useState(initialData.diagram || "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const addDeveloper = () => {
    setDevelopers([...developers, { name: "", role: "Programmer", modules: [""] }]);
  };

  const removeDeveloper = (index) => {
    setDevelopers(developers.filter((_, i) => i !== index));
  };

  const updateDevName = (index, val) => {
    const updated = [...developers];
    updated[index].name = val;
    setDevelopers(updated);
  };

  const updateDevRole = (index, val) => {
    const updated = [...developers];
    updated[index].role = val;
    setDevelopers(updated);
  };

  const addModuleToDev = (devIndex) => {
    const updated = [...developers];
    updated[devIndex].modules.push("");
    setDevelopers(updated);
  };

  const removeModuleFromDev = (devIndex, modIndex) => {
    const updated = [...developers];
    updated[devIndex].modules = updated[devIndex].modules.filter((_, i) => i !== modIndex);
    setDevelopers(updated);
  };

  const updateModuleValue = (devIndex, modIndex, val) => {
    const updated = [...developers];
    updated[devIndex].modules[modIndex] = val;
    setDevelopers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!appName.trim()) {
      setErrorMsg("Nama aplikasi wajib diisi.");
      return;
    }

    if (!department.trim()) {
      setErrorMsg("Departemen / Direktorat wajib dipilih.");
      return;
    }

    setLoading(true);

    const allModules = Array.from(
      new Set(
        developers
          .flatMap((d) => d.modules)
          .map((m) => m.trim())
          .filter(Boolean)
      )
    );

    const payload = {
      app_id: appId.trim() || undefined,
      app_name: appName.trim(),
      status: status.trim(),
      department: department.trim(),
      owner_unit: ownerUnit.trim(),
      po_number: poNumber.trim(),
      description: description.trim(),
      product_owner: poName.trim()
        ? { name: poName.trim(), position: poPosition.trim() }
        : null,
      assigned_employees: developers
        .filter((d) => d.name.trim())
        .map((d) => ({
          name: d.name.trim(),
          role: d.role.trim(),
        })),
      modules: allModules,
      diagram: diagramUrl.trim() || null,
      public_url: publicUrl.trim() || null,
    };

    try {
      const url = isEdit
        ? `/api/applications/${initialData.id}`
        : "/api/applications";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan data aplikasi.");
      }

      setSuccessMsg(
        isEdit
          ? "Aplikasi berhasil diperbarui!"
          : "Aplikasi baru berhasil ditambahkan!"
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 800);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-form">
      {errorMsg && <div className="alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Kode App ID</label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="Contoh: APP-007 (kosongkan untuk generate otomatis)"
            className="form-input"
            disabled={isEdit}
          />
          <span className="field-hint">
            Bila dikosongkan, sistem akan meng-generate ID otomatis.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label required">Nama</label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Nama resmi aplikasi atau sistem"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Status Aplikasi</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">Departemen / Direktorat</label>
          <input
            type="text"
            list="dept-options"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Contoh: Direktorat Akademik"
            className="form-input"
            required
          />
          <datalist id="dept-options">
            {departmentOptions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Unit Pemilik (Owner Unit)</label>
          <input
            type="text"
            value={ownerUnit}
            onChange={(e) => setOwnerUnit(e.target.value)}
            placeholder="Contoh: DSTI, DKAP, DIRINOV"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kode Singkat / Akronim</label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Contoh: DA, DSTI, BKAP"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Deskripsi Aplikasi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          placeholder="Tuliskan gambaran umum fungsi dan lingkup layanan aplikasi..."
          className="form-textarea"
        ></textarea>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Nama Product Owner (PO)</label>
          <input
            type="text"
            value={poName}
            onChange={(e) => setPoName(e.target.value)}
            placeholder="Nama lengkap PIC / Product Owner"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Jabatan Product Owner</label>
          <input
            type="text"
            value={poPosition}
            onChange={(e) => setPoPosition(e.target.value)}
            placeholder="Contoh: Direktur Akademik / Kasubdit"
            className="form-input"
          />
        </div>
      </div>

      {/* Developers & Modules Section */}
      <div className="dev-section">
        <div className="dev-section-header">
          <div>
            <h4 className="dev-section-title">
              Daftar Pengembang & Modul Aplikasi
            </h4>
            <p className="dev-section-subtitle">
              Petakan personil pengembang beserta peran teknis dan modul yang ditangani.
            </p>
          </div>
          <button
            type="button"
            onClick={addDeveloper}
            className="btn-outline add-dev-btn"
          >
            + Tambah Pengembang
          </button>
        </div>

        <div className="dev-cards-list">
          {developers.map((dev, devIdx) => (
            <div key={devIdx} className="dev-card">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Pengembang</label>
                  <input
                    type="text"
                    value={dev.name}
                    onChange={(e) => updateDevName(devIdx, e.target.value)}
                    placeholder="Nama lengkap pengembang / programmer"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peran Teknis</label>
                  <select
                    value={dev.role}
                    onChange={(e) => updateDevRole(devIdx, e.target.value)}
                    className="form-select"
                  >
                    <option value="Programmer">Programmer</option>
                    <option value="Fullstack Developer">Fullstack Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="System Analyst">System Analyst</option>
                  </select>
                </div>
              </div>

              <div className="modules-box">
                <div className="modules-box-header">
                  <label className="form-label">Modul yang Ditangani</label>
                  <button
                    type="button"
                    onClick={() => addModuleToDev(devIdx)}
                    className="btn-add-module"
                  >
                    + Tambah Modul
                  </button>
                </div>

                <div className="module-inputs-grid">
                  {dev.modules.map((mod, modIdx) => (
                    <div key={modIdx} className="module-input-pill">
                      <input
                        type="text"
                        value={mod}
                        onChange={(e) =>
                          updateModuleValue(devIdx, modIdx, e.target.value)
                        }
                        placeholder="Contoh: Modul KRS & Perwalian"
                        className="module-input"
                      />
                      {dev.modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModuleFromDev(devIdx, modIdx)}
                          className="btn-del-mod"
                          title="Hapus Modul"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {developers.length > 1 && (
                <div className="dev-card-footer">
                  <button
                    type="button"
                    onClick={() => removeDeveloper(devIdx)}
                    className="btn-soft-danger"
                  >
                    Hapus Pengembang
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">URL Website Publik (Opsional)</label>
          <input
            type="url"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            placeholder="https://... (kosongkan jika internal only)"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">URL Diagram Arsitektur (Opsional)</label>
          <input
            type="text"
            value={diagramUrl}
            onChange={(e) => setDiagramUrl(e.target.value)}
            placeholder="https://... atau /diagrams/..."
            className="form-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <Link href="/admin" className="btn-outline">
          Batal
        </Link>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Aplikasi Baru"}
        </button>
      </div>
    </form>
  );
}
