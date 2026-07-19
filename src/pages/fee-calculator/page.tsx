import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/feature/Header';

interface Discount {
  id: string;
  label: string;
  desc: string;
  rate: number;
  priceKw: string;
}

const DEFAULT_DISCOUNTS: Discount[] = [
  { id: '30', label: '30% 折扣券', desc: '手續費減免30%', rate: 0.3, priceKw: '1.69' },
  { id: '50', label: '50% 折扣券', desc: '手續費減免50%', rate: 0.5, priceKw: '2.6' },
  { id: '100', label: '100% 折扣券', desc: '手續費全免', rate: 1, priceKw: '5.99' },
];

const DEFAULT_COUPON_PRICES: Record<string, string> = {
  '30': '1.69',
  '50': '2.6',
  '100': '5.99',
};

function eToKw(e: number): number {
  return e * 10;
}

function kwToE(kw: number): number {
  return kw / 10;
}

function trimDecimal(num: number, maxDecimals: number = 2): string {
  const str = num.toFixed(maxDecimals);
  return str.replace(/\.?0+$/, '');
}

function formatValue(val: number): string {
  const kw = eToKw(val);
  if (Math.abs(kw) >= 1) {
    return `${trimDecimal(kw, 2)}kw`;
  }
  return `${trimDecimal(val, 2)}E`;
}

function formatE(val: number): string {
  return `${trimDecimal(val, 2)}E`;
}

