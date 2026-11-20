export default function StatusBadge({ status = "Aktif" }) {
  const isAktif = status === "Aktif" || status === "Available";

  if (isAktif) {
    return <span className="badge-active">Aktif</span>;
  }

  return <span className="badge-soft-danger">{status}</span>;
}
