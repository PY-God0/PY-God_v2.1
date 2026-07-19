import { useRef, useState, useEffect } from 'react';
import type { Player } from '../types';
import { newPlayer, reorder } from '../utils';

interface Props {
  players: Player[];
  enableTransfer: boolean;
  transferMap: Record<string, string>;
  onChange: (players: Player[]) => void;
  onTransferToggle: (v: boolean) => void;
  onSetTransfer: (from: string, to: string) => void;
  onRemoveTransfer: (from: string) => void;
}

export default function PlayerList({
  players,
  enableTransfer,
  transferMap,
  onChange,
  onTransferToggle,
  onSetTransfer,
  onRemoveTransfer,
}: Props) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [transferMenuOpen, setTransferMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const editInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Close menu on outside click
  useEffect(() => {
    if (!transferMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTransferMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [transferMenuOpen]);

  const addPlayer = () => {
    const name = `玩家${players.length + 1}`;
    onChange([...players, newPlayer(name)]);
    setEditMenuOpen(false);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 1) return;
    onChange(players.filter((p) => p.id !== id));
  };

  const handleNameChange = (id: string, name: string) => {
    onChange(players.map((p) => (p.id === id ? { ...p, name: name.slice(0, 16) } : p)));
  };

  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from === null || from === index) return;
    onChange(reorder(players, from, index));
  };

  const toggleEditMenu = () => {
    setEditMenuOpen((v) => !v);
    setDeleteMode(false);
  };

  const toggleDeleteMode = () => {
    setDeleteMode((v) => !v);
  };

  const transferEntries = Object.entries(transferMap);

  return (
    <div className="bg-background-100 rounded-xl border border-background-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-900/40 text-primary-400 flex items-center justify-center">
            <i className="ri-team-line text-lg"></i>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground-900">玩家名單</h2>
            <p className="text-xs text-foreground-500">拖曳可改變順序，點擊編輯按鈕修改名字</p>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5 mb-3">
        {players.map((p, idx) => {
          const isDragOver = dragOverIndex === idx;
          const transferTarget = transferMap[p.name];
          const isTransferOpen = transferMenuOpen === p.id;
          const isInputMode = editMenuOpen && !deleteMode;
          const availableTargets = players.filter(
            (other) => other.name !== p.name,
          );

          return (
            <li
              key={p.id}
              draggable={!editMenuOpen}
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDrop={onDrop(idx)}
              onDragEnd={() => {
                dragIndexRef.current = null;
                setDragOverIndex(null);
              }}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-md border transition select-none ${
                isDragOver
                  ? 'border-primary-500 bg-primary-950/30'
                  : deleteMode
                    ? 'border-rose-800/50 bg-rose-950/20'
                    : isInputMode
                      ? 'border-accent-600/40 bg-background-100'
                      : transferTarget
                        ? 'border-rose-700/50 bg-rose-950/20'
                        : 'border-background-200 bg-background-100 hover:bg-background-200 hover:border-background-300'
              }`}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-md bg-background-200 border border-background-300 text-xs font-medium text-foreground-600">
                {idx + 1}
              </span>
              {isInputMode ? (
                <input
                  ref={(el) => { editInputRefs.current[p.id] = el; }}
                  value={p.name}
                  onChange={(e) => handleNameChange(p.id, e.target.value)}
                  className="flex-1 min-w-0 px-1.5 py-0 text-sm bg-background-100 border border-accent-500 rounded outline-none focus:ring-2 focus:ring-accent-400 text-foreground-950 leading-normal"
                />
              ) : (
                <span className="flex-1 min-w-0 text-sm text-foreground-900 truncate">
                  {p.name}
                  {transferTarget && (
                    <span className="ml-1.5 text-sm text-rose-400">
                      <i className="ri-arrow-right-line"></i> {transferTarget}
                    </span>
                  )}
                </span>
              )}

              {/* Transfer button — only visible when transfer mode is on */}
              {enableTransfer && !editMenuOpen && (
                <div className="relative" ref={isTransferOpen ? menuRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setTransferMenuOpen(isTransferOpen ? null : p.id)}
                    title={transferTarget ? `轉讓給 ${transferTarget}` : '設定轉讓'}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition ${
                      transferTarget
                        ? 'text-rose-400 bg-rose-950/30 hover:bg-rose-900/50'
                        : 'text-foreground-500 hover:text-rose-400 hover:bg-rose-950/20'
                    }`}
                  >
                    <i className={transferTarget ? 'ri-share-forward-fill' : 'ri-share-forward-line'}></i>
                  </button>

                  {isTransferOpen && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-background-100 border border-background-300 rounded-lg shadow-lg py-1 overflow-hidden">
                      <div className="px-2 py-1 text-[11px] text-foreground-500 font-medium border-b border-background-200">
                        選擇接收者
                      </div>
                      {availableTargets.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => {
                            onSetTransfer(p.name, target.name);
                            setTransferMenuOpen(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-background-200 transition whitespace-nowrap ${
                            transferTarget === target.name
                              ? 'text-rose-400 font-semibold'
                              : 'text-foreground-800'
                          }`}
                        >
                          {transferTarget === target.name && (
                            <i className="ri-check-line mr-1"></i>
                          )}
                          {target.name}
                        </button>
                      ))}
                      {transferTarget && (
                        <>
                          <div className="border-t border-background-200 my-0.5"></div>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveTransfer(p.name);
                              setTransferMenuOpen(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/20 transition whitespace-nowrap"
                          >
                            <i className="ri-close-line mr-1"></i>
                            取消轉讓
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delete button — only visible in delete mode */}
              {deleteMode && (
                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 1}
                  title="刪除"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-rose-400 hover:text-white hover:bg-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Edit Members button */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleEditMenu}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed transition whitespace-nowrap ${
            editMenuOpen
              ? 'border-primary-500 text-primary-400 bg-primary-950/20'
              : 'border-background-300 text-foreground-500 hover:border-primary-500 hover:text-primary-400 hover:bg-primary-950/20'
          }`}
        >
          <i className="ri-edit-line"></i>
          編輯成員
        </button>

        {/* Sub-menu buttons — always rendered to prevent layout shift */}
        <div
          className={`mt-2 flex gap-2 overflow-hidden transition-all duration-200 ${
            editMenuOpen ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <button
            type="button"
            onClick={addPlayer}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-accent-700/40 text-accent-400 hover:bg-accent-950/20 transition whitespace-nowrap text-xs"
          >
            <i className="ri-user-add-line text-sm"></i>
            增加成員
          </button>
          <button
            type="button"
            onClick={toggleDeleteMode}
            className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-xs transition whitespace-nowrap ${
              deleteMode
                ? 'border-rose-500 text-white bg-rose-600'
                : 'border-rose-700/40 text-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <i className={deleteMode ? 'ri-close-circle-fill text-sm' : 'ri-close-circle-line text-sm'}></i>
            刪除成員
          </button>
        </div>
      </div>

      {/* Transfer mode toggle — moved here from ModeSelector */}
      <div className="mt-3 pt-3 border-t border-background-200">
        <button
          type="button"
          onClick={() => onTransferToggle(!enableTransfer)}
          className="w-full flex items-center justify-between py-2 px-3 rounded-lg transition"
        >
          <span className="flex items-center gap-2 text-sm text-foreground-700">
            <div className="w-7 h-7 rounded-md bg-rose-950/40 flex items-center justify-center">
              <i className="ri-share-forward-line text-rose-400 text-base"></i>
            </div>
            轉讓模式
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full transition ${enableTransfer ? 'bg-rose-500 text-white' : 'bg-background-300 text-foreground-500'}`}>
            {enableTransfer ? '啟用' : '關閉'}
          </span>
        </button>
        {enableTransfer && transferEntries.length === 0 && (
          <p className="mt-1 px-3 text-[11px] text-foreground-500">
            點擊玩家旁的箭頭按鈕設定轉讓對象
          </p>
        )}
        {enableTransfer && transferEntries.length > 0 && (
          <div className="mt-2 px-3 flex flex-wrap gap-1.5">
            {transferEntries.map(([from, to]) => (
              <span
                key={from}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-rose-950/30 border border-rose-700/50 text-rose-300"
              >
                <span className="line-through text-rose-400/60">{from}</span>
                <i className="ri-arrow-right-line text-[10px]"></i>
                <span className="font-medium">{to}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}