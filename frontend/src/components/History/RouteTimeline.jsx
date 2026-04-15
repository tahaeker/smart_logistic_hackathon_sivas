/**
 * RouteTimeline — git-graph style event history for the selected route.
 *
 * Each event is a snapshot of the map/tool state at a given moment.
 * Clicking an event calls `onRestore(event)` so App.jsx can re-apply it.
 *
 * Events are scoped per-route (App.jsx passes the already-filtered list).
 */

const TYPE_META = {
  initial:  { icon: '◉', label: 'Rota yüklendi',  color: '#64748b' },
  optimize: { icon: '⚡', label: 'Optimizasyon',   color: '#3b82f6' },
  simulate: { icon: '🧪', label: 'Simülasyon',    color: '#a855f7' },
};

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function RouteTimeline({ events, activeEventId, onRestore, onClear }) {
  if (!events || events.length === 0) {
    return (
      <div style={{
        padding: '16px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        textAlign: 'center',
        background: 'var(--card-bg)',
        border: '1px dashed var(--border)',
        borderRadius: 10,
      }}>
        Bu rotada henüz işlem yok.<br />
        Optimize et veya bir simülasyon çalıştır.
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 2px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        padding: '0 4px',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {events.length} İŞLEM
        </span>
        {onClear && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
            title="Geçmişi temizle"
          >
            Temizle
          </button>
        )}
      </div>

      <div style={{ position: 'relative', paddingLeft: 4 }}>
        {/* vertical rail */}
        <div style={{
          position: 'absolute',
          left: 14,
          top: 10,
          bottom: 10,
          width: 2,
          background: 'var(--border)',
        }} />

        {events.map((ev) => {
          const meta = TYPE_META[ev.type] || TYPE_META.initial;
          const isActive = ev.id === activeEventId;
          return (
            <div
              key={ev.id}
              onClick={() => onRestore && onRestore(ev)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 10px 8px 4px',
                marginBottom: 4,
                borderRadius: 8,
                cursor: 'pointer',
                background: isActive ? 'var(--tab-active-bg)' : 'transparent',
                border: isActive ? `1px solid ${meta.color}` : '1px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--tab-hover-bg)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* node dot */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: meta.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 3px ${meta.color}33` : '0 1px 3px rgba(0,0,0,0.25)',
                zIndex: 1,
              }}>
                {meta.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 6,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                    {fmtTime(ev.timestamp)}
                  </span>
                </div>
                {ev.summary && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}>
                    {ev.summary}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
