export default function SummaryCard({ title, value, subtitle, variant = 'default' }) {
  return (
    <div className={`summary-card summary-card--${variant}`}>
      <p className="summary-card__title">{title}</p>
      <p className="summary-card__value">{value}</p>
      {subtitle && <p className="summary-card__subtitle">{subtitle}</p>}
    </div>
  );
}
