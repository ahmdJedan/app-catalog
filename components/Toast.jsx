export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  return (
    <div className={`toast-card toast-${type}`}>
      <span className="toast-msg">{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Tutup">
          &times;
        </button>
      )}
    </div>
  );
}
