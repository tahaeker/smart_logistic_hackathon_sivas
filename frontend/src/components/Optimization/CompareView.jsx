export default function CompareView({ originalOrder, optimizedOrder, changes }) {
  if (!originalOrder || !optimizedOrder) return null;

  const changedStops = new Set();
  if (changes) {
    changes.forEach(c => changedStops.add(c.stop));
  }

  const renderOrder = (order, label) => (
    <div>
      <p className="text-xs text-slate-500 font-semibold mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {order.map((seq, idx) => {
          const isChanged = changedStops.has(seq);
          return (
            <span key={idx} className="flex items-center">
              <span
                className={`inline-block w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center
                  ${isChanged ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-slate-100 text-slate-600'}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {seq}
              </span>
              {idx < order.length - 1 && (
                <span className="text-slate-300 mx-0.5 text-xs">&#8594;</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
      {renderOrder(originalOrder, 'Orijinal Siralama')}
      {renderOrder(optimizedOrder, 'Onerilen Siralama')}
    </div>
  );
}
