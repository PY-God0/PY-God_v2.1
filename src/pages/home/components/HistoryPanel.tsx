import { useEffect, useRef } from 'react';
import type { HistoryRecord } from '../types';
import { formatResultLine, formatTimestamp } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  history: HistoryRecord[];
  onClear: () => void;
}

export default function HistoryPanel({ open, onClose, history, onClear }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[360px] max-w-[92vw] max-h-[70vh] overflow-y-auto bg-background-100 rounded-xl border border-background-200 shadow-lg z-30 animate-slide-down"
    >
      <div className="sticky top-0 bg-background-100 flex items-center justify-between px-4 py-3 border-b border-background-200">
        <div className="flex items-center gap-2">
          <i className="ri-history-line text-foreground-600"></i>
          <span className="text-sm font-semibold text-foreground-900">過往記錄</span>
          <span className="text-xs text-foreground-500">({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-foreground-500 hover:text-rose-400 whitespace-nowrap"
          >
            清空
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-foreground-500">
          <i className="ri-inbox-line text-2xl block mb-2"></i>
          尚未有記錄
        </div>
      ) : (
        <ul className="py-2">
          {history.map((rec) => (
            <li key={rec.id} className="px-4 py-2.5 hover:bg-background-200 transition">
              <div className="text-xs text-foreground-500 mb-1.5 font-medium">
                {formatTimestamp(rec.timestamp)}
              </div>
              <div className="space-y-1">
                {rec.bosses.map((b) => {
                  const showBead = (rec.mode === 'bead' || rec.mode === 'both') && b.beadResults.length > 0;
                  const showHoly = (rec.mode === 'holy' || rec.mode === 'both') && b.holyResults.length > 0;
                  const showShard = b.shardResults && b.shardResults.length > 0;
                  const beadLast = b.beadResults[b.beadResults.length - 1];
                  const holyLast = b.holyResults[b.holyResults.length - 1];
                  const shardLast = showShard ? b.shardResults[b.shardResults.length - 1] : '';
                  return (
                    <div key={b.id} className="text-xs text-foreground-700 leading-relaxed">
                      <span className="inline-block px-1.5 py-0.5 mr-1 rounded bg-foreground-800 text-primary-200 font-semibold">
                        第{b.round}場{b.num}王
                      </span>
                      {showBead && (
                        <span className="mr-2">
                          珠={b.beadResults.length}
                          <span className="text-foreground-500 ml-0.5">:{beadLast}</span>
                        </span>
                      )}
                      {showHoly && (
                        <span className="mr-2">
                          水={b.holyResults.length}
                          <span className="text-foreground-500 ml-0.5">:{holyLast}</span>
                        </span>
                      )}
                      {showShard && (
                        <span>
                          碎片={b.shardResults.length}
                          <span className="text-foreground-500 ml-0.5">:{shardLast}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <details className="mt-1.5">
                <summary className="text-xs text-foreground-500 cursor-pointer hover:text-foreground-900">
                  查看詳情
                </summary>
                <div className="mt-1.5 space-y-0.5 text-xs text-foreground-700 pl-2 border-l-2 border-background-300">
                  {rec.bosses.map((b) => (
                    <div key={b.id}>
                      {(rec.mode === 'bead' || rec.mode === 'both') && b.beadResults.length > 0 && (
                        <div className="break-words">
                          <span className="text-primary-400">第{b.round}場{b.num}王{b.beadResults.length}珠</span>=
                          {formatResultLine(b.beadResults)}
                        </div>
                      )}
                      {(rec.mode === 'holy' || rec.mode === 'both') && b.holyResults.length > 0 && (
                        <div className="break-words">
                          <span className="text-accent-400">第{b.round}場{b.num}王{b.holyResults.length}水</span>=
                          {formatResultLine(b.holyResults)}
                        </div>
                      )}
                      {b.shardResults && b.shardResults.length > 0 && (
                        <div className="break-words">
                          <span className="text-amber-400">第{b.round}場{b.num}王{b.shardResults.length}碎片</span>=
                          {formatResultLine(b.shardResults)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}