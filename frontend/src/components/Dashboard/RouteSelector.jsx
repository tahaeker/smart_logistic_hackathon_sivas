export default function RouteSelector({ routes, selectedRoute, onSelect, loading }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-600 mb-1">
        Rota Sec
      </label>
      <select
        value={selectedRoute || ''}
        onChange={e => onSelect(e.target.value)}
        disabled={loading}
        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-50 cursor-pointer"
      >
        <option value="">-- Rota secin --</option>
        {routes.map(r => (
          <option key={r.route_id} value={r.route_id}>
            {r.route_id} | {r.vehicle_type} | {r.num_stops} durak | {r.weather_condition} | {r.traffic_level}
          </option>
        ))}
      </select>
    </div>
  );
}
