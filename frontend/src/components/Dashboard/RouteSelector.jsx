export default function RouteSelector({ routes, selectedRoute, onSelect, loading }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{
        display: 'block',
        fontSize: '0.65rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 4,
      }}>
        Rota Seç
      </label>
      <select
        value={selectedRoute || ''}
        onChange={e => onSelect(e.target.value)}
        disabled={loading}
        style={{
          width: '100%',
          padding: '8px 10px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">-- Rota seçin --</option>
        {routes.map(r => (
          <option key={r.route_id} value={r.route_id}>
            {r.route_id} | {r.vehicle_type} | {r.num_stops} durak | {r.weather_condition} | {r.traffic_level}
          </option>
        ))}
      </select>
    </div>
  );
}
