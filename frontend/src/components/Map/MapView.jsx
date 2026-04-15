import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const RISK_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

const RISK_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

// Human-friendly feature names for SHAP factors
const FEATURE_LABELS = {
  traffic_level_enc: 'Trafik seviyesi',
  weather_condition_enc: 'Hava durumu',
  hist_mean_delay: 'Tarihsel ort. gecikme',
  hist_delay_prob: 'Tarihsel gecikme olasılığı',
  hist_p90_delay: 'Tarihsel p90 gecikme',
  distance_from_prev_km: 'Önceki durağa mesafe',
  temperature_c: 'Sıcaklık',
  precipitation_mm: 'Yağış',
  wind_speed_kmh: 'Rüzgar hızı',
  visibility_km: 'Görüş mesafesi',
  humidity_pct: 'Nem oranı',
  road_incident: 'Yol olayı',
  incident_severity: 'Olay şiddeti',
  hour: 'Saat',
  stop_sequence: 'Durak sırası',
  package_weight_kg: 'Paket ağırlığı',
  road_type_enc: 'Yol tipi',
};

function makeStopIcon(seq, color, isSimulated = false, simColor = null) {
  const displayColor = isSimulated && simColor ? simColor : color;
  const border = isSimulated ? `3px solid ${color}` : '2px solid white';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${displayColor};
      border-radius:50%;
      width:28px;
      height:28px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-weight:bold;
      font-size:11px;
      border:${border};
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    ">${seq}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function makeArrowIcon(bearing) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:0;
      height:0;
      border-left:5px solid transparent;
      border-right:5px solid transparent;
      border-bottom:10px solid rgba(255,255,255,0.85);
      transform:rotate(${bearing}deg);
      filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function calcBearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2r);
  const x =
    Math.cos(lat1r) * Math.sin(lat2r) -
    Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Auto-zoom to fit route bounds
function AutoFit({ stops }) {
  const map = useMap();
  useEffect(() => {
    if (!stops || stops.length === 0) return;
    const valid = stops.filter(s => s.latitude && s.longitude);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map(s => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [stops, map]);
  return null;
}

function StopMarkers({ stops, predictions, simulationResult, mapMode }) {
  const predMap = {};
  if (predictions) {
    predictions.forEach(p => { predMap[p.stop_sequence] = p; });
  }

  const simMap = {};
  if (simulationResult?.stops) {
    simulationResult.stops.forEach(s => { simMap[s.stop_sequence] = s; });
  }

  return stops.map((stop, idx) => {
    const pred = predMap[stop.stop_sequence] || {};
    const sim = simMap[stop.stop_sequence];
    const risk = pred.risk_level || 'low';
    const color = RISK_COLORS[risk];
    const delay = pred.predicted_delay_min ?? '-';
    const missProb = pred.miss_probability ?? 0;
    const isSimOverride = sim && sim.delta_delay_min !== 0;

    // In optimized mode, prefer visit_index (new order) over original stop_sequence
    const displayNumber = stop.visit_index != null ? stop.visit_index : stop.stop_sequence;
    const icon = makeStopIcon(
      displayNumber,
      color,
      !!sim,
      sim ? RISK_COLORS[sim.simulated_risk_level] : null
    );

    return (
      <Marker
        key={`${mapMode}-${stop.stop_id || idx}-${displayNumber}`}
        position={[stop.latitude, stop.longitude]}
        icon={icon}
      >
        <Popup>
          <div style={{ minWidth: 210, fontSize: 13, lineHeight: 1.6 }}>
            <strong>Durak #{stop.stop_sequence}</strong>
            <span style={{ color: '#64748b', marginLeft: 4 }}>{stop.stop_id}</span>
            <hr style={{ margin: '4px 0' }} />
            <div>Yol tipi: <b>{stop.road_type}</b></div>
            <div>Mesafe: <b>{stop.distance_from_prev_km} km</b></div>
            <div>Pencere: <b>{stop.time_window_open?.split(' ')[1]?.slice(0, 5)} – {stop.time_window_close?.split(' ')[1]?.slice(0, 5)}</b></div>
            <hr style={{ margin: '4px 0' }} />
            <div>
              Tahmin: <b style={{ color }}>{delay} dk</b> &nbsp;
              <span style={{
                background: color, color: '#fff', borderRadius: 4,
                padding: '1px 6px', fontSize: 11, fontWeight: 700
              }}>{RISK_LABELS[risk]}</span>
            </div>
            <div>Pencere kaçırma: <b>{(missProb * 100).toFixed(0)}%</b></div>
            {sim && (
              <>
                <hr style={{ margin: '4px 0' }} />
                <div style={{ color: sim.delta_delay_min < 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  Simülasyon: {sim.simulated_delay_min} dk ({sim.delta_delay_min > 0 ? '+' : ''}{sim.delta_delay_min} dk)
                </div>
              </>
            )}
            {(pred.top_factors || []).length > 0 && (
              <>
                <hr style={{ margin: '4px 0' }} />
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Etkili faktörler:</div>
                {pred.top_factors.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: f.impact > 0 ? '#dc2626' : '#16a34a' }}>
                    {FEATURE_LABELS[f.feature] || f.feature}: {f.impact > 0 ? '+' : ''}{f.impact}
                  </div>
                ))}
              </>
            )}
          </div>
        </Popup>
        <Tooltip direction="top" offset={[0, -14]}>
          #{stop.stop_sequence} — {delay} dk ({RISK_LABELS[risk]})
        </Tooltip>
      </Marker>
    );
  });
}

