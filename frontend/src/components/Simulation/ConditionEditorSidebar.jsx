import { useState } from 'react';
import { fetchSimulation } from '../../api/client';

const TRAFFIC_OPTIONS = ['low', 'moderate', 'high', 'congested'];
const TRAFFIC_LABELS = { low: 'Düşük', moderate: 'Orta', high: 'Yüksek', congested: 'Tıkalı' };

const WEATHER_OPTIONS = ['clear', 'cloudy', 'wind', 'fog', 'rain', 'snow'];
const WEATHER_LABELS = { clear: 'Açık', cloudy: 'Bulutlu', wind: 'Rüzgarlı', fog: 'Sisli', rain: 'Yağmurlu', snow: 'Karlı' };

const inputStyle = {
  width: '100%',
  fontSize: '0.75rem',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '5px 8px',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, options, labels, onChange, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={inputStyle}
    >
      <option value="">{placeholder || '— değiştirme —'}</option>
      {options.map(o => (
        <option key={o} value={o}>{labels[o] || o}</option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange, min, max, step = 0.1, placeholder }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder || '—'}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      style={inputStyle}
    />
  );
}

function StopOverrideForm({ fromSeq, toSeq, stopId, override, onChange }) {
  const set = (field, val) => onChange(toSeq, { ...override, [field]: val });

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 10,
      border: '1px solid var(--border-accent)',
      padding: 10,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Durak #{fromSeq} → #{toSeq}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{stopId}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <Field label="Trafik">
          <Select value={override.traffic_level} options={TRAFFIC_OPTIONS} labels={TRAFFIC_LABELS} onChange={v => set('traffic_level', v)} />
        </Field>
        <Field label="Hava Durumu">
          <Select value={override.weather_condition} options={WEATHER_OPTIONS} labels={WEATHER_LABELS} onChange={v => set('weather_condition', v)} />
        </Field>
        <Field label="Sıcaklık (°C)">
          <NumberInput value={override.temperature_c} onChange={v => set('temperature_c', v)} step={1} placeholder="örn: 35" />
        </Field>
        <Field label="Yağış (mm)">
          <NumberInput value={override.precipitation_mm} onChange={v => set('precipitation_mm', v)} min={0} placeholder="örn: 15" />
        </Field>
        <Field label="Rüzgar (km/s)">
          <NumberInput value={override.wind_speed_kmh} onChange={v => set('wind_speed_kmh', v)} min={0} placeholder="örn: 60" />
        </Field>
        <Field label="Görüş (km)">
          <NumberInput value={override.visibility_km} onChange={v => set('visibility_km', v)} min={0} placeholder="örn: 0.5" />
        </Field>
        <Field label="Nem (%)">
          <NumberInput value={override.humidity_pct} onChange={v => set('humidity_pct', v)} min={0} max={100} step={1} placeholder="örn: 90" />
        </Field>
        <Field label="Yol Olayı">
          <select
            value={override.road_incident === null || override.road_incident === undefined ? '' : String(override.road_incident)}
            onChange={e => set('road_incident', e.target.value === '' ? null : e.target.value === 'true')}
            style={inputStyle}
          >
            <option value="">— değiştirme —</option>
            <option value="true">Var</option>
            <option value="false">Yok</option>
          </select>
        </Field>
      </div>

      {override.road_incident === true && (
        <Field label="Olay Şiddeti (0–3)">
          <NumberInput value={override.incident_severity} onChange={v => set('incident_severity', v)} min={0} max={3} step={1} placeholder="0–3" />
        </Field>
      )}
    </div>
  );
}

export default function ConditionEditorSidebar({
  selectedSegment,
  stops,
  routeId,
  overrides,
  onOverridesChange,
  onSimulationResult,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // selectedSegment = { fromSeq, toSeq }; conditions are stored on the destination stop (toSeq)
  const fromSeq = selectedSegment?.fromSeq;
  const toSeq = selectedSegment?.toSeq;
  const destStop = stops?.find(s => s.stop_sequence === toSeq);
  const hasOverrides = Object.values(overrides).some(o =>
    Object.values(o).some(v => v !== null && v !== undefined && v !== '')
  );

  const handleChange = (seq, fields) => {
    onOverridesChange({ ...overrides, [seq]: fields });
  };

  const handleAddSelected = () => {
    if (!toSeq) return;
    if (!overrides[toSeq]) {
      onOverridesChange({ ...overrides, [toSeq]: {} });
    }
  };

  const handleRemove = (seq) => {
    const next = { ...overrides };
    delete next[seq];
    onOverridesChange(next);
  };

  const handleSimulate = async () => {
    if (!routeId) return;
    setLoading(true);
    setError(null);
    try {
      const overrideList = Object.entries(overrides)
        .map(([seq, fields]) => {
          const clean = { stop_sequence: Number(seq) };
          Object.entries(fields).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') clean[k] = v;
          });
          return clean;
        })
        .filter(o => Object.keys(o).length > 1);

      const result = await fetchSimulation(routeId, overrideList);
      onSimulationResult(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Simülasyon başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onOverridesChange({});
    onSimulationResult(null);
  };

  const isDisabled = loading || !hasOverrides;

  return (
    <div style={{
      marginTop: 12,
      border: '1px solid var(--border-accent)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>Koşul Simülasyonu</h3>
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Koşul değiştirip etkisini gör</p>
        </div>
        {hasOverrides && (
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {Object.keys(overrides).length} durak
          </span>
        )}
      </div>

      <div style={{ padding: 10 }}>
        {destStop && !overrides[toSeq] && (
          <button
            onClick={handleAddSelected}
            style={{
              width: '100%',
              marginBottom: 8,
              fontSize: '0.75rem',
              background: 'var(--blue-bg)',
              color: 'var(--accent-blue-light)',
              border: '1px dashed var(--blue-border)',
              borderRadius: 8,
              padding: '8px 0',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Durak #{fromSeq} → #{toSeq} yolunu düzenle
          </button>
        )}

        {!selectedSegment && Object.keys(overrides).length === 0 && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0' }}>
            Haritada bir durağa tıklayın
          </p>
        )}

        {Object.entries(overrides).map(([seq, fields]) => {
          const seqNum = Number(seq);
          const stop = stops?.find(s => s.stop_sequence === seqNum);
          // Find the previous stop to display "from → to" label
          const sorted = stops ? [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence) : [];
          const idx = sorted.findIndex(s => s.stop_sequence === seqNum);
          const prevSeq = idx > 0 ? sorted[idx - 1].stop_sequence : null;

          return (
            <div key={seq} style={{ position: 'relative' }}>
              <button
                onClick={() => handleRemove(seqNum)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  zIndex: 10,
                }}
                title="Kaldır"
              >
                ✕
              </button>
              <StopOverrideForm
                fromSeq={prevSeq}
                toSeq={seqNum}
                stopId={stop?.stop_id || ''}
                override={fields}
                onChange={handleChange}
              />
            </div>
          );
        })}

        {Object.keys(overrides).length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              onClick={handleSimulate}
              disabled={isDisabled}
              style={{
                flex: 1,
                background: isDisabled ? 'var(--btn-disabled-bg)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: isDisabled ? 'var(--btn-disabled-text)' : '#fff',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 8,
                padding: '8px 0',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Simüle ediliyor...' : '▶ Simüle Et'}
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Temizle
            </button>
          </div>
        )}

        {error && (
          <p style={{
            marginTop: 6,
            fontSize: '0.7rem',
            color: 'var(--accent-red-light)',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 8,
            padding: '6px 10px',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
