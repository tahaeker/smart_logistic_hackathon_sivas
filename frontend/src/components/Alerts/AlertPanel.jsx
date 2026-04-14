import AlertCard from './AlertCard';

export default function AlertPanel({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  const highRisk = predictions.filter(p => p.risk_level === 'high');

  if (highRisk.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
        <p className="text-green-700 text-sm font-medium">
          Yuksek riskli durak yok. Rota guvenli gorunuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1">
        <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
        Uyarilar ({highRisk.length} yuksek riskli durak)
      </h3>
      <div className="max-h-64 overflow-y-auto pr-1">
        {highRisk.map(p => (
          <AlertCard key={p.stop_id} prediction={p} />
        ))}
      </div>
    </div>
  );
}
