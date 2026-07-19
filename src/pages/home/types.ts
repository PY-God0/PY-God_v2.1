export interface Player {
  id: string;
  name: string;
}

export interface Boss {
  id: string;
  round: number;
  num: number;
  beadCount: number;
  holyCount: number;
  shardCount: number;
}

export interface ComputedBoss extends Boss {
  beadResults: string[];
  holyResults: string[];
  shardResults: string[];
}

export type RollMode = 'bead' | 'holy' | 'both';

export interface TotalEntry {
  name: string;
  count: number;
}

export interface Totals {
  bead: TotalEntry[];
  holy: TotalEntry[];
  shard: TotalEntry[];
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  mode: RollMode;
  bosses: ComputedBoss[];
}

export interface AppState {
  players: Player[];
  mode: RollMode;
  bosses: Boss[];
  beadPointer: number;
  holyPointer: number;
  shardPointer: number;
  enableShard: boolean;
  enableTransfer: boolean;
  transferMap: Record<string, string>;
  accumulatedTotals: Totals | null;
  history: HistoryRecord[];
}