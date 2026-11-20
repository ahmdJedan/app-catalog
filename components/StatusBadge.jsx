export default function StatusBadge({ status = "Aktif" }) {
  const normStatus = (status || "").toLowerCase().trim();
  const cleanStatus = normStatus.replace(/[\s\-_]+/g, "");

  const isInactive =
    cleanStatus.includes("tidakaktif") ||
    cleanStatus.includes("nonaktif") ||
    cleanStatus.includes("inactive") ||
    cleanStatus.includes("disabled") ||
    cleanStatus.includes("retiring") ||
    cleanStatus.includes("arsip") ||
    cleanStatus.includes("archived");

  if (isInactive) {
    return <span className="badge-soft-danger">{status || "Tidak Aktif"}</span>;
  }

  return <span className="badge-active">{status || "Aktif"}</span>;
}
