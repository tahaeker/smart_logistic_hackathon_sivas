import { useState, useEffect } from 'react';
import MapView from './components/Map/MapView';
import RouteSelector from './components/Dashboard/RouteSelector';
import RouteStats from './components/Dashboard/RouteStats';
import DelayChart from './components/Dashboard/DelayChart';
import AlertPanel from './components/Alerts/AlertPanel';
import OptimizationPanel from './components/Optimization/OptimizationPanel';
import { fetchRoutes, fetchRoute, fetchPredictions, fetchOverview } from './api/client';

export default function App() {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [overview, setOverview] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load routes list and overview on mount
  useEffect(() => {
    fetchRoutes()
      .then(data => {
        setRoutes(data);
        if (data.length > 0) {
          setSelectedRouteId('RT-0001');
        }
      })
      .catch(err => console.error('Failed to load routes:', err));

    fetchOverview()
      .then(setOverview)
      .catch(err => console.error('Failed to load overview:', err));
  }, []);

  // When route changes, load data + predictions
  useEffect(() => {
    if (!selectedRouteId) {
      setRouteData(null);
      setPredictions(null);
      setOptimizedOrder(null);
      return;
    }

    setLoading(true);
    setOptimizedOrder(null);

    Promise.all([
      fetchRoute(selectedRouteId),
      fetchPredictions(selectedRouteId),
    ])
      .then(([rd, pd]) => {
        setRouteData(rd);
        setPredictions(pd.predictions);
      })
      .catch(err => console.error('Failed to load route data:', err))
      .finally(() => setLoading(false));
  }, [selectedRouteId]);

  const handleOptimized = (result) => {
    setOptimizedOrder(result.optimized_order);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-6 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SMART LOGISTICS</h1>
            <p className="text-blue-200 text-xs">Anadolu Hackathon 2026 | Gercek Zamanli Rota Optimizasyonu</p>
          </div>
          {overview && (
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-blue-200 text-xs">Toplam Rota</p>
                <p className="font-bold">{overview.total_routes}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xs">Ort. Gecikme</p>
                <p className="font-bold">{overview.avg_delay_min} dk</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xs">Zamaninda</p>
                <p className="font-bold">{(overview.on_time_rate * 100).toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xs">Kacirilma</p>
                <p className="font-bold text-red-300">{(overview.missed_window_rate * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map */}
        <div className="flex-1 p-3">
          <div className="h-full rounded-xl overflow-hidden shadow-md border border-slate-200">
            <MapView
              stops={routeData?.stops || []}
              predictions={predictions}
              optimizedOrder={optimizedOrder}
            />
          </div>
        </div>

        {/* Right: Panel */}
        <div className="w-96 flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm mt-2">Yukleniyor...</p>
            </div>
          )}

          {!loading && (
            <>
              <RouteSelector
                routes={routes}
                selectedRoute={selectedRouteId}
                onSelect={setSelectedRouteId}
                loading={loading}
              />

              <RouteStats
                route={routeData?.route}
                predictions={predictions}
              />

              <AlertPanel predictions={predictions} />

              <OptimizationPanel
                routeId={selectedRouteId}
                onOptimized={handleOptimized}
              />
            </>
          )}
        </div>
      </div>

      {/* Bottom: Delay Chart */}
      <div className="flex-shrink-0 p-3 pt-0">
        <DelayChart predictions={predictions} />
      </div>
    </div>
  );
}
