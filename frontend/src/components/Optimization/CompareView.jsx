export default function CompareView({ originalOrder, optimizedOrder, changes }) {
  if (!originalOrder || !optimizedOrder) return null;

  const changedStops = new Set();
  if (changes) {
    changes.forEach(c => changedStops.add(c.stop));
  }

  const renderOrder = (order, label) => (
    <div>
      <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
        {order.map((seq, idx) => {
          const isChanged = changedStops.has(seq);
          return (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: isChanged ? 'var(--amber-bg)' : 'var(--bg-surface)',
                  color: isChanged ? 'var(--accent-amber-light)' : 'var(--text-secondary)',
                  border: isChanged ? '2px solid var(--amber-border)' : '1px solid var(--border)',
                }}
              >
                {seq}
              </span>
              {idx < order.length - 1 && (
                <span style={{ color: 'var(--border)', fontSize: '0.6rem' }}>→</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 8,
      padding: 10,
      border: '1px solid var(--border-accent)',
      marginTop: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {renderOrder(originalOrder, 'Orijinal Sıralama')}
      {renderOrder(optimizedOrder, 'Önerilen Sıralama')}
    </div>
  );
}
