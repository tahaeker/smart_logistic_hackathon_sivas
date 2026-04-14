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
      setError('Optimizasyon basarisiz: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-600 mb-2">Rota Optimizasyonu</h3>

      <button
        onClick={handleOptimize}
        disabled={!routeId || loading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300
                   text-white font-semibold rounded-lg text-sm transition-colors
                   disabled:cursor-not-allowed"
      >
        {loading ? 'Optimize ediliyor...' : 'Rotayi Optimize Et'}
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
              <p className="text-lg font-bold text-green-700">{result.estimated_time_saved_min}</p>
              <p className="text-xs text-green-600">dk tasarruf</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
              <p className="text-lg font-bold text-blue-700">{result.windows_saved}</p>
              <p className="text-xs text-blue-600">pencere kurtarildi</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
              <p className="text-lg font-bold text-amber-700">{result.changes?.length || 0}</p>
              <p className="text-xs text-amber-600">degisiklik</p>
            </div>
          </div>

          {/* Missed window comparison */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Kacirilacak pencere:</span>
              <span>
                <span className="text-red-500 font-bold">{result.original_missed}</span>
                <span className="mx-1 text-slate-400">-&gt;</span>
                <span className="text-green-600 font-bold">{result.optimized_missed}</span>
              </span>
            </div>
          </div>

          {/* Compare view */}
          <CompareView
            originalOrder={result.original_order}
            optimizedOrder={result.optimized_order}
            changes={result.changes}
          />

          {/* Change details */}
          {result.changes && result.changes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Degisiklik Detaylari:</p>
              {result.changes.map((c, i) => (
                <div key={i} className="bg-white rounded p-2 text-xs text-slate-600 border border-slate-100">
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
