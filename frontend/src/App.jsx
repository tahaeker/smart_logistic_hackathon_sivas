import { useState, useEffect } from 'react';
import MapView from './components/Map/MapView';
import RouteSelector from './components/Dashboard/RouteSelector';
import RouteStats from './components/Dashboard/RouteStats';
import DelayChart from './components/Dashboard/DelayChart';
import AlertPanel from './components/Alerts/AlertPanel';
import OptimizationPanel from './components/Optimization/OptimizationPanel';
import ConditionEditorSidebar from './components/Simulation/ConditionEditorSidebar';
import SimulationResultChart from './components/Simulation/SimulationResultChart';
import { fetchRoutes, fetchRoute, fetchPredictions, fetchOverview } from './api/client';
import { useTheme } from './hooks/useTheme';

const TABS = [
  { id: 'overview', label: 'Özet', icon: '📊' },
  { id: 'tools', label: 'Araçlar', icon: '⚙️' },
];

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [overview, setOverview] = useState(null);
  const [optimizedOrder, setOptimizedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Simulation state
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [conditionOverrides, setConditionOverrides] = useState({});
  const [simulationResult, setSimulationResult] = useState(null);

  // Load routes list and overview on mount
  useEffect(() => {
    fetchRoutes()
      .then(data => {
        setRoutes(data);
        if (data.length > 0) {
          setSelectedRouteId(data[0].route_id);
        }
      })
      .catch(err => console.error('Failed to load routes:', err));

    fetchOverview()
      .then(setOverview)
      .catch(err => console.error('Failed to load overview:', err));
  }, []);

  // When route changes, load data + predictions, reset simulation
  useEffect(() => {
    if (!selectedRouteId) {
      setRouteData(null);
      setPredictions(null);
      setOptimizedOrder(null);
      setSelectedSegment(null);
      setConditionOverrides({});
      setSimulationResult(null);
      return;
    }

    setLoading(true);
    setOptimizedOrder(null);
    setSelectedSegment(null);
    setConditionOverrides({});
    setSimulationResult(null);

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

  const handleSegmentClick = (segment) => {
    setSelectedSegment(segment);
    setActiveTab('tools');
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <h1>SMART LOGISTICS</h1>
            <p>Anadolu Hackathon 2026 | Gerçek Zamanlı Rota Optimizasyonu</p>
          </div>
          <div className="header-stats">
            {overview && (
              <>
                <div className="header-stat">
                  <span className="header-stat-label">Toplam Rota</span>
                  <span className="header-stat-value">{overview.total_routes}</span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-label">Ort. Gecikme</span>
                  <span className="header-stat-value">{overview.avg_delay_min} <small>dk</small></span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-label">Zamanında</span>
                  <span className="header-stat-value accent-green">{(overview.on_time_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-label">Kaçırılma</span>
                  <span className="header-stat-value accent-red">{(overview.missed_window_rate * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              title={isDark ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left: Map */}
        <div className="map-area">
          <MapView
            stops={routeData?.stops || []}
            predictions={predictions}
            optimizedOrder={optimizedOrder}
            simulationResult={simulationResult}
            selectedSegment={selectedSegment}
            onSegmentClick={handleSegmentClick}
          />
        </div>

        {/* Right: Panel */}
        <aside className="side-panel">
          {/* Route Selector - always visible */}
          <div className="side-panel-header">
            <RouteSelector
              routes={routes}
              selectedRoute={selectedRouteId}
              onSelect={setSelectedRouteId}
              loading={loading}
            />
          </div>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Yükleniyor...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Tab Buttons */}
              <div className="tab-bar">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <>
                    <RouteStats
                      route={routeData?.route}
                      predictions={predictions}
                    />
                    <AlertPanel predictions={predictions} />
                    <DelayChart predictions={predictions} />
                  </>
                )}

                {activeTab === 'tools' && (
                  <>
                    <OptimizationPanel
                      routeId={selectedRouteId}
                      onOptimized={handleOptimized}
                    />

                    <ConditionEditorSidebar
                      selectedSegment={selectedSegment}
                      stops={routeData?.stops || []}
                      routeId={selectedRouteId}
                      overrides={conditionOverrides}
                      onOverridesChange={setConditionOverrides}
                      onSimulationResult={setSimulationResult}
                    />

                    <SimulationResultChart simulationResult={simulationResult} />
                  </>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
