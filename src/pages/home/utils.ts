import type { AppState, Boss, ComputedBoss, HistoryRecord, Player, RollMode, Totals } from './types';

export const STORAGE_KEY = 'g271-3-wanglunzhu-tool-v3';
export const SCHEMA_VERSION = 1;

export const DEFAULT_PLAYERS: Player[] = [
  { id: 'p-1', name: '玩家1' },
  { id: 'p-2', name: '玩家2' },
  { id: 'p-3', name: '玩家3' },
  { id: 'p-4', name: '玩家4' },
  { id: 'p-5', name: '玩家5' },
];

export const createEmptyBoss = (round: number, num: number): Boss => ({
  id: `boss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  round,
  num,
  beadCount: 0,
  holyCount: 0,
  shardCount: 0,
});

export const defaultState = (): AppState => ({
  players: DEFAULT_PLAYERS,
  mode: 'both',
  bosses: [createEmptyBoss(1, 1)],
  beadPointer: 0,
  holyPointer: 0,
  shardPointer: 0,
  enableShard: false,
  enableTransfer: false,
  transferMap: {},
  accumulatedTotals: null,
  history: [],
});

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const bosses: Boss[] = Array.isArray(parsed.bosses) && parsed.bosses.length > 0
      ? migrateBosses(parsed.bosses.map((b: any) => ({
          id: b.id ?? `boss-${Math.random()}`,
          round: typeof b.round === 'number' ? b.round : 1,
          num: typeof b.num === 'number' ? b.num : 1,
          beadCount: typeof b.beadCount === 'number' ? b.beadCount : 0,
          holyCount: typeof b.holyCount === 'number' ? b.holyCount : 0,
          shardCount: typeof b.shardCount === 'number' ? b.shardCount : 0,
        })))
      : base.bosses;
    // Reset players to defaults if schema version changed (old hardcoded names migration)
    const versionMatch = parsed._schemaVersion === SCHEMA_VERSION;
    return {
      players: versionMatch && Array.isArray(parsed.players) && parsed.players.length > 0 ? parsed.players : base.players,
      mode: parsed.mode || base.mode,
      bosses,
      beadPointer: typeof parsed.beadPointer === 'number' ? parsed.beadPointer : 0,
      holyPointer: typeof parsed.holyPointer === 'number' ? parsed.holyPointer : 0,
      shardPointer: typeof parsed.shardPointer === 'number' ? parsed.shardPointer : 0,
      enableShard: typeof parsed.enableShard === 'boolean' ? parsed.enableShard : false,
      enableTransfer: typeof parsed.enableTransfer === 'boolean' ? parsed.enableTransfer : false,
      transferMap: typeof parsed.transferMap === 'object' && parsed.transferMap !== null && !Array.isArray(parsed.transferMap) ? parsed.transferMap : {},
      accumulatedTotals: parsed.accumulatedTotals || null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _schemaVersion: SCHEMA_VERSION }));
  } catch {
    // ignore
  }
}

export function rollFrom(
  players: Player[],
  pointer: number,
  count: number,
): { results: string[]; nextPointer: number } {
  if (players.length === 0 || count <= 0) return { results: [], nextPointer: pointer };
  const results: string[] = [];
  let p = ((pointer % players.length) + players.length) % players.length;
  for (let i = 0; i < count; i += 1) {
    results.push(players[p].name);
    p = (p + 1) % players.length;
  }
  return { results, nextPointer: p };
}

export function applyTransfers(
  bosses: ComputedBoss[],
  transferMap: Record<string, string>,
): ComputedBoss[] {
  if (Object.keys(transferMap).length === 0) return bosses;
  return bosses.map((b) => ({
    ...b,
    beadResults: b.beadResults.map((name) => transferMap[name] ?? name),
    holyResults: b.holyResults.map((name) => transferMap[name] ?? name),
    shardResults: b.shardResults.map((name) => transferMap[name] ?? name),
  }));
}

export interface ComputeResult {
  bosses: ComputedBoss[];
  endBeadPointer: number;
  endHolyPointer: number;
  endShardPointer: number;
}

export function computeBosses(
  bosses: Boss[],
  players: Player[],
  startBead: number,
  startHoly: number,
  startShard: number,
  mode: RollMode,
  enableShard: boolean,
  transfers?: Record<string, string>,
): ComputeResult {
  let bp = startBead;
  let hp = startHoly;
  let sp = startShard;
  const useBead = mode === 'bead' || mode === 'both';
  const useHoly = mode === 'holy' || mode === 'both';
  const raw = bosses.map((b) => {
    let beadResults: string[] = [];
    let holyResults: string[] = [];
    let shardResults: string[] = [];
    if (useBead && b.beadCount > 0) {
      const r = rollFrom(players, bp, b.beadCount);
      beadResults = r.results;
      bp = r.nextPointer;
    }
    if (useHoly && b.holyCount > 0) {
      const r = rollFrom(players, hp, b.holyCount);
      holyResults = r.results;
      hp = r.nextPointer;
    }
    if (enableShard && b.shardCount > 0) {
      const r = rollFrom(players, sp, b.shardCount);
      shardResults = r.results;
      sp = r.nextPointer;
    }
    return { ...b, beadResults, holyResults, shardResults };
  });
  const resultBosses = transfers && Object.keys(transfers).length > 0 ? applyTransfers(raw, transfers) : raw;
  return { bosses: resultBosses, endBeadPointer: bp, endHolyPointer: hp, endShardPointer: sp };
}

export function computeTotals(bosses: ComputedBoss[], players: Player[]): Totals {
  const bead = new Map<string, number>();
  const holy = new Map<string, number>();
  const shard = new Map<string, number>();
  players.forEach((p) => {
    bead.set(p.name, 0);
    holy.set(p.name, 0);
    shard.set(p.name, 0);
  });
  bosses.forEach((b) => {
    b.beadResults.forEach((n) => bead.set(n, (bead.get(n) ?? 0) + 1));
    b.holyResults.forEach((n) => holy.set(n, (holy.get(n) ?? 0) + 1));
    b.shardResults.forEach((n) => shard.set(n, (shard.get(n) ?? 0) + 1));
  });
  const toArr = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  return { bead: toArr(bead), holy: toArr(holy), shard: toArr(shard) };
}

export function mergeTotals(a: Totals | null, b: Totals, players: Player[]): Totals {
  const bead = new Map<string, number>();
  const holy = new Map<string, number>();
  const shard = new Map<string, number>();
  players.forEach((p) => {
    bead.set(p.name, 0);
    holy.set(p.name, 0);
    shard.set(p.name, 0);
  });
  if (a) {
    a.bead.forEach((x) => bead.set(x.name, (bead.get(x.name) ?? 0) + x.count));
    a.holy.forEach((x) => holy.set(x.name, (holy.get(x.name) ?? 0) + x.count));
    a.shard.forEach((x) => shard.set(x.name, (shard.get(x.name) ?? 0) + x.count));
  }
  b.bead.forEach((x) => bead.set(x.name, (bead.get(x.name) ?? 0) + x.count));
  b.holy.forEach((x) => holy.set(x.name, (holy.get(x.name) ?? 0) + x.count));
  b.shard.forEach((x) => shard.set(x.name, (shard.get(x.name) ?? 0) + x.count));
  const toArr = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  return { bead: toArr(bead), holy: toArr(holy), shard: toArr(shard) };
}

export function formatResultLine(results: string[]): string {
  return results.map((name, i) => `${i + 1}:${name}`).join(' ');
}

export function buildBossCopyText(
  boss: ComputedBoss,
  mode: RollMode,
  enableShard: boolean,
): string {
  const lines: string[] = [];
  if ((mode === 'bead' || mode === 'both') && boss.beadResults.length > 0) {
    lines.push(`${boss.beadResults.length}珠=${formatResultLine(boss.beadResults)}`);
  }
  if ((mode === 'holy' || mode === 'both') && boss.holyResults.length > 0) {
    lines.push(`${boss.holyResults.length}水=${formatResultLine(boss.holyResults)}`);
  }
  if (enableShard && boss.shardResults.length > 0) {
    lines.push(`${boss.shardResults.length}碎片=${formatResultLine(boss.shardResults)}`);
  }
  return lines.join('\n');
}

export function buildBeadOnlyCopyText(boss: ComputedBoss): string {
  if (boss.beadResults.length === 0) return '';
  return `${boss.beadResults.length}珠=${formatResultLine(boss.beadResults)}`;
}

export function buildHolyOnlyCopyText(boss: ComputedBoss): string {
  if (boss.holyResults.length === 0) return '';
  return `${boss.holyResults.length}水=${formatResultLine(boss.holyResults)}`;
}

export function buildShardOnlyCopyText(boss: ComputedBoss): string {
  if (boss.shardResults.length === 0) return '';
  return `${boss.shardResults.length}碎片=${formatResultLine(boss.shardResults)}`;
}

export function buildCopyText(
  bosses: ComputedBoss[],
  mode: RollMode,
  enableShard: boolean,
): string {
  const latest = bosses[bosses.length - 1];
  if (!latest) return '';
  return buildBossCopyText(latest, mode, enableShard);
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function makeHistoryRecord(
  bosses: ComputedBoss[],
  mode: RollMode,
  enableShard: boolean,
): HistoryRecord | null {
  const withResults = bosses.filter(
    (b) => b.beadResults.length > 0 || b.holyResults.length > 0 || b.shardResults.length > 0,
  );
  if (withResults.length === 0) return null;
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    mode,
    bosses: withResults.map((b) => ({
      ...b,
      beadResults: [...b.beadResults],
      holyResults: [...b.holyResults],
      shardResults: [...b.shardResults],
    })),
  };
}

export function reorder<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export function migrateBosses(bosses: Boss[]): Boss[] {
  const result: Boss[] = [];
  let currentRound = 1;
  let countInRound = 0;

  const sorted = [...bosses].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.num - b.num;
  });

  for (const b of sorted) {
    if (countInRound >= 3) {
      currentRound += 1;
      countInRound = 0;
    }
    countInRound += 1;
    result.push({
      ...b,
      round: currentRound,
      num: countInRound,
    });
  }

  return result;
}

export function newPlayer(name: string): Player {
  return { id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name };
}