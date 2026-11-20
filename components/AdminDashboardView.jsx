"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StatisticCard from "./StatisticCard";
import SearchFilter from "./SearchFilter";
import ApplicationTable from "./ApplicationTable";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";

export default function AdminDashboardView({
  initialApplications = [],
  stats = {},
  departmentOptions = [],
  statusOptions = ["Aktif", "Tidak Aktif"],
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const [targetApp, setTargetApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleOpenSoftDelete = (app) => {
    setTargetApp(app);
    setModalOpen(true);
  };

  const handleConfirmSoftDelete = async () => {
    if (!targetApp) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/applications/${targetApp.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memindahkan aplikasi ke tempat sampah.");
      }

      setApplications((prev) => prev.filter((a) => a.id !== targetApp.id));
      setToast({
        type: "success",
        message: `Aplikasi "${targetApp.app_name}" berhasil dipindahkan ke tempat sampah.`,
      });
      setModalOpen(false);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setDeleting(false);
      setTargetApp(null);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Title & Top Action */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Manajemen Aplikasi Aktif</h1>
          <p className="dash-subtitle">
            Kelola seluruh data sistem, tautan akses publik, dan inventaris katalog
            internal DSTI UNDIP.
          </p>
        </div>

        <Link href="/admin/aplikasi/tambah" className="btn-primary">
          + Tambah Aplikasi Baru
        </Link>
      </div>

      {/* 4 Statistics Cards */}
      <div className="stats-grid">
        <StatisticCard
          title="Total Aplikasi Terdata"
          value={stats.totalApplications || applications.length}
          subtext={`${stats.totalDepartments || departmentOptions.length} Direktorat`}
        />

        <StatisticCard
          title="Layanan Aktif"
          value={stats.activeApplications || applications.filter((a) => a.status === "Aktif").length}
          badgeType="active"
          badgeText="Aktif"
        />

        <StatisticCard
          title="Akses Publik Tersedia"
          value={stats.publicAccess || Math.round(applications.length * 0.6)}
          subtext="URL Publik"
          isLink={true}
        />

        <StatisticCard
          title="Di Tempat Sampah"
          value={stats.trashApplications || 0}
          badgeType="danger"
          badgeText="Soft Deleted"
        />
      </div>

      {/* Search & Filter */}
      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        department={department}
        onDepartmentChange={setDepartment}
        departmentOptions={departmentOptions}
        statusOptions={statusOptions}
        placeholder="Cari nama aplikasi, direktorat, atau programmer..."
      />

      {/* Applications Table */}
      <ApplicationTable
        applications={filtered}
        onSoftDelete={handleOpenSoftDelete}
        isTrashView={false}
      />

      {/* Soft Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalOpen}
        title="Pindahkan ke Tempat Sampah"
        message={`Apakah Anda yakin ingin memindahkan aplikasi "${targetApp?.app_name}" ke tempat sampah? Data dapat dipulihkan kapan saja melalui menu Tempat Sampah.`}
        confirmText="Pindahkan"
        confirmColor="danger"
        loading={deleting}
        onConfirm={handleConfirmSoftDelete}
        onCancel={() => {
          setModalOpen(false);
          setTargetApp(null);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
