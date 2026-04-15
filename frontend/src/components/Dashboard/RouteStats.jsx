const StatCard = ({ label, value, unit, color }) => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: 10,
    padding: '10px 12px',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--shadow-card)',
  }}>
    <p style={{
      fontSize: '0.6rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: 0,
    }}>{label}</p>
    <p style={{
      fontSize: '1.15rem',
      fontWeight: 700,
      color: color || 'var(--text-bright)',
      margin: '2px 0 0',
    }}>
      {value}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
    </p>
  </div>
);

export default function RouteStats({ route, predictions }) {
  if (!route) return null;

  const avgDelay = predictions?.length
    ? (predictions.reduce((s, p) => s + p.predicted_delay_min, 0) / predictions.length).toFixed(1)
    : '-';

  const onTimeCount = predictions?.filter(p => p.risk_level === 'low').length || 0;
  const onTimeRate = predictions?.length
    ? ((onTimeCount / predictions.length) * 100).toFixed(0)
    : '-';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      <StatCard label="Toplam Mesafe" value={route.total_distance_km?.toFixed(1)} unit="km" />
      <StatCard label="Durak Sayısı" value={route.num_stops} unit="durak" />
      <StatCard
        label="Ort. Tahmini Gecikme"
        value={avgDelay}
        unit="dk"
        color={parseFloat(avgDelay) > 30 ? 'var(--accent-red-light)' : parseFloat(avgDelay) > 10 ? 'var(--accent-amber-light)' : 'var(--accent-green-light)'}
      />
      <StatCard
        label="Zamanında Teslimat"
        value={onTimeRate}
        unit="%"
        color={parseInt(onTimeRate) < 50 ? 'var(--accent-red-light)' : 'var(--accent-green-light)'}
      />
    </div>
  );
}
