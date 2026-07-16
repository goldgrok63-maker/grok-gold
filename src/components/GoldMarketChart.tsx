import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Activity, ShieldCheck, Globe } from 'lucide-react';

interface GoldMarketChartProps {
  language: 'id' | 'en';
}

export default function GoldMarketChart({ language }: GoldMarketChartProps) {
  // Starting gold spot price in IDR per gram
  const [goldPrice, setGoldPrice] = useState(1485600);
  const [priceHistory, setPriceHistory] = useState<number[]>([
    1484200, 1484500, 1484100, 1484900, 1485300, 1485100, 1485400, 1485200, 1485600
  ]);
  const [priceChange, setPriceChange] = useState(0.24); // % change
  const [isUp, setIsUp] = useState(true);
  
  // Rotating live activity feed of simulated global miners
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  const activities = [
    { name: '@Hendra_Suryo', action: 'claim', detail: 'Rp 740.000', flag: '🇮🇩', loc: 'Surabaya' },
    { name: '@GoldDigger_99', action: 'buy', detail: '5 Contracts', flag: '🇲🇾', loc: 'Kuala Lumpur' },
    { name: '@Sithole_Mining', action: 'withdraw', detail: 'Rp 1.250.000', flag: '🇿🇦', loc: 'Johannesburg' },
    { name: '@Rand_Excavator', action: 'claim', detail: 'Rp 360.000', flag: '🇬🇭', loc: 'Accra' },
    { name: '@Mega_Gold_ID', action: 'buy', detail: '12 Contracts', flag: '🇮🇩', loc: 'Jakarta' },
    { name: '@Anwar_Gold', action: 'withdraw', detail: 'Rp 4.500.000', flag: '🇸🇬', loc: 'Singapore' },
    { name: '@Amelia_W', action: 'claim', detail: 'Rp 1.800.000', flag: '🇮🇩', loc: 'Bandung' },
    { name: '@Kofi_Mali', action: 'buy', detail: '3 Contracts', flag: '🇲🇱', loc: 'Bamako' },
  ];

  // Price simulator loop (updates every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setGoldPrice(prev => {
        // Dynamic fluctuation between -0.15% to +0.22% (slightly biased upwards to match "Bullish" theme)
        const percentChange = (Math.random() * 0.37 - 0.15) / 100;
        const diff = prev * percentChange;
        const nextPrice = Math.round(prev + diff);
        
        // Record history, keep last 10 points
        setPriceHistory(history => {
          const nextHistory = [...history.slice(1), nextPrice];
          return nextHistory;
        });

        // Update overall daily change indicators
        const initialPrice = 1483000;
        const changeFromStart = ((nextPrice - initialPrice) / initialPrice) * 100;
        setPriceChange(parseFloat(changeFromStart.toFixed(2)));
        setIsUp(changeFromStart >= 0);

        return nextPrice;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Live activity feed loop (rotates every 4.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveActivityIndex(prev => (prev + 1) % activities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activities.length]);

  // Generate SVG path for sparkline chart
  const minVal = Math.min(...priceHistory) * 0.9995;
  const maxVal = Math.max(...priceHistory) * 1.0005;
  const range = maxVal - minVal || 1;
  
  const width = 280;
  const height = 48;
  const points = priceHistory.map((val, i) => {
    const x = (i / (priceHistory.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const activeActivity = activities[activeActivityIndex];

  return (
    <div id="goldMarketChartContainer" className="bg-[#0b051a] border border-gold-primary/15 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gold-primary/10 border border-gold-primary/20 text-gold-primary animate-pulse">
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block">
              {language === 'id' ? 'PASAR EMAS SPOT INTERNASIONAL' : 'INTERNATIONAL SPOT GOLD'}
            </span>
            <span className="text-xs font-black text-white font-orbitron">
              GROCKGOLD INDEX
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-gradient-gold font-orbitron">
            Rp {goldPrice.toLocaleString('id-ID')}/g
          </div>
          <div className={`text-[9px] font-bold flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{priceChange}% (24H)
          </div>
        </div>
      </div>

      {/* Sparkline Graphic */}
      <div className="bg-black/35 rounded-2xl p-3 border border-white/5 relative overflow-hidden flex flex-col justify-end h-20">
        <div className="absolute top-2 left-3 flex gap-4 text-[8px] font-bold text-slate-500 uppercase font-mono">
          <span>HIGH: Rp {Math.max(...priceHistory).toLocaleString('id-ID')}</span>
          <span>LOW: Rp {Math.min(...priceHistory).toLocaleString('id-ID')}</span>
        </div>
        
        {/* SVG Sparkline */}
        <div className="w-full h-12 flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="goldChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area under line */}
            <path d={areaD} fill="url(#goldChartGradient)" />
            {/* Main Sparkline */}
            <path
              d={pathD}
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]"
            />
            {/* Pulse on the latest data point */}
            <circle
              cx={width}
              cy={height - ((priceHistory[priceHistory.length - 1] - minVal) / range) * height}
              r="3.5"
              fill="#facc15"
              className="animate-ping"
              style={{ transformOrigin: 'center' }}
            />
            <circle
              cx={width}
              cy={height - ((priceHistory[priceHistory.length - 1] - minVal) / range) * height}
              r="2.5"
              fill="#d4af37"
            />
          </svg>
        </div>
      </div>

      {/* Ticker Activity Feed */}
      <div className="bg-gradient-to-r from-purple-950/15 to-black/40 border border-purple-900/10 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Activity className="w-3.5 h-3.5 text-gold-primary animate-pulse shrink-0" />
          <div className="text-left overflow-hidden">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
              {language === 'id' ? 'AKTIVITAS LIVE GLOBAL' : 'GLOBAL LIVE BULLETIN'}
            </div>
            
            {/* Dynamic content transition block */}
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-white leading-normal truncate">
              <span className="shrink-0">{activeActivity.flag}</span>
              <span className="text-gold-primary shrink-0">{activeActivity.name}</span>
              <span className="text-slate-300">
                {activeActivity.action === 'claim' && (language === 'id' ? 'baru saja memanen yield' : 'just claimed yield of')}
                {activeActivity.action === 'buy' && (language === 'id' ? 'membeli kontrak baru' : 'purchased new')}
                {activeActivity.action === 'withdraw' && (language === 'id' ? 'menarik saldo tunai' : 'withdrew cash')}
              </span>
              <span className={`font-mono font-black ${
                activeActivity.action === 'buy' ? 'text-amber-400' :
                activeActivity.action === 'withdraw' ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {activeActivity.detail}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[8px] bg-purple-900/40 border border-purple-500/25 text-gold-primary px-2 py-1 rounded-lg uppercase font-black shrink-0 font-mono">
          <Globe className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>{activeActivity.loc}</span>
        </div>
      </div>

      {/* Telemetry quick status metrics */}
      <div className="grid grid-cols-3 gap-1.5 text-[8px] font-bold text-center">
        <div className="py-1.5 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-center">
          <span className="text-slate-500 uppercase leading-none mb-1">{language === 'id' ? 'TREN PASAR' : 'MARKET BIAS'}</span>
          <span className="text-emerald-400 font-extrabold uppercase">BULLISH</span>
        </div>
        <div className="py-1.5 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-center">
          <span className="text-slate-500 uppercase leading-none mb-1">SPREAD</span>
          <span className="text-white font-mono font-black">0.015%</span>
        </div>
        <div className="py-1.5 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-center">
          <span className="text-slate-500 uppercase leading-none mb-1">LIQUIDITY</span>
          <span className="text-gold-primary font-black uppercase flex items-center justify-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-gold-primary shrink-0" />
            SECURED
          </span>
        </div>
      </div>
    </div>
  );
}
