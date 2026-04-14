import { MapContainer, TileLayer, Polyline, Popup, CircleMarker, Tooltip } from 'react-leaflet';

const RISK_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

function StopMarkers({ stops, predictions }) {
  const predMap = {};
  if (predictions) {
    predictions.forEach(p => { predMap[p.stop_sequence] = p; });
  }

  return stops.map((stop, idx) => {
    const pred = predMap[stop.stop_sequence] || {};
    const risk = pred.risk_level || 'low';
    const color = RISK_COLORS[risk];
    const delay = pred.predicted_delay_min ?? '-';
    const missProb = pred.miss_probability ?? 0;

    const factors = (pred.top_factors || [])
      .map(f => `${f.feature}: ${f.impact > 0 ? '+' : ''}${f.impact}`)
      .join('\n');

    return (
      <CircleMarker
        key={stop.stop_id || idx}
        center={[stop.latitude, stop.longitude]}
        radius={9}
        fillColor={color}
        color="#fff"
        weight={2}
        fillOpacity={0.9}
      >
        <Popup>
          <div style={{ minWidth: 200, fontSize: 13 }}>
            <strong>Durak #{stop.stop_sequence} ({stop.stop_id})</strong><br />
            Yol: {stop.road_type} | Mesafe: {stop.distance_from_prev_km} km<br />
            <strong>Tahmini gecikme: {delay} dk</strong><br />
            Pencere: {stop.time_window_open?.split(' ')[1]?.slice(0,5)} - {stop.time_window_close?.split(' ')[1]?.slice(0,5)}<br />
            Risk: <span style={{ color, fontWeight: 700 }}>{risk.toUpperCase()}</span> ({(missProb * 100).toFixed(0)}%)<br />
            {factors && (
              <>
                <strong>Sebepler:</strong><br />
                {(pred.top_factors || []).map((f, i) => (
                  <span key={i}>- {f.feature} ({f.impact > 0 ? '+' : ''}{f.impact})<br /></span>
                ))}
              </>
            )}
          </div>
        </Popup>
        <Tooltip direction="top" offset={[0, -10]}>
          #{stop.stop_sequence} {delay}dk {risk}
        </Tooltip>
      </CircleMarker>
    );
  });
}

export default function MapView({ stops, predictions, optimizedOrder }) {
  if (!stops || stops.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl">
        <p className="text-slate-400 text-lg">Rota secin...</p>
      </div>
    );
  }

  // Route polyline
  const positions = stops.map(s => [s.latitude, s.longitude]);

  // Determine overall route risk color
  const highRiskCount = predictions?.filter(p => p.risk_level === 'high').length || 0;
  const routeColor = highRiskCount >= stops.length * 0.3 ? '#EF4444' : '#3B82F6';

  // Optimized polyline (if available)
  let optimizedPositions = null;
  if (optimizedOrder && optimizedOrder.length > 0) {
    const stopMap = {};
    stops.forEach(s => { stopMap[s.stop_sequence] = s; });
    optimizedPositions = optimizedOrder
      .map(seq => stopMap[seq])
      .filter(Boolean)
      .map(s => [s.latitude, s.longitude]);
  }

  return (
    <MapContainer
      center={[39.5, 37.1]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Original route line */}
      <Polyline positions={positions} color={routeColor} weight={3} opacity={0.7} dashArray={optimizedPositions ? "8 8" : null} />

      {/* Optimized route line */}
      {optimizedPositions && (
        <Polyline positions={optimizedPositions} color="#22C55E" weight={4} opacity={0.8} />
      )}

      {/* Stop markers */}
      <StopMarkers stops={stops} predictions={predictions || []} />
    </MapContainer>
  );
}
