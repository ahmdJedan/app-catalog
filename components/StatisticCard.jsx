export default function StatisticCard({
  title,
  value,
  subtext,
  badgeType,
  badgeText,
  isLink,
}) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>

      <div className="stat-body">
        <span className="stat-value">{value}</span>

        {badgeType === "active" && (
          <span className="badge-active">{badgeText || "Aktif"}</span>
        )}

        {badgeType === "danger" && (
          <span className="badge-soft-danger">{badgeText || "Soft Deleted"}</span>
        )}

        {subtext && !badgeType && (
          <span className="stat-subtext">
            {isLink ? (
              <span className="link-text">
                {subtext}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            ) : (
              subtext
            )}
          </span>
        )}
      </div>
    </div>
  );
}
