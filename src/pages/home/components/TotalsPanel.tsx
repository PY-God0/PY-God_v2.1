import type { RollMode, Totals } from '../types';

interface Props {
  totals: Totals;
  accumulated: Totals | null;
  mode: RollMode;
  enableShard: boolean;
}

export default function TotalsPanel({ totals, accumulated, mode, enableShard }: Props) {
  const showBead = mode === 'bead' || mode === 'both';
  const showHoly = mode === 'holy' || mode === 'both';
  const hasAny =
    (showBead && (totals.bead.length > 0 || (accumulated?.bead.length ?? 0) > 0)) ||
    (showHoly && (totals.holy.length > 0 || (accumulated?.holy.length ?? 0) > 0)) ||
    (enableShard && (totals.shard.length > 0 || (accumulated?.shard.length ?? 0) > 0));
  const hasAccumulated = accumulated && (
    (showBead && accumulated.bead.length > 0) ||
    (showHoly && accumulated.holy.length > 0) ||
    (enableShard && accumulated.shard.length > 0)
  );

  const merge = (current: { name: string; count: number }[], acc: { name: string; count: number }[] | undefined) => {
    const map = new Map<string, { current: number; acc: number }>();
    current.forEach((x) => map.set(x.name, { current: x.count, acc: 0 }));
    (acc ?? []).forEach((x) => {
      const e = map.get(x.name);
      if (e) e.acc = x.count;
      else map.set(x.name, { current: 0, acc: x.count });
    });
    return Array.from(map.entries())
      .map(([name, c]) => ({ name, count: c.current + c.acc, currentCount: c.current, accCount: c.acc }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const mergedBead = merge(totals.bead, accumulated?.bead);
  const mergedHoly = merge(totals.holy, accumulated?.holy);
  const mergedShard = merge(totals.shard, accumulated?.shard);

  return (
    <div className="bg-background-100 rounded-xl border border-background-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-900/40 text-primary-400 flex items-center justify-center">
          <i className="ri-bar-chart-2-line text-lg"></i>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground-900">總計</h2>
        </div>
      </div>

      {!hasAny ? (
        <div className="text-sm text-foreground-500 py-6 text-center">尚無數據，請輸入珠子/聖水/碎片數量</div>
      ) : (
        <div className="space-y-4">
          {showBead && mergedBead.length > 0 && (
            <div>
              <div className="text-xs font-medium text-primary-300 mb-2 flex items-center gap-1">
                <i className="ri-bubble-chart-line"></i>
                玩家獲得珠子數量
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mergedBead.map((t, i) => (
                  <span
                    key={t.name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm border ${
                      i === 0
                        ? 'bg-primary-500 border-primary-500 text-white font-semibold'
                        : 'bg-primary-950/30 border-primary-700/50 text-primary-300'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className={i === 0 ? 'text-primary-200' : 'text-primary-500'}>=</span>
                    <span className="font-bold tabular-nums">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {showHoly && mergedHoly.length > 0 && (
            <div>
              <div className="text-xs font-medium text-accent-300 mb-2 flex items-center gap-1">
                <i className="ri-drop-line"></i>
                玩家獲得聖水數量
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mergedHoly.map((t, i) => (
                  <span
                    key={t.name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm border ${
                      i === 0
                        ? 'bg-accent-500 border-accent-500 text-white font-semibold'
                        : 'bg-accent-950/30 border-accent-700/50 text-accent-300'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className={i === 0 ? 'text-accent-200' : 'text-accent-500'}>=</span>
                    <span className="font-bold tabular-nums">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {enableShard && mergedShard.length > 0 && (
            <div>
              <div className="text-xs font-medium text-amber-300 mb-2 flex items-center gap-1">
                <i className="ri-contrast-drop-2-line"></i>
                玩家獲得碎片數量
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mergedShard.map((t, i) => (
                  <span
                    key={t.name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm border ${
                      i === 0
                        ? 'bg-amber-500 border-amber-500 text-white font-semibold'
                        : 'bg-amber-950/20 border-amber-700/40 text-amber-300'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className={i === 0 ? 'text-amber-200' : 'text-amber-500'}>=</span>
                    <span className="font-bold tabular-nums">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}