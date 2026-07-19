import type { RollMode } from '../types';

interface Props {
  mode: RollMode;
  enableShard: boolean;
  onModeChange: (mode: RollMode) => void;
  onShardToggle: (v: boolean) => void;
}

const OPTIONS: { key: RollMode; label: string; icon: string; customImg?: string; customImg2?: string }[] = [
  { key: 'both', label: '珠子 + 聖水', icon: 'ri-shining-2-line', customImg: 'https://static.readdy.ai/image/89724625b6278e5f6dc53214dbe45c52/62734b7b4a38772352d755938ef364e1.png', customImg2: 'https://public.readdy.ai/ai/img_res/8b6bbfd3-e4a9-4ace-b77c-986532e0692f.png' },
  { key: 'bead', label: '只輪珠子', icon: 'ri-bubble-chart-line', customImg: 'https://static.readdy.ai/image/89724625b6278e5f6dc53214dbe45c52/62734b7b4a38772352d755938ef364e1.png' },
  { key: 'holy', label: '只輪聖水', icon: 'ri-drop-line', customImg: 'https://public.readdy.ai/ai/img_res/8b6bbfd3-e4a9-4ace-b77c-986532e0692f.png' },
];

export default function ModeSelector({ mode, enableShard, onModeChange, onShardToggle }: Props) {
  return (
    <div className="bg-background-100 rounded-xl border border-background-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-900/40 text-primary-400 flex items-center justify-center">
          <i className="ri-list-check-2 text-lg"></i>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground-900">輪派項目</h2>
          <p className="text-xs text-foreground-500">選擇要計算的項目（可同時計算）</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const active = mode === opt.key;
          return (
            <button
              type="button"
              key={opt.key}
              onClick={() => onModeChange(opt.key)}
              className={`whitespace-nowrap flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-xs font-medium transition ${
                active
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-background-100 border-background-300 text-foreground-600 hover:border-foreground-600 hover:text-foreground-900'
              }`}
            >
              {opt.customImg2 ? (
                <div className="flex items-center gap-0.5">
                  <img src={opt.customImg} alt="" className="w-5 h-5 object-contain" />
                  <img src={opt.customImg2} alt="" className="w-5 h-5 object-contain" />
                </div>
              ) : opt.customImg ? (
                <img src={opt.customImg} alt="" className="w-7 h-7 object-contain" />
              ) : (
                <i className={`${opt.icon} text-base`}></i>
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Shard Toggle */}
      <div className="mt-3 pt-3 border-t border-background-200">
        <button
          type="button"
          onClick={() => onShardToggle(!enableShard)}
          className="w-full flex items-center justify-between py-2 px-3 rounded-lg transition"
        >
          <span className="flex items-center gap-2 text-sm text-foreground-700">
            <div className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden">
              <img src="https://public.readdy.ai/ai/img_res/a7137356-af6e-46c2-903c-8e51caaef416.png" alt="" className="w-7 h-7 object-contain mix-blend-screen" />
            </div>
            裂痕的碎片
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full transition ${enableShard ? 'bg-amber-500 text-white' : 'bg-background-300 text-foreground-500'}`}>
            {enableShard ? '啟用' : '關閉'}
          </span>
        </button>
      </div>
    </div>
  );
}