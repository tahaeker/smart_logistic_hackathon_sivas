export default function AlertCard({ prediction }) {
  const { stop_id, stop_sequence, predicted_delay_min, miss_probability, risk_level, top_factors } = prediction;

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-red-500 mb-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            Durak #{stop_sequence}
            <span className="text-slate-400 font-normal ml-1">({stop_id})</span>
          </p>
          <p className="text-red-600 font-bold text-lg">
            +{predicted_delay_min} dk gecikme riski
          </p>
          <p className="text-xs text-slate-500">
            Kacirma olasiligi: %{(miss_probability * 100).toFixed(0)}
          </p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
          {risk_level.toUpperCase()}
        </span>
      </div>

      {top_factors && top_factors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-semibold mb-1">Sebepler:</p>
          {top_factors.map((f, i) => (
            <p key={i} className="text-xs text-slate-600">
              - {f.feature} ({f.impact > 0 ? '+' : ''}{f.impact})
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
