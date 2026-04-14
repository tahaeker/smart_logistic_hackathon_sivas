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
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-600 mb-3">
        Durak Bazinda Tahmini Gecikme (dk)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit=" dk" />
          <Tooltip
            formatter={(value, name) => [`${value} dk`, 'Tahmini Gecikme']}
            labelFormatter={(label) => {
              const item = data.find(d => d.name === label);
              return `${label} (${item?.stopId || ''})`;
            }}
          />
          <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={RISK_COLORS[entry.risk] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
