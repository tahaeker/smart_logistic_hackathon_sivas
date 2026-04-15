const fs = require('fs');
const p = 'C:/Users/Tahae/smart-logistics/frontend/src/components/Map/MapView.jsx';
let c = fs.readFileSync(p, 'utf8');

// Replace entire RouteSegments body: find the function and replace its return block
const startMarker = 'function RouteSegments({ stops, predictions, selectedSegment, onSegmentClick }) {';
const endMarker = '\nfunction MapLegend()';

const start = c.indexOf(startMarker);
const end   = c.indexOf(endMarker);

if (start === -1 || end === -1) {
  console.log('Markers not found!');
  console.log('start:', start, 'end:', end);
  process.exit(1);
}

const newRouteSegments = `function RouteSegments({ stops, predictions, selectedSegment, onSegmentClick }) {
  const predMap = {};
  if (predictions) predictions.forEach(pp => { predMap[pp.stop_sequence] = pp; });
  const sorted = [...stops].sort((a, b) => a.stop_sequence - b.stop_sequence);

  return sorted.map((stop, i) => {
    if (i === 0) return null;
    const prev  = sorted[i - 1];
    const risk  = (predMap[stop.stop_sequence] && predMap[stop.stop_sequence].risk_level) || 'low';
    const color = RISK_COLORS[risk];
    const delay = predMap[stop.stop_sequence] && predMap[stop.stop_sequence].predicted_delay_min != null
      ? predMap[stop.stop_sequence].predicted_delay_min : '-';

    const midLat    = (prev.latitude  + stop.latitude)  / 2;
    const midLng    = (prev.longitude + stop.longitude) / 2;
    const bearing   = calcBearing(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
    const arrowIcon = makeArrowIcon(bearing);

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
          positions={[[prev.latitude, prev.longitude], [stop.latitude, stop.longitude]]}
          pathOptions={{ color: 'transparent', weight: 16, opacity: 0 }}
          eventHandlers={{ click: handleClick }}
        />
        {isSelected && (
          <Polyline
            positions={[[prev.latitude, prev.longitude], [stop.latitude, stop.longitude]]}
            pathOptions={{ color: '#fff', weight: 10, opacity: 0.45 }}
            interactive={false}
          />
        )}
        <Polyline
          positions={[[prev.latitude, prev.longitude], [stop.latitude, stop.longitude]]}
          pathOptions={{ color, weight: isSelected ? 5 : 4, opacity: 0.9 }}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip sticky>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <b>Durak #{prev.stop_sequence} to #{stop.stop_sequence}</b><br />
              {stop.distance_from_prev_km} km{predMap[stop.stop_sequence] ? ' | ' + tooltipLabel : ''}<br />
              <span style={{ color: isSelected ? '#3b82f6' : '#94a3b8', fontSize: 11 }}>
                {isSelected ? 'Secili - kosullari duzenle' : 'Tikla: kosullari duzenle'}
              </span>
            </div>
          </Tooltip>
        </Polyline>
        <Marker position={[midLat, midLng]} icon={arrowIcon} interactive={false} />
      </div>
    );
  });
}`;

c = c.substring(0, start) + newRouteSegments + c.substring(end);

// Fix MapView default export: replace onStopClick with selectedSegment/onSegmentClick
c = c.replace(
  '<RouteSegments stops={stops} predictions={predictions || []} />',
  '<RouteSegments stops={stops} predictions={predictions || []} selectedSegment={selectedSegment} onSegmentClick={onSegmentClick} />'
);
c = c.replace(
  'onStopClick={onStopClick}',
  ''
);

fs.writeFileSync(p, c, 'utf8');
console.log('Done, size:', fs.statSync(p).size);
