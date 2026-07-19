import type { Boss, RollMode, ComputedBoss } from '../types';
import { formatResultLine } from '../utils';

interface Props {
  boss: Boss;
  computed: ComputedBoss | undefined;
  mode: RollMode;
  enableShard: boolean;
  onChange: (patch: Partial<Boss>) => void;
  onRemove: () => void;
  onCopy: () => void;
  onCopyBead: () => void;
  onCopyHoly: () => void;
  onCopyShard: () => void;
  canRemove: boolean;
  copied: boolean;
  copiedBead: boolean;
  copiedHoly: boolean;
  copiedShard: boolean;
  onReset: () => void;
}

export default function BossCard({
  boss,
  computed,
  mode,
  enableShard,
  onChange,
  onRemove,
  onCopy,
  onCopyBead,
  onCopyHoly,
  onCopyShard,
  canRemove,
  copied,
  copiedBead,
  copiedHoly,
  copiedShard,
  onReset,
}: Props) {
  const showBead = mode === 'bead' || mode === 'both';
  const showHoly = mode === 'holy' || mode === 'both';
  const beadResults = computed?.beadResults ?? [];
  const holyResults = computed?.holyResults ?? [];
  const shardResults = computed?.shardResults ?? [];

  const visibleCount = (showBead ? 1 : 0) + (showHoly ? 1 : 0) + (enableShard ? 1 : 0);
  const gridClass =
    visibleCount === 1
      ? 'grid-cols-1'
      : visibleCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="bg-background-100 rounded-xl border border-background-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-background-200 border-b border-background-200">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground-500 bg-background-300 px-1.5 py-0.5 rounded">
            第{boss.round}場
          </span>
          <div className="w-7 h-7 rounded-md bg-primary-950/60 text-primary-300 flex items-center justify-center text-xs font-bold">
            {boss.num}
          </div>
          <span className="text-sm font-semibold text-foreground-900">王</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            disabled={boss.beadCount === 0 && boss.holyCount === 0 && boss.shardCount === 0}
            title="重置此王數值"
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-500 hover:text-amber-400 hover:bg-amber-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <i className="ri-restart-line"></i>
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={beadResults.length === 0 && holyResults.length === 0 && shardResults.length === 0}
            title="複製此王全部結果"
            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition ${
              copied
                ? 'text-emerald-400 bg-emerald-900/20'
                : 'text-foreground-500 hover:text-foreground-900 hover:bg-background-300 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              title="刪除此王"
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-500 hover:text-rose-400 hover:bg-rose-900/20 transition"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>
      </div>

      <div className={`p-4 grid gap-3 ${gridClass}`}>
        {showBead && (
          <div className="rounded-lg bg-primary-950/30 border border-primary-700/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img src="https://static.readdy.ai/image/89724625b6278e5f6dc53214dbe45c52/62734b7b4a38772352d755938ef364e1.png" alt="" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ beadCount: Math.max(0, boss.beadCount - 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-primary-700/50 text-primary-400 hover:bg-primary-950/50"
                >
                  <i className="ri-subtract-line text-sm"></i>
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={boss.beadCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onChange({ beadCount: Number.isFinite(v) ? Math.max(0, Math.min(999, v)) : 0 });
                  }}
                  className="w-14 text-center text-sm font-semibold py-1 bg-background-100 border border-primary-700/50 rounded outline-none focus:ring-2 focus:ring-primary-500 text-foreground-950"
                />
                <button
                  type="button"
                  onClick={() => onChange({ beadCount: Math.min(999, boss.beadCount + 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-primary-700/50 text-primary-400 hover:bg-primary-950/50"
                >
                  <i className="ri-add-line text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={onCopyBead}
                  disabled={beadResults.length === 0}
                  title="只複製珠子結果"
                  className={`w-5.5 h-5.5 flex items-center justify-center rounded text-xs transition ${
                    copiedBead
                      ? 'text-emerald-400 bg-emerald-900/20'
                      : 'text-primary-500/60 hover:text-primary-300 hover:bg-primary-950/50 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <i className={copiedBead ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                </button>
              </div>
            </div>
            <div className="min-h-[38px] rounded-md bg-background-100 border border-primary-800/30 px-2.5 py-1.5 text-sm text-foreground-900 break-words">
              {beadResults.length > 0 ? (
                <span>{formatResultLine(beadResults)}</span>
              ) : (
                <span className="text-foreground-500 text-xs">尚未輪派</span>
              )}
            </div>
          </div>
        )}

        {showHoly && (
          <div className="rounded-lg bg-accent-950/30 border border-accent-700/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img src="https://public.readdy.ai/ai/img_res/8b6bbfd3-e4a9-4ace-b77c-986532e0692f.png" alt="" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ holyCount: Math.max(0, boss.holyCount - 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-accent-700/50 text-accent-400 hover:bg-accent-950/50"
                >
                  <i className="ri-subtract-line text-sm"></i>
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={boss.holyCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onChange({ holyCount: Number.isFinite(v) ? Math.max(0, Math.min(999, v)) : 0 });
                  }}
                  className="w-14 text-center text-sm font-semibold py-1 bg-background-100 border border-accent-700/50 rounded outline-none focus:ring-2 focus:ring-accent-500 text-foreground-950"
                />
                <button
                  type="button"
                  onClick={() => onChange({ holyCount: Math.min(999, boss.holyCount + 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-accent-700/50 text-accent-400 hover:bg-accent-950/50"
                >
                  <i className="ri-add-line text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={onCopyHoly}
                  disabled={holyResults.length === 0}
                  title="只複製聖水結果"
                  className={`w-5.5 h-5.5 flex items-center justify-center rounded text-xs transition ${
                    copiedHoly
                      ? 'text-emerald-400 bg-emerald-900/20'
                      : 'text-accent-500/60 hover:text-accent-300 hover:bg-accent-950/50 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <i className={copiedHoly ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                </button>
              </div>
            </div>
            <div className="min-h-[38px] rounded-md bg-background-100 border border-accent-800/30 px-2.5 py-1.5 text-sm text-foreground-900 break-words">
              {holyResults.length > 0 ? (
                <span>{formatResultLine(holyResults)}</span>
              ) : (
                <span className="text-foreground-500 text-xs">尚未輪派</span>
              )}
            </div>
          </div>
        )}

        {enableShard && (
          <div className="rounded-lg bg-amber-950/20 border border-amber-700/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img src="https://public.readdy.ai/ai/img_res/a7137356-af6e-46c2-903c-8e51caaef416.png" alt="" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ shardCount: Math.max(0, boss.shardCount - 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-amber-700/40 text-amber-400 hover:bg-amber-950/40"
                >
                  <i className="ri-subtract-line text-sm"></i>
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={boss.shardCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    onChange({ shardCount: Number.isFinite(v) ? Math.max(0, Math.min(999, v)) : 0 });
                  }}
                  className="w-14 text-center text-sm font-semibold py-1 bg-background-100 border border-amber-700/40 rounded outline-none focus:ring-2 focus:ring-amber-500 text-foreground-950"
                />
                <button
                  type="button"
                  onClick={() => onChange({ shardCount: Math.min(999, boss.shardCount + 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded bg-background-100 border border-amber-700/40 text-amber-400 hover:bg-amber-950/40"
                >
                  <i className="ri-add-line text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={onCopyShard}
                  disabled={shardResults.length === 0}
                  title="只複製碎片結果"
                  className={`w-5.5 h-5.5 flex items-center justify-center rounded text-xs transition ${
                    copiedShard
                      ? 'text-emerald-400 bg-emerald-900/20'
                      : 'text-amber-500/60 hover:text-amber-300 hover:bg-amber-950/50 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <i className={copiedShard ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                </button>
              </div>
            </div>
            <div className="min-h-[38px] rounded-md bg-background-100 border border-amber-800/30 px-2.5 py-1.5 text-sm text-foreground-900 break-words">
              {shardResults.length > 0 ? (
                <span>{formatResultLine(shardResults)}</span>
              ) : (
                <span className="text-foreground-500 text-xs">尚未輪派</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}