function RouteSegments({ stops, predictions, segments, selectedSegment, onSegmentClick }) {
  const predMap = {};
  if (predictions) predictions.forEach(pp => { predMap[pp.stop_sequence] = pp; });

  // Build lookup: "fromSeq-toSeq" → real road geometry (array of [lat, lng] points)
  const geomMap = {};
  if (segments) {
    segments.forEach(seg => {
      if (seg.geometry && seg.geometry.length >= 2) {
        geomMap[`${seg.from_seq}-${seg.to_seq}`] = seg;
      }
    });
  }

  // Iterate stops in the order provided (caller decides natural vs optimized)
  const sorted = stops;

  return sorted.map((stop, i) => {
    if (i === 0) return null;
    const prev  = sorted[i - 1];
    const risk  = (predMap[stop.stop_sequence] && predMap[stop.stop_sequence].risk_level) || 'low';
    const color = RISK_COLORS[risk];
    const delay = predMap[stop.stop_sequence] && predMap[stop.stop_sequence].predicted_delay_min != null
      ? predMap[stop.stop_sequence].predicted_delay_min : '-';

    // Use real road geometry if available, fall back to straight line
    const segInfo = geomMap[`${prev.stop_sequence}-${stop.stop_sequence}`];
    const positions = segInfo && segInfo.geometry.length >= 2
      ? segInfo.geometry
      : [[prev.latitude, prev.longitude], [stop.latitude, stop.longitude]];

    // Arrow at mid-index of the geometry, bearing from the actual road direction there
    const midIdx = Math.floor(positions.length / 2);
    const midPoint = positions[midIdx];
    const bearingFrom = positions[Math.max(0, midIdx - 1)];
    const bearingTo   = positions[Math.min(positions.length - 1, midIdx + 1)];
    const bearing   = calcBearing(bearingFrom[0], bearingFrom[1], bearingTo[0], bearingTo[1]);
    const arrowIcon = makeArrowIcon(bearing);

    // Prefer OSRM distance (km, 1 decimal) if available, else CSV distance
    const distanceKm = segInfo && segInfo.distance_m
      ? (segInfo.distance_m / 1000).toFixed(1)
      : stop.distance_from_prev_km;

    const isSelected = selectedSegment
      && selectedSegment.fromSeq === prev.stop_sequence
      && selectedSegment.toSeq   === stop.stop_sequence;

    const handleClick = () =>
      onSegmentClick && onSegmentClick({ fromSeq: prev.stop_sequence, toSeq: stop.stop_sequence });

    const segKey = 'seg-' + (stop.stop_id || i);
    const tooltipLabel = RISK_LABELS[risk] + ' | ' + delay + ' dk';

    return (
      <div key={segKey}>
        <Polyline
          positions={positions}
          pathOptions={{ color: 'transparent', weight: 16, opacity: 0 }}
          eventHandlers={{ click: handleClick }}
        />
        {isSelected && (
          <Polyline
            positions={positions}
            pathOptions={{ color: '#fff', weight: 10, opacity: 0.45 }}
            interactive={false}
          />
        )}
        <Polyline
          positions={positions}
          pathOptions={{ color, weight: isSelected ? 5 : 4, opacity: 0.9 }}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip sticky>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <b>Durak #{prev.stop_sequence} → #{stop.stop_sequence}</b><br />
              {distanceKm} km{predMap[stop.stop_sequence] ? ' | ' + tooltipLabel : ''}<br />
              <span style={{ color: isSelected ? '#3b82f6' : '#94a3b8', fontSize: 11 }}>
                {isSelected ? 'Seçili — koşulları düzenle' : 'Tıkla: koşulları düzenle'}
              </span>
            </div>
          </Tooltip>
        </Polyline>
        <Marker position={midPoint} icon={arrowIcon} interactive={false} />
      </div>
    );
  });
}
function MapLegend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 12,
      background: 'var(--overlay-bg)',
      color: 'var(--text-primary)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      lineHeight: 1.7,
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Risk Seviyesi</div>
      <div><span style={{ color: '#22C55E', fontWeight: 700 }}>●</span> Düşük (&lt;10 dk)</div>
      <div><span style={{ color: '#F59E0B', fontWeight: 700 }}>●</span> Orta (10–30 dk)</div>
      <div><span style={{ color: '#EF4444', fontWeight: 700 }}>●</span> Yüksek (&gt;30 dk)</div>
    </div>
  );
}

