export default function AlertCard({ prediction }) {
  const { stop_id, stop_sequence, predicted_delay_min, miss_probability, risk_level, top_factors } = prediction;

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 10,
      padding: '10px 12px',
      borderLeft: '3px solid var(--accent-red)',
      marginBottom: 6,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem', margin: 0 }}>
            Durak #{stop_sequence}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4, fontSize: '0.7rem' }}>({stop_id})</span>
          </p>
          <p style={{ color: 'var(--accent-red-light)', fontWeight: 700, fontSize: '0.95rem', margin: '2px 0 0' }}>
            +{predicted_delay_min} dk gecikme riski
          </p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
            Kaçırma olasılığı: %{(miss_probability * 100).toFixed(0)}
          </p>
        </div>
        <span style={{
          background: 'var(--red-bg)',
          color: 'var(--accent-red-light)',
          fontSize: '0.6rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          {risk_level.toUpperCase()}
        </span>
      </div>

      {top_factors && top_factors.length > 0 && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 2px' }}>Sebepler:</p>
          {top_factors.map((f, i) => (
            <p key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '1px 0' }}>
              - {f.feature} ({f.impact > 0 ? '+' : ''}{f.impact})
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
