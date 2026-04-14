const StatCard = ({ label, value, unit, color }) => (
  <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-xl font-bold ${color || 'text-slate-800'}`}>
      {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
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
    <div className="grid grid-cols-2 gap-2 mb-4">
      <StatCard
        label="Toplam Mesafe"
        value={route.total_distance_km?.toFixed(1)}
        unit="km"
      />
      <StatCard
        label="Durak Sayisi"
        value={route.num_stops}
        unit="durak"
      />
      <StatCard
        label="Ort. Tahmini Gecikme"
        value={avgDelay}
        unit="dk"
        color={parseFloat(avgDelay) > 30 ? 'text-red-500' : parseFloat(avgDelay) > 10 ? 'text-amber-500' : 'text-green-500'}
      />
      <StatCard
        label="Zamaninda Teslimat"
        value={onTimeRate}
        unit="%"
        color={parseInt(onTimeRate) < 50 ? 'text-red-500' : 'text-green-500'}
      />
    </div>
  );
}
