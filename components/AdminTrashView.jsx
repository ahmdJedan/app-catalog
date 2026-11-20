"use client";

import { useState } from "react";
import Link from "next/link";
import ApplicationTable from "./ApplicationTable";
import Toast from "./Toast";

export default function AdminTrashView({ initialTrash = [] }) {
  const [trashList, setTrashList] = useState(initialTrash);
  const [toast, setToast] = useState(null);

  const handleRestore = async (app) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memulihkan aplikasi.");
      }

      setTrashList((prev) => prev.filter((a) => a.id !== app.id));
      setToast({
        type: "success",
        message: `Aplikasi "${app.app_name}" berhasil dipulihkan ke katalog aktif!`,
      });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  return (
    <div className="trash-content">
      <div className="trash-header">
        <div>
          <h1 className="trash-title">Tempat Sampah Aplikasi</h1>
          <p className="trash-subtitle">
            Daftar aplikasi yang telah di-soft delete. Anda dapat memulihkannya kembali
            ke katalog aktif kapan saja.
          </p>
        </div>

        <Link href="/admin" className="btn-outline">
          &larr; Kembali ke Aplikasi Aktif
        </Link>
      </div>

      <ApplicationTable
        applications={trashList}
        onRestore={handleRestore}
        isTrashView={true}
      />

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
