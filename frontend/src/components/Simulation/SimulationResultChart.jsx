import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function SummaryCard({ label, original, simulated, unit = 'dk', lowerIsBetter = true }) {
  const delta = simulated - original;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  const deltaColor = neutral ? 'var(--text-secondary)' : improved ? 'var(--accent-green-light)' : 'var(--accent-red-light)';
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-accent)',
      borderRadius: 10,
      padding: '8px 10px',
      textAlign: 'center',
      flex: 1,
    }}>
      <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: '0 0 2px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>{original}{unit}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{simulated}{unit}</span>
      </div>
      <span style={{ color: deltaColor, fontSize: '0.6rem', fontWeight: 700 }}>
        {neutral ? '—' : `${deltaText}${unit}`}
      </span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const orig = payload.find(p => p.dataKey === 'original')?.value;
  const sim = payload.find(p => p.dataKey === 'simulated')?.value;
  const delta = sim !== undefined && orig !== undefined ? (sim - orig).toFixed(1) : null;

  return (
    <div style={{
      background: 'var(--tooltip-bg)',
      border: '1px solid var(--tooltip-border)',
      borderRadius: 8,
      padding: 10,
      fontSize: '0.7rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--tooltip-text)', margin: '0 0 4px' }}>Durak #{label}</p>
      {orig !== undefined && <p style={{ color: 'var(--text-secondary)', margin: '2px 0' }}>Orijinal: <b>{orig} dk</b></p>}
      {sim !== undefined && (
        <p style={{ color: delta < 0 ? '#4ade80' : delta > 0 ? '#f87171' : 'var(--text-secondary)', margin: '2px 0' }}>
          Simülasyon: <b>{sim} dk</b>
          {delta !== null && <span> ({delta > 0 ? '+' : ''}{delta} dk)</span>}
        </p>
      )}
    </div>
  );
};

export default function SimulationResultChart({ simulationResult }) {
  if (!simulationResult) return null;

  const { stops, original_avg_delay_min, simulated_avg_delay_min,
    original_missed_windows, simulated_missed_windows, delta_avg_delay_min } = simulationResult;

  const chartData = stops.map(s => ({
    seq: s.stop_sequence,
    original: s.original_delay_min,
    simulated: s.simulated_delay_min,
    delta: s.delta_delay_min,
  }));

  const getSimColor = (entry) => {
    if (!entry) return '#64748b';
    if (entry.delta < 0) return '#4ade80';
    if (entry.delta > 0) return '#f87171';
    return '#94a3b8';
  };

  return (
    <div style={{
      marginTop: 12,
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>Simülasyon Sonuçları</h3>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0 }}>Orijinal vs. simüle tahminler</p>
        </div>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 10,
          background: delta_avg_delay_min < 0 ? 'var(--green-bg)' :
            delta_avg_delay_min > 0 ? 'var(--red-bg)' : 'var(--bg-elevated)',
          color: delta_avg_delay_min < 0 ? 'var(--accent-green-light)' :
            delta_avg_delay_min > 0 ? 'var(--accent-red-light)' : 'var(--text-secondary)',
          border: `1px solid ${delta_avg_delay_min < 0 ? 'var(--green-border)' :
            delta_avg_delay_min > 0 ? 'var(--red-border)' : 'var(--border)'}`,
        }}>
          {delta_avg_delay_min > 0 ? '+' : ''}{delta_avg_delay_min} dk ort.
        </span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 6px' }}>
        <SummaryCard
          label="Ort. Gecikme"
          original={original_avg_delay_min}
          simulated={simulated_avg_delay_min}
          unit=" dk"
        />
        <SummaryCard
          label="Kaçırılan Pencere"
          original={original_missed_windows}
          simulated={simulated_missed_windows}
          unit=" durak"
        />
      </div>

      {/* Chart */}
      <div style={{ padding: '4px 10px 10px' }}>
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-chart-grid)" />
            <XAxis
              dataKey="seq"
              tickFormatter={v => `#${v}`}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} unit=" dk" axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)' }}
              formatter={v => v === 'original' ? 'Orijinal' : 'Simülasyon'}
            />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Bar dataKey="original" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={14} name="original" />
            <Bar
              dataKey="simulated"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              name="simulated"
              fill="#3b82f6"
              label={false}
              isAnimationActive={true}
              shape={(props) => {
                const { x, y, width, height, index } = props;
                const entry = chartData[index];
                const fill = getSimColor(entry);
                return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