export default function FeeCalculator() {
  const [sellPrice, setSellPrice] = useState<string>('0');
  const [vipEnabled, setVipEnabled] = useState(false);
  const [couponPrices, setCouponPrices] = useState<Record<string, string>>({ '30': '0', '50': '0', '100': '0' });

  const numericSellPrice = useMemo(() => {
    const v = parseFloat(sellPrice);
    return isNaN(v) || v <= 0 ? 0 : v;
  }, [sellPrice]);

  const effectiveRate = useMemo(() => {
    if (vipEnabled) return 4;
    return 5;
  }, [vipEnabled]);

  const baseFee = useMemo(() => {
    if (numericSellPrice <= 0) return 0;
    return (numericSellPrice * effectiveRate) / 100;
  }, [numericSellPrice, effectiveRate]);

  const incomeWithoutCoupon = useMemo(() => {
    return numericSellPrice - baseFee;
  }, [numericSellPrice, baseFee]);

  const results = useMemo(() => {
    if (numericSellPrice <= 0) return null;
    const baseFeeKw = eToKw(baseFee);

    return DEFAULT_DISCOUNTS.map((d) => {
      const couponPriceKw = parseFloat(couponPrices[d.id]) || 0;
      const feeReductionKw = baseFeeKw * d.rate;
      const netProfitKw = feeReductionKw - couponPriceKw;
      const finalIncome = incomeWithoutCoupon + kwToE(feeReductionKw) - kwToE(couponPriceKw);
      return {
        ...d,
        couponPriceKw,
        feeReductionKw,
        netProfitKw,
        finalIncome,
      };
    });
  }, [numericSellPrice, baseFee, incomeWithoutCoupon, couponPrices]);

  const bestResult = useMemo(() => {
    if (!results || results.length === 0) return null;
    return results.reduce((best, cur) => (cur.netProfitKw > best.netProfitKw ? cur : best), results[0]);
  }, [results]);

  const handleSellPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setSellPrice(v);
  }, []);

  const handleCouponPriceChange = useCallback((id: string, value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCouponPrices((prev) => ({ ...prev, [id]: value }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setSellPrice('36');
    setVipEnabled(false);
    setCouponPrices({ ...DEFAULT_COUPON_PRICES });
  }, []);

  return (
    <div className="min-h-screen bg-background-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground-950 mb-1.5">Mabi拍賣手續費計算器</h1>
          <p className="text-xs text-foreground-500">
            優化您的折扣券使用策略，最大化收益。輸入售價、手續費率、折扣券價格即可自動推薦最優方案。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: Settings */}
          <div className="lg:col-span-2">
            <div className="bg-background-100 rounded-xl border border-background-200 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-foreground-950 flex items-center gap-2">
                <i className="ri-settings-3-line text-primary-400"></i>
                基本設置
              </h2>

              {/* Sell Price */}
              <div>
                <label className="block text-xs font-medium text-foreground-600 mb-1">售出價格 (E)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={sellPrice}
                    onChange={handleSellPriceChange}
                    className="w-full bg-background-200 border border-background-300 rounded-lg px-3 py-2 text-sm font-semibold text-foreground-950 placeholder:text-foreground-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-foreground-400">E</span>
                </div>
              </div>

              {/* VIP Toggle */}
              <div
                className={`border rounded-lg p-2.5 flex items-center justify-between transition-colors ${
                  vipEnabled
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-background-200/50 border-background-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      vipEnabled ? 'bg-primary-500 text-white' : 'bg-primary-500/20 text-primary-400'
                    }`}
                  >
                    <i className="ri-vip-crown-line text-xs"></i>
                  </div>
                  <div>
                    <div
                      className={`text-xs font-medium transition-colors ${
                        vipEnabled ? 'text-primary-400' : 'text-foreground-600'
                      }`}
                    >
                      VIP 服務
                    </div>
                    <div className="text-[10px] text-foreground-400">{vipEnabled ? '手續費 4%' : '手續費 5%'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVipEnabled((v) => !v)}
                  className={`relative w-10 h-5 rounded-full transition-all ${
                    vipEnabled
                      ? 'bg-primary-500 shadow-[0_0_8px_var(--primary-500)]'
                      : 'bg-background-400'
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white transition-all ${
                      vipEnabled ? 'shadow-[0_0_4px_rgba(255,255,255,0.6)]' : ''
                    }`}
                    style={{ left: vipEnabled ? 'calc(100% - 1.05rem)' : '3px' }}
                  ></div>
                </button>
              </div>

              {/* Coupon Prices */}
              <div>
                <h3 className="text-xs font-medium text-foreground-600 mb-2 flex items-center gap-1.5">
                  <i className="ri-coupon-line text-accent-400"></i>
                  折扣券價格 (kw)
                </h3>
                <div className="space-y-2.5">
                  {DEFAULT_DISCOUNTS.map((d) => (
                    <div key={d.id}>
                      <label className="block text-[11px] text-foreground-500 mb-0.5">
                        {d.label}（{d.desc}）
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={couponPrices[d.id]}
                          onChange={(e) => handleCouponPriceChange(d.id, e.target.value)}
                          className="w-full bg-background-200 border border-background-300 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground-950 placeholder:text-foreground-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-foreground-400">kw</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Base Calculation */}
            <div className="bg-background-100 rounded-xl border border-background-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground-950 flex items-center gap-1.5">
                  <i className="ri-calculator-line text-primary-400"></i>
                  基本計算
                </h2>
                <span className="text-[11px] text-foreground-500">
                  {numericSellPrice > 0 ? `${formatE(numericSellPrice)} × ${effectiveRate}%` : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-background-200/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-foreground-500">原始手續費</span>
                    <i className="ri-percent-line text-[10px] text-foreground-400"></i>
                  </div>
                  <div className="text-lg font-bold text-foreground-950">{formatE(baseFee)}</div>
                </div>
                <div className="bg-background-200/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-foreground-500">不用折扣券收入</span>
                    <i className="ri-wallet-3-line text-[10px] text-foreground-400"></i>
                  </div>
                  <div className="text-lg font-bold text-foreground-950">{formatE(incomeWithoutCoupon)}</div>
                  <div className="text-[11px] text-foreground-500 mt-0.5">售價 - 手續費</div>
                </div>
              </div>
            </div>

            {/* Coupon Comparison */}
            <div className="bg-background-100 rounded-xl border border-background-200 p-4">
              <h2 className="text-sm font-semibold text-foreground-950 flex items-center gap-1.5 mb-3">
                <i className="ri-coupon-line text-accent-400"></i>
                折扣券對比
              </h2>
              <div className="space-y-2.5">
                {results?.map((r) => (
                  <div
                    key={r.id}
                    className={`bg-background-200/50 border rounded-lg p-3 transition ${
                      bestResult?.id === r.id
                        ? 'border-primary-500/40 ring-1 ring-primary-500/20'
                        : 'border-background-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {bestResult?.id === r.id && (
                          <span className="px-1 py-[1px] rounded text-[10px] font-medium bg-primary-500 text-white leading-none">
                            推薦
                          </span>
                        )}
                        <span className="text-primary-400 font-semibold text-sm">{r.label}</span>
                      </div>
                      <div className="text-sm font-bold px-2 py-0.5 rounded bg-primary-500/10 text-primary-400">
                        {r.netProfitKw >= 0 ? '+' : ''}
                        {r.netProfitKw >= 10 ? formatE(kwToE(r.netProfitKw)) : `${trimDecimal(r.netProfitKw, 2)}kw`}
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground-500 mb-2">券價：{r.couponPriceKw}kw</div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-foreground-500 mb-0.5">手續費減少</div>
                        <div className="text-sm font-medium text-foreground-700">
                          {r.feeReductionKw >= 10 ? formatE(kwToE(r.feeReductionKw)) : `${trimDecimal(r.feeReductionKw, 2)}kw`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-foreground-500 mb-0.5">最終收入</div>
                        <div className="text-sm font-semibold text-foreground-950">{formatE(r.finalIncome)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Strategy */}
            {bestResult && (
              <div className="bg-background-100 rounded-xl border border-background-200 p-4">
                <h2 className="text-sm font-semibold text-foreground-950 flex items-center gap-1.5 mb-3">
                  <i className="ri-trophy-line text-amber-400"></i>
                  最佳策略
                </h2>
                <div className="bg-background-200/50 border border-primary-500/30 rounded-lg p-3 mb-3">
                  <div className="text-[11px] text-foreground-500 mb-1">推薦方案</div>
                  <div className="text-primary-400 font-semibold text-sm mb-2">{bestResult.label}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] text-foreground-500 mb-0.5">最終收入</div>
                      <div className="text-base font-bold text-foreground-950">{formatE(bestResult.finalIncome)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-foreground-500 mb-0.5">淨獲利</div>
                      <div className="text-base font-bold text-primary-400">
                        {bestResult.netProfitKw >= 0 ? '+' : ''}
                        {bestResult.netProfitKw >= 10 ? formatE(kwToE(bestResult.netProfitKw)) : `${trimDecimal(bestResult.netProfitKw, 2)}kw`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-[11px] text-foreground-500 space-y-0.5">
          <p>單位轉換規則：1E = 1 億 | 1kw = 1000 萬 | 1w = 1 萬</p>
          <p>© 2026 PY之神 - Mabi拍賣手續費計算器</p>
          <p>製作者 - 貓科絕對時間</p>
        </footer>
      </main>
    </div>
  );
}