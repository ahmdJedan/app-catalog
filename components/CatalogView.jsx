"use client";

import { useState, useMemo } from "react";
import SearchFilter from "./SearchFilter";
import ApplicationCard from "./ApplicationCard";

export default function CatalogView({
  applications = [],
  departmentOptions = [],
  statusOptions = ["Aktif", "Tidak Aktif"],
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = app.app_name?.toLowerCase().includes(q);
        const matchesDesc = app.description?.toLowerCase().includes(q);
        const matchesDept = app.department?.toLowerCase().includes(q);
        const matchesOwner = app.owner_unit?.toLowerCase().includes(q);
        const matchesPo = app.po_number?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesDept && !matchesOwner && !matchesPo) {
          return false;
        }
      }

      if (status && status !== "Semua Status") {
        if (app.status !== status) return false;
      }

      if (department && department !== "Semua Direktorat") {
        if (app.department !== department) return false;
      }

      return true;
    });
  }, [applications, search, status, department]);

  return (
    <div id="katalog" className="catalog-wrapper">
      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        department={department}
        onDepartmentChange={setDepartment}
        departmentOptions={departmentOptions}
        statusOptions={statusOptions}
        placeholder="Cari nama aplikasi, modul, atau unit kerja..."
      />

      <div className="section-header">
        <div className="section-title-group">
          <span className="section-tag">DIREKTORI LAYANAN</span>
          <h2 className="section-title">Aplikasi Internal</h2>
          <p className="section-subtitle">
            Menampilkan <strong>{filtered.length}</strong> aplikasi internal
          </p>
        </div>

        <div className="section-hint">
          <span>&bull; dari {applications.length} aplikasi</span>
          <span className="sub-hint">Klik &quot;Detail&quot; untuk melihat pengembang &amp; modul</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <p className="empty-text">
            Tidak ada aplikasi yang cocok dengan kriteria pencarian &amp; filter.
          </p>
        </div>
      ) : (
        <div className="app-grid">
          {filtered.map((app, idx) => (
            <ApplicationCard key={app.id} application={app} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
