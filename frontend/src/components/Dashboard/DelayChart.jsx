import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

export default function DelayChart({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  const data = predictions.map(p => ({
    name: `#${p.stop_sequence}`,
    delay: p.predicted_delay_min,
    risk: p.risk_level,
    stopId: p.stop_id,
  }));

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 10,
      padding: '10px 12px',
      border: '1px solid var(--border-accent)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <h3 style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        margin: '0 0 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}>
        Durak Bazında Tahmini Gecikme
      </h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 2, right: 4, left: -20, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-chart-grid)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit=" dk" axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: 8,
              color: 'var(--tooltip-text)',
              fontSize: 12,
            }}
            formatter={(value) => [`${value} dk`, 'Tahmini Gecikme']}
            labelFormatter={(label) => {
              const item = data.find(d => d.name === label);
              return `${label} (${item?.stopId || ''})`;
            }}
          />
          <Bar dataKey="delay" radius={[3, 3, 0, 0]} maxBarSize={24}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={RISK_COLORS[entry.risk] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
