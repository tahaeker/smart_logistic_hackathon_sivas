import AlertCard from './AlertCard';

export default function AlertPanel({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  const highRisk = predictions.filter(p => p.risk_level === 'high');

  if (highRisk.length === 0) {
    return (
      <div style={{
        background: 'var(--green-bg)',
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 12,
        border: '1px solid var(--green-border)',
      }}>
        <p style={{ color: 'var(--accent-green-light)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
          ✓ Yüksek riskli durak yok. Rota güvenli görünüyor.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, background: 'var(--accent-red)',
          borderRadius: '50%', display: 'inline-block',
        }}></span>
        Uyarılar ({highRisk.length} yüksek riskli durak)
      </h3>
      <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
        {highRisk.map(p => (
          <AlertCard key={p.stop_id} prediction={p} />
        ))}
      </div>
    </div>
  );
}
