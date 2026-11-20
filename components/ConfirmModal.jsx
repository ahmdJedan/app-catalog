export default function ConfirmModal({
  isOpen,
  title = "Konfirmasi Aksi",
  message = "Apakah Anda yakin ingin memindahkan aplikasi ini ke tempat sampah?",
  confirmText = "Pindahkan",
  cancelText = "Batal",
  confirmColor = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={confirmColor === "danger" ? "btn-soft-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: "0.65rem 1.25rem", fontSize: "0.9rem" }}
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
