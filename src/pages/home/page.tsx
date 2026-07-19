import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, Boss, Player, RollMode, Totals } from './types';
import {
  buildBeadOnlyCopyText,
  buildBossCopyText,
  buildCopyText,
  buildHolyOnlyCopyText,
  buildShardOnlyCopyText,
  computeBosses,
  computeTotals,
  createEmptyBoss,
  defaultState,
  loadState,
  makeHistoryRecord,
  mergeTotals,
  saveState,
} from './utils';
import PlayerList from './components/PlayerList';
import ModeSelector from './components/ModeSelector';
import BossCard from './components/BossCard';
import TotalsPanel from './components/TotalsPanel';
import HistoryPanel from './components/HistoryPanel';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import Header from '@/components/feature/Header';

export default function Home() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; visible: boolean; variant?: 'default' | 'bead' | 'holy' | 'shard' }>({ msg: '', visible: false });
  const [copiedBossId, setCopiedBossId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const toastTimer = useRef<number | null>(null);

  // Persist state
  useEffect(() => {
    saveState(state);
  }, [state]);

  const { computedBosses, totals, endBeadPointer, endHolyPointer, endShardPointer } = useMemo(() => {
    const c = computeBosses(
      state.bosses,
      state.players,
      state.beadPointer,
      state.holyPointer,
      state.shardPointer,
      state.mode,
      state.enableShard,
      state.enableTransfer ? state.transferMap : undefined,
    );
    return {
      computedBosses: c.bosses,
      totals: computeTotals(c.bosses, state.players),
      endBeadPointer: c.endBeadPointer,
      endHolyPointer: c.endHolyPointer,
      endShardPointer: c.endShardPointer,
    };
  }, [state.bosses, state.players, state.beadPointer, state.holyPointer, state.shardPointer, state.mode, state.enableShard, state.enableTransfer, state.transferMap]);

  const mergedTotals: Totals = useMemo(
    () => mergeTotals(state.accumulatedTotals, totals, state.players),
    [state.accumulatedTotals, totals, state.players],
  );

  const showToast = (msg: string, variant?: 'default' | 'bead' | 'holy' | 'shard') => {
    setToast({ msg, visible: true, variant: variant ?? 'default' });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3000);
  };

  const setPlayers = (players: Player[]) => setState((s) => ({ ...s, players }));

  const setMode = (mode: RollMode) => setState((s) => ({ ...s, mode }));

  const setEnableShard = (v: boolean) => setState((s) => ({ ...s, enableShard: v }));

  const setEnableTransfer = (v: boolean) => setState((s) => ({ ...s, enableTransfer: v, transferMap: v ? s.transferMap : {} }));

  const handleSetTransfer = (from: string, to: string) => {
    setState((s) => ({ ...s, transferMap: { ...s.transferMap, [from]: to } }));
  };

  const handleRemoveTransfer = (from: string) => {
    setState((s) => {
      const next = { ...s.transferMap };
      delete next[from];
      return { ...s, transferMap: next };
    });
  };

  const updateBoss = (id: string, patch: Partial<Boss>) => {
    setState((s) => ({
      ...s,
      bosses: s.bosses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBoss = () => {
    setState((s) => {
      if (s.bosses.length === 0) return { ...s, bosses: [createEmptyBoss(1, 1)] };
      const latestRound = s.bosses.reduce((max, b) => Math.max(max, b.round), 0);
      const kingsInRound = s.bosses.filter((b) => b.round === latestRound).length;
      if (kingsInRound >= 3) {
        const newRound = latestRound + 1;
        return { ...s, bosses: [...s.bosses, createEmptyBoss(newRound, 1)] };
      }
      const maxNumInRound = s.bosses
        .filter((b) => b.round === latestRound)
        .reduce((max, b) => Math.max(max, b.num), 0);
      return { ...s, bosses: [...s.bosses, createEmptyBoss(latestRound, maxNumInRound + 1)] };
    });
  };

  const removeBoss = (id: string) => {
    setState((s) => {
      if (s.bosses.length <= 1) return s;
      const filtered = s.bosses.filter((b) => b.id !== id);
      const roundsMap = new Map<number, Boss[]>();
      filtered.forEach((b) => {
        const arr = roundsMap.get(b.round) || [];
        arr.push(b);
        roundsMap.set(b.round, arr);
      });
      const renumbered: Boss[] = [];
      Array.from(roundsMap.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([, bosses]) => {
          bosses.forEach((b, idx) => {
            renumbered.push({ ...b, num: idx + 1 });
          });
        });
      return { ...s, bosses: renumbered };
    });
  };

  const resetBoss = (id: string) => {
    setState((s) => ({
      ...s,
      bosses: s.bosses.map((b) =>
        b.id === id ? { ...b, beadCount: 0, holyCount: 0, shardCount: 0 } : b,
      ),
    }));
    showToast('已重置該王數值');
  };

  const copyText = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to fallback
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      ta.style.opacity = '0';
      ta.style.width = '1px';
      ta.style.height = '1px';
      document.body.appendChild(ta);
      ta.focus();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyLatest = async () => {
    const text = buildCopyText(computedBosses, state.mode, state.enableShard);
    if (!text) {
      showToast('尚無結果可複製');
      return;
    }
    const ok = await copyText(text);
    if (ok) {
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 1500);
      const latest = computedBosses[computedBosses.length - 1];
      if (latest) {
        showToast(`已複製 第${latest.round}場${latest.num}王 結果`);
      } else {
        showToast('已複製結果');
      }
    } else {
      showToast('複製失敗');
    }
  };

  const handleCopyBoss = async (bossId: string) => {
    const b = computedBosses.find((x) => x.id === bossId);
    if (!b) return;
    const text = buildBossCopyText(b, state.mode, state.enableShard);
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopiedBossId(bossId);
      window.setTimeout(() => setCopiedBossId((cur) => (cur === bossId ? null : cur)), 1500);
      showToast(`已複製 第${b.round}場${b.num}王 結果`);
    }
  };

  const handleCopySlot = async (bossId: string, slot: 'bead' | 'holy' | 'shard') => {
    const b = computedBosses.find((x) => x.id === bossId);
    if (!b) return;
    let text = '';
    let label = '';
    if (slot === 'bead') {
      text = buildBeadOnlyCopyText(b);
      label = '珠子';
    } else if (slot === 'holy') {
      text = buildHolyOnlyCopyText(b);
      label = '聖水';
    } else {
      text = buildShardOnlyCopyText(b);
      label = '碎片';
    }
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      const key = `${bossId}-${slot}`;
      setCopiedSlot(key);
      window.setTimeout(() => setCopiedSlot((cur) => (cur === key ? null : cur)), 1500);
      showToast(`已複製 第${b.round}場${b.num}王 ${label}`, slot);
    }
  };

  const handleNextRound = () => {
    setState((s) => {
      const record = makeHistoryRecord(computedBosses, s.mode, s.enableShard);
      const history = record ? [record, ...s.history].slice(0, 50) : s.history;
      // Merge current totals into accumulated
      const newAccumulated = mergeTotals(s.accumulatedTotals, totals, s.players);
      const nextRound = s.bosses.reduce((max, b) => Math.max(max, b.round), 0) + 1;
      return {
        ...s,
        history,
        accumulatedTotals: newAccumulated,
        beadPointer: endBeadPointer,
        holyPointer: endHolyPointer,
        shardPointer: endShardPointer,
        transferMap: {},
        bosses: [createEmptyBoss(nextRound, 1)],
      };
    });
    showToast('進入下一場（已保存記錄，總計已累積）');
  };

  const handleResetAll = () => {
    setState((s) => {
      const record = makeHistoryRecord(computedBosses, s.mode, s.enableShard);
      const history = record ? [record, ...s.history].slice(0, 50) : s.history;
      return {
        ...defaultState(),
        players: s.players,
        mode: s.mode,
        enableShard: s.enableShard,
        history,
      };
    });
    setConfirmReset(false);
    showToast('已重設所有數據');
  };

  const handleClearHistory = () => {
    setState((s) => ({ ...s, history: [] }));
  };

  const totalRolled = computedBosses.reduce(
    (sum, b) => sum + b.beadResults.length + b.holyResults.length + b.shardResults.length,
    0,
  );

  const totalBeadRolled = computedBosses.reduce((sum, b) => sum + b.beadResults.length, 0);
  const totalHolyRolled = computedBosses.reduce((sum, b) => sum + b.holyResults.length, 0);
  const totalShardRolled = computedBosses.reduce((sum, b) => sum + b.shardResults.length, 0);

  const totalAccumBead = mergedTotals.bead.reduce((sum, x) => sum + x.count, 0);
  const totalAccumHoly = mergedTotals.holy.reduce((sum, x) => sum + x.count, 0);
  const totalAccumShard = mergedTotals.shard.reduce((sum, x) => sum + x.count, 0);

  const latestBoss = state.bosses[state.bosses.length - 1];

  // Check if latest round has 3 bosses (full)
  const latestRound = state.bosses.reduce((max, b) => Math.max(max, b.round), 0);
  const kingsInLatestRound = state.bosses.filter((b) => b.round === latestRound).length;
  const isLatestRoundFull = kingsInLatestRound >= 3;

  return (
    <div className="min-h-screen bg-background-50">
      {/* Header */}
      <div className="relative">
        <Header
          rightContent={
            <>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                title="一鍵重設（清除除玩家名單外的數據）"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-foreground-600 hover:text-rose-400 hover:bg-rose-900/20 whitespace-nowrap transition"
              >
                <i className="ri-refresh-line"></i>
                一鍵重設
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition ${
                  historyOpen
                    ? 'bg-foreground-800 text-background-50'
                    : 'bg-background-200 text-foreground-700 hover:bg-background-300'
                }`}
              >
                <i className="ri-history-line"></i>
                過往記錄
                {state.history.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded bg-primary-500 text-white text-[10px] font-bold leading-none">
                    {state.history.length}
                  </span>
                )}
              </button>
            </>
          }
        />
        <HistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={state.history}
          onClear={handleClearHistory}
        />
      </div>

      {/* Page Title */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground-950 mb-2">G27輪珠工具</h1>
        <p className="text-sm text-foreground-500">按名單順序自動輪派珠子與聖水，支援累積總計與過往記錄</p>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left column */}
        <aside className="space-y-4">
          <PlayerList
            players={state.players}
            enableTransfer={state.enableTransfer}
            transferMap={state.transferMap}
            onChange={setPlayers}
            onTransferToggle={setEnableTransfer}
            onSetTransfer={handleSetTransfer}
            onRemoveTransfer={handleRemoveTransfer}
          />
          <ModeSelector
            mode={state.mode}
            enableShard={state.enableShard}
            onModeChange={setMode}
            onShardToggle={setEnableShard}
          />
          <div className="bg-background-100 rounded-xl border border-background-200 p-4 sm:hidden">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-md text-sm text-rose-400 border border-rose-800/50 bg-rose-900/20 hover:bg-rose-900/30 whitespace-nowrap"
            >
              <i className="ri-refresh-line"></i>
              一鍵重設
            </button>
          </div>
        </aside>

        {/* Right column */}
        <section className="space-y-4">
          {/* Action bar */}
          <div className="bg-background-100 rounded-xl border border-background-200 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-foreground-600">
              <i className="ri-focus-3-line text-primary-400"></i>
              <span className="text-sm">
                第 <b className="text-foreground-950 text-sm">{latestBoss?.round ?? 1}</b> 場{' '}
                <b className="text-foreground-950 text-sm">{latestBoss?.num ?? 1}</b> 王，已輪派{' '}
                <b className="text-primary-500 text-sm">{totalAccumBead}</b>
                {' '}<span className="text-primary-400 text-sm">珠子</span>{'  '}
                <b className="text-accent-500 text-sm">{totalAccumHoly}</b>
                {' '}<span className="text-accent-400 text-sm">聖水</span>{'  '}
                <b className="text-amber-500 text-sm">{totalAccumShard}</b>
                {' '}<span className="text-amber-400 text-sm">碎片</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleNextRound}
                disabled={totalRolled === 0}
                title="保存目前順序，累積總計並由下一場 1 王重新開始"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition"
              >
                <i className="ri-skip-forward-line"></i>
                下一場
              </button>
              <button
                type="button"
                onClick={handleCopyLatest}
                disabled={totalRolled === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white whitespace-nowrap transition ${
                  copiedAll
                    ? 'bg-emerald-500'
                    : 'bg-secondary-500 hover:bg-secondary-400 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <i className={copiedAll ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                {copiedAll ? '已複製' : '複製結果'}
              </button>
            </div>
          </div>

          {/* Pointer hint */}
          {(state.beadPointer !== 0 || state.holyPointer !== 0 || (state.enableShard && state.shardPointer !== 0)) && state.players.length > 0 && (
            <div className="bg-primary-950/30 border border-primary-700/50 rounded-lg px-4 py-2.5 text-sm text-primary-200 flex items-center gap-3">
              <i className="ri-information-line text-base shrink-0"></i>
              <div className="flex-1">
                <span className="font-medium">已保留上一輪順序：</span>
                {(state.mode === 'bead' || state.mode === 'both') && (
                  <span className="ml-1">
                    珠子由「
                    <b>
                      {state.players[state.beadPointer % state.players.length]?.name ?? '—'}
                    </b>
                    」開始
                  </span>
                )}
                {(state.mode === 'holy' || state.mode === 'both') && (
                  <span className="ml-2">
                    聖水由「
                    <b>
                      {state.players[state.holyPointer % state.players.length]?.name ?? '—'}
                    </b>
                    」開始
                  </span>
                )}
                {state.enableShard && (
                  <span className="ml-2">
                    碎片由「
                    <b>
                      {state.players[state.shardPointer % state.players.length]?.name ?? '—'}
                    </b>
                    」開始
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, beadPointer: 0, holyPointer: 0, shardPointer: 0 }))}
                className="text-primary-400 hover:text-primary-200 underline underline-offset-2 whitespace-nowrap"
              >
                重置起始
              </button>
            </div>
          )}

          {/* Boss cards */}
          <div className="space-y-3">
            {state.bosses.map((b) => {
              const c = computedBosses.find((x) => x.id === b.id);
              return (
                <BossCard
                  key={b.id}
                  boss={b}
                  computed={c}
                  mode={state.mode}
                  enableShard={state.enableShard}
                  onChange={(patch) => updateBoss(b.id, patch)}
                  onRemove={() => removeBoss(b.id)}
                  onCopy={() => handleCopyBoss(b.id)}
                  onCopyBead={() => handleCopySlot(b.id, 'bead')}
                  onCopyHoly={() => handleCopySlot(b.id, 'holy')}
                  onCopyShard={() => handleCopySlot(b.id, 'shard')}
                  canRemove={b.id !== state.bosses[0]?.id}
                  onReset={() => resetBoss(b.id)}
                  copied={copiedBossId === b.id}
                  copiedBead={copiedSlot === `${b.id}-bead`}
                  copiedHoly={copiedSlot === `${b.id}-holy`}
                  copiedShard={copiedSlot === `${b.id}-shard`}
                />
              );
            })}
            {isLatestRoundFull ? (
              <button
                type="button"
                onClick={handleNextRound}
                disabled={totalRolled === 0}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary-500/60 text-primary-400 hover:border-primary-400 hover:text-primary-300 hover:bg-primary-950/30 transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="ri-skip-forward-line"></i>
                下一場（第{latestRound + 1}場 1王）
              </button>
            ) : (
              <button
                type="button"
                onClick={addBoss}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-background-300 text-foreground-500 hover:border-primary-500 hover:text-primary-400 hover:bg-primary-950/20 transition whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                新增下一王
              </button>
            )}
          </div>

          {/* Totals */}
          <TotalsPanel
            totals={totals}
            accumulated={state.accumulatedTotals}
            mode={state.mode}
            enableShard={state.enableShard}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 md:px-6 pb-6 text-center text-xs text-foreground-500 space-y-0.5">
        <p>數據會自動保存到本機，關閉網頁後下次仍可繼續使用</p>
        <p>© 2026 PY之神 - G27輪珠工具</p>
      </footer>

      <Toast message={toast.msg} visible={toast.visible} variant={toast.variant} />
      <ConfirmDialog
        open={confirmReset}
        title="一鍵重設"
        message="將清除所有王的珠子/聖水/碎片數量、輪派結果與累積總計。玩家名單將保留。是否繼續？"
        confirmText="確認重設"
        onConfirm={handleResetAll}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}