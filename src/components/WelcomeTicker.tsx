import React from 'react';
import { Users, Globe, Tractor, Shield } from 'lucide-react';

interface WelcomeTickerProps {
  memberCount: number;
  isIndonesian: boolean;
}

export default function WelcomeTicker({ memberCount, isIndonesian }: WelcomeTickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* CARD 1: GLOBAL COMMUNITY */}
      <div className="bg-[#0b0c10] border border-[#1b1c24] rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-yellow-400/20 transition duration-300">
        {/* Grey-blue Icon */}
        <Users className="w-6.5 h-6.5 text-[#475569] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[7.5px] font-bold text-[#475569] tracking-wider uppercase leading-none mb-1">
            GLOBAL COMMUNITY
          </div>
          <div className="text-[12px] font-bold text-white leading-tight font-sans">
            128,540+
          </div>
          <div className="text-[8px] text-[#475569] font-semibold leading-none mt-1">
            Members
          </div>
        </div>
      </div>

      {/* CARD 2: MINING SITES */}
      <div className="bg-[#0b0c10] border border-[#1b1c24] rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-yellow-400/20 transition duration-300">
        {/* Grey-blue Icon */}
        <Globe className="w-6.5 h-6.5 text-[#475569] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[7.5px] font-bold text-[#475569] tracking-wider uppercase leading-none mb-1">
            MINING SITES
          </div>
          <div className="text-[12px] font-bold text-white leading-tight font-sans">
            4 Countries
          </div>
        </div>
      </div>

      {/* CARD 3: TOTAL FLEET */}
      <div className="bg-[#0b0c10] border border-[#1b1c24] rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-yellow-400/20 transition duration-300">
        {/* Grey-blue Icon (Tractor with big tread wheels matching image perfectly) */}
        <Tractor className="w-6.5 h-6.5 text-[#475569] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[7.5px] font-bold text-[#475569] tracking-wider uppercase leading-none mb-1">
            TOTAL FLEET
          </div>
          <div className="text-[12px] font-bold text-white leading-tight font-sans flex items-baseline gap-0.5">
            1,000+ <span className="text-[9px] text-[#475569] font-semibold">Units</span>
          </div>
        </div>
      </div>

      {/* CARD 4: SECURE & TRANSPARENT */}
      <div className="bg-[#0b0c10] border border-[#1b1c24] rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-yellow-400/20 transition duration-300">
        {/* Solid Orange-Yellow Icon with bright drop shadow matching image */}
        <Shield className="w-6.5 h-6.5 text-[#f59e0b] filter drop-shadow-[0_0_6px_rgba(245,158,11,0.6)] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[7px] font-extrabold text-[#f97316] tracking-wider uppercase leading-none mb-1">
            SECURE & TRANSPARENT
          </div>
          <div className="text-[11px] font-bold text-white leading-tight font-sans">
            Advanced System Monitoring
          </div>
        </div>
      </div>
    </div>
  );
}
