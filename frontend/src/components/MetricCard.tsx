interface MetricCardProps {
  label: string;
  value: string;
  tone: 'neutral' | 'muted' | 'buy' | 'sell';
}

export function MetricCard({ label, value, tone }: MetricCardProps) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="mono kpi-label">{label}</div>
      <div className="kpi-value mono">{value}</div>
    </div>
  );
}
