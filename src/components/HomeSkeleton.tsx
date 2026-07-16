import React from 'react';

export default function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 1. WELCOME TICKER SKELETON */}
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0b0c10] border border-[#1b1c24] rounded-xl p-3 flex items-center gap-3 h-[64px]">
            <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-2 w-16 bg-white/5 rounded" />
              <div className="h-3.5 w-12 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. MASTER BALANCE CARD SKELETON */}
      <div className="relative bg-gradient-to-br from-[#1b0b3a] via-[#09041a] to-[#03010c] border border-gold-primary/20 rounded-3xl p-5 shadow-2xl overflow-hidden">
        <div className="bg-black/45 border border-purple-500/10 rounded-2xl p-4.5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="h-2.5 w-24 bg-white/10 rounded" />
            <div className="h-4 w-4 bg-white/5 rounded-full" />
          </div>
          <div className="h-7 w-48 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 rounded-lg mb-4" />
          <div className="h-6 bg-white/5 rounded mb-3" />
          
          <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
            <div className="bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/5 h-[62px] space-y-1.5">
              <div className="h-2 w-12 bg-white/5 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
            <div className="bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/5 h-[62px] space-y-1.5">
              <div className="h-2 w-12 bg-white/5 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
          </div>
        </div>

        {/* 3. VIP / REWARDS HARVEST TRACKER SKELETON */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1203] via-[#09041a] to-[#03010b] border border-amber-500/20 rounded-3xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-amber-500/10 rounded-full" />
              <div className="h-6 w-24 bg-amber-500/20 rounded-lg" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/5" />
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="h-2.5 w-full bg-white/5 rounded" />
            <div className="h-2.5 w-4/5 bg-white/5 rounded" />
          </div>
          <div className="bg-black/55 border border-amber-500/10 rounded-2xl p-3 mb-4.5 h-[52px]" />
          <div className="space-y-1.5 mb-4.5">
            <div className="flex justify-between">
              <div className="h-2 w-28 bg-white/5 rounded" />
              <div className="h-2.5 w-10 bg-white/10 rounded" />
            </div>
            <div className="h-3 bg-white/5 rounded-full" />
          </div>
          <div className="h-[44px] bg-amber-500/15 rounded-2xl border border-amber-500/20" />
        </div>

        {/* 4. QUICK MENU GRID SKELETON */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-[#291754]/20">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 h-[76px] space-y-2">
              <div className="flex justify-between items-center">
                <div className="w-7 h-7 rounded-lg bg-white/5" />
                <div className="w-2.5 h-2.5 bg-white/5 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-white/10 rounded" />
                <div className="h-1.5 w-20 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CAPPING PROGRESS PANEL SKELETON */}
      <div className="bg-[#0b051a] border border-purple-500/10 rounded-3xl p-5 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-3.5 w-24 bg-white/10 rounded" />
            <div className="h-2 w-20 bg-white/5 rounded" />
          </div>
          <div className="h-5 w-20 bg-white/5 rounded-xl" />
        </div>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-4/5 bg-white/5 rounded" />
            <div className="h-3 w-3/4 bg-white/5 rounded" />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex justify-between">
            <div className="h-2 w-16 bg-white/5 rounded" />
            <div className="h-2 w-16 bg-white/5 rounded" />
          </div>
          <div className="h-1.5 bg-white/5 rounded-full" />
          <div className="h-[44px] bg-white/5 rounded-xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}
