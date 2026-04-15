import { useState } from 'react';
import { fetchOptimization } from '../../api/client';
import CompareView from './CompareView';

export default function OptimizationPanel({ routeId, onOptimized }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    if (!routeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOptimization(routeId);
      setResult(data);
      if (onOptimized) onOptimized(data);
    } catch (err) {
      setError('Optimizasyon başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !routeId || loading;

  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 8,
      }}>Rota Optimizasyonu</h3>

      <button
        onClick={handleOptimize}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: '9px 0',
          background: isDisabled ? 'var(--btn-disabled-bg)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: isDisabled ? 'var(--btn-disabled-text)' : '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Optimize ediliyor...' : '⚡ Rotayı Optimize Et'}
      </button>

      {error && (
        <p style={{ color: 'var(--accent-red-light)', fontSize: '0.7rem', marginTop: 6 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 10 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div style={{
              background: 'var(--green-bg)',
              borderRadius: 8,
              padding: '8px 4px',
              textAlign: 'center',
              border: '1px solid var(--green-border)',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green-light)', margin: 0 }}>{result.estimated_time_saved_min}</p>
              <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', margin: 0 }}>dk tasarruf</p>
            </div>
            <div style={{
              background: 'var(--blue-bg)',
              borderRadius: 8,
              padding: '8px 4px',
              textAlign: 'center',
              border: '1px solid var(--blue-border)',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-blue-light)', margin: 0 }}>{result.windows_saved}</p>
              <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', margin: 0 }}>pencere kurtarıldı</p>
            </div>
            <div style={{
              background: 'var(--amber-bg)',
              borderRadius: 8,
              padding: '8px 4px',
              textAlign: 'center',
              border: '1px solid var(--amber-border)',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber-light)', margin: 0 }}>{result.changes?.length || 0}</p>
              <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', margin: 0 }}>değişiklik</p>
            </div>
          </div>

          {/* Missed window comparison */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 8,
            padding: '8px 12px',
            marginTop: 8,
            border: '1px solid var(--border-accent)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Kaçırılacak pencere:</span>
            <span>
              <span style={{ color: 'var(--accent-red-light)', fontWeight: 700 }}>{result.original_missed}</span>
              <span style={{ margin: '0 4px', color: 'var(--text-dim)' }}>→</span>
              <span style={{ color: 'var(--accent-green-light)', fontWeight: 700 }}>{result.optimized_missed}</span>
            </span>
          </div>

          {/* Compare view */}
          <CompareView
            originalOrder={result.original_order}
            optimizedOrder={result.optimized_order}
            changes={result.changes}
          />

          {/* Change details */}
          {result.changes && result.changes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Değişiklik Detayları:</p>
              {result.changes.map((c, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 3,
                }}>
                  {c.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