function MapModeToggle({ mode, onChange, hasOptimized }) {
  const btnBase = {
    background: 'transparent',
    border: 'none',
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    borderRadius: 999,
    transition: 'all 0.15s',
  };
  const activeBtn = {
    ...btnBase,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(59,130,246,0.35)',
  };
  const disabledBtn = {
    ...btnBase,
    color: 'var(--text-dim)',
    cursor: 'not-allowed',
  };

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--overlay-bg)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      padding: 3,
      display: 'flex',
      gap: 2,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
    }}>
      <button
        style={mode === 'current' ? activeBtn : btnBase}
        onClick={() => onChange('current')}
      >
        Şu Anki
      </button>
      <button
        style={!hasOptimized ? disabledBtn : (mode === 'optimized' ? activeBtn : btnBase)}
        onClick={() => hasOptimized && onChange('optimized')}
        disabled={!hasOptimized}
        title={hasOptimized ? 'Optimize edilmiş sırayı göster' : 'Önce "Rotayı Optimize Et" butonunu kullan'}
      >
        Optimize
      </button>
    </div>
  );
}

export default function MapView({
  stops, predictions, segments,
  optimizedOrder, optimizedSegments,
  mapMode = 'current', onMapModeChange,
  simulationResult, selectedSegment, onSegmentClick
}) {
  const hasStops = stops && stops.length > 0;
  const hasOptimized = Array.isArray(optimizedOrder) && optimizedOrder.length > 0;

  // In optimized mode, reorder stops by optimized_order so numbers on the route reflect
  // the new visit order. Fall back to natural order if optimized is missing.
  let renderedStops = stops;
  let renderedSegments = segments;
  if (mapMode === 'optimized' && hasOptimized && hasStops) {
    const stopBySeq = {};
    stops.forEach(s => { stopBySeq[s.stop_sequence] = s; });
    // Reorder stops, but keep their original stop_sequence so routing lookups work.
    // We add a synthetic visit_index for display purposes.
    renderedStops = optimizedOrder
      .map((seq, i) => {
        const s = stopBySeq[seq];
        return s ? { ...s, visit_index: i + 1 } : null;
      })
      .filter(Boolean);
    renderedSegments = optimizedSegments || [];
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
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

        {hasStops && <AutoFit stops={renderedStops} />}

        {/* Colored + arrowed route segments (real road geometry if available) */}
        {hasStops && (
          <RouteSegments
            stops={renderedStops}
            predictions={predictions || []}
            segments={renderedSegments || []}
            selectedSegment={mapMode === 'current' ? selectedSegment : null}
            onSegmentClick={mapMode === 'current' ? onSegmentClick : undefined}
          />
        )}

        {/* Numbered stop markers */}
        {hasStops && (
          <StopMarkers
            stops={renderedStops}
            predictions={predictions || []}
            simulationResult={simulationResult}
            mapMode={mapMode}
          />
        )}
      </MapContainer>

      {/* Mode toggle at top */}
      {hasStops && (
        <MapModeToggle
          mode={mapMode}
          onChange={onMapModeChange}
          hasOptimized={hasOptimized}
        />
      )}

      {/* Legend overlay (outside MapContainer to avoid z-index issues) */}
      {hasStops && <MapLegend />}

      {/* Empty state */}
      {!hasStops && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f1f5f9', zIndex: 500,
        }}>
          <p style={{ color: '#94a3b8', fontSize: 18 }}>Rota seçin...</p>
        </div>
      )}
    </div>
  );
}
