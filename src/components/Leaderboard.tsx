import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Trophy,
  Users,
  Wallet,
  Cpu,
  Gem,
  Coins
} from 'lucide-react';
import { UserAccount, AppState, CONFIG } from '../types';

interface LeaderboardProps {
  accounts: UserAccount[];
  state: AppState;
  currentAccount: UserAccount | null;
  language: 'id' | 'en';
  setCurrentTab: (tab: string) => void;
}

export default function Leaderboard({
  accounts,
  state,
  currentAccount,
  language,
  setCurrentTab
}: LeaderboardProps) {
  const [leaderboardFilter, setLeaderboardFilter] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'investor' | 'referral' | 'contract' | 'profit'>('investor');
  const [expandedLeaderboardUser, setExpandedLeaderboardUser] = useState<string | null>(null);

  // Real dynamic sorting & scoring using database accounts
  const processedLeaderboard = useMemo(() => {
    // Start with real registered users (exclude 'admin')
    const filteredAccounts = accounts.filter(u => u.username.toLowerCase() !== 'admin');

    const isWeekly = leaderboardFilter === 'weekly';
    const isMonthly = leaderboardFilter === 'monthly';
    const periodFactor = isWeekly ? 0.3 : isMonthly ? 0.7 : 1.0;

    const mapped = filteredAccounts.map(u => {
      const isSelf = currentAccount && u.username.toLowerCase() === currentAccount.username.toLowerCase();
      const activeState = isSelf ? state : u.state;

      // Calculate downlines dynamically for real users
      const l1 = accounts.filter(
        acc => acc.invitedBy && acc.invitedBy.toLowerCase() === u.username.toLowerCase()
      );
      const l1Usernames = l1.map(acc => acc.username.toLowerCase());
      const l2 = accounts.filter(
        acc => acc.invitedBy && l1Usernames.includes(acc.invitedBy.toLowerCase())
      );
      const l2Usernames = l2.map(acc => acc.invitedBy.toLowerCase());
      const l3 = accounts.filter(
        acc => acc.invitedBy && l2Usernames.includes(acc.invitedBy.toLowerCase())
      );

      const totalMembers = l1.length + l2.length + l3.length;
      const totalCommissionEarned = (activeState?.referralEarned || 0) + (activeState?.rebateEarned || 0);
      const activeContracts = activeState?.activeContracts || 0;
      const totalEarned = activeState?.totalEarned || 0;
      const goldAllTime = activeState?.goldProduction || 0;
      const goldWeekly = activeState?.goldProductionWeekly || 0;
      const goldMonthly = activeState?.goldProductionMonthly || 0;

      let score = 0;
      let displayStr = '';

      if (leaderboardCategory === 'investor') {
        const value = activeContracts * CONFIG.PRICE_PER_UNIT * periodFactor;
        score = value;
        displayStr = `Rp ${Math.round(value).toLocaleString('id-ID')}`;
      } else if (leaderboardCategory === 'referral') {
        const count = Math.max(0, Math.round(totalMembers * periodFactor));
        score = count;
        displayStr = `${count} ${language === 'id' ? 'Mitra' : 'Partners'}`;
      } else if (leaderboardCategory === 'contract') {
        const units = Math.max(0, Math.round(activeContracts * periodFactor));
        score = units;
        displayStr = `${units} Unit`;
      } else { // 'profit'
        const goldVal = isWeekly ? goldWeekly : isMonthly ? goldMonthly : goldAllTime;
        score = goldVal;
        displayStr = `${goldVal.toFixed(4)} GLD`;
      }

      const vipLevel = activeContracts >= 50 ? 5 :
                       activeContracts >= 25 ? 4 :
                       activeContracts >= 10 ? 3 :
                       activeContracts >= 5 ? 2 :
                       activeContracts >= 1 ? 1 : 0;

      return {
        username: u.username,
        fullName: u.fullName,
        vipLevel,
        profileImage: activeState?.profileImage || null,
        createdAt: u.createdAt || Date.now(),
        score,
        displayStr,
        activeContracts,
        totalMembers,
        totalCommissionEarned,
        totalEarned
      };
    });

    // Sort descending by score, tie-breaker: older account gets higher rank
    return mapped.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.createdAt - b.createdAt;
    });
  }, [accounts, state, currentAccount, leaderboardFilter, leaderboardCategory, language]);

  return (
    <div className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-purple-500/10 pb-3">
        <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
        <h2 className="text-xs font-black tracking-widest text-white uppercase bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 bg-clip-text text-transparent font-orbitron flex items-center gap-1.5">
          <Trophy className="w-4.5 h-4.5 text-yellow-400" />
          {language === 'id' ? 'LEADERBOARD PERINGKAT' : 'GLOBAL LEADERBOARD'}
        </h2>
      </div>

      {/* Timeframe Selectors */}
      <div className="flex bg-black/45 border border-white/5 p-1 rounded-2xl gap-1">
        {(['weekly', 'monthly', 'alltime'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setLeaderboardFilter(filter)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${leaderboardFilter === filter ? 'bg-gradient-to-r from-yellow-300 to-gold-primary text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            {filter === 'weekly' ? (language === 'id' ? 'Mingguan' : 'Weekly') : filter === 'monthly' ? (language === 'id' ? 'Bulanan' : 'Monthly') : (language === 'id' ? 'Semua' : 'All Time')}
          </button>
        ))}
      </div>

      {/* Category Selectors */}
      <div className="grid grid-cols-4 gap-1">
        {(['investor', 'referral', 'contract', 'profit'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setLeaderboardCategory(cat)}
            className={`py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wide border transition cursor-pointer ${leaderboardCategory === cat ? 'bg-[#ffc107]/10 text-yellow-400 border-yellow-500/35 shadow-sm shadow-yellow-500/5' : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            {cat === 'investor' ? 'Investor' : cat === 'referral' ? 'Referral' : cat === 'contract' ? 'Contract' : 'Profit'}
          </button>
        ))}
      </div>

      {/* Content Section */}
      {processedLeaderboard.length === 0 ? (
        <div className="py-12 bg-gradient-to-b from-[#0f0620] to-[#080312] border border-purple-500/15 rounded-3xl text-center text-xs text-slate-500 font-medium">
          {language === 'id' ? 'Belum ada data leaderboard' : 'No leaderboard data available yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Podium Top 3 - Columns are fully dynamic based on existing real database accounts */}
          <div className={`grid ${processedLeaderboard.length === 1 ? 'grid-cols-1 max-w-[200px] mx-auto' : processedLeaderboard.length === 2 ? 'grid-cols-2 max-w-sm mx-auto' : 'grid-cols-3'} gap-2.5 pt-4 pb-1 items-end text-center relative`}>
            {/* Rank 2 (Left) - Rendered only if there is a second real user */}
            {processedLeaderboard.length >= 2 && processedLeaderboard[1] && (
              <div className="p-3 rounded-2xl border bg-slate-300/5 border-slate-400/20 shadow-[0_0_20px_rgba(203,213,225,0.04)] flex flex-col justify-end min-h-[140px] relative overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-400/10 border border-slate-400/30 flex items-center justify-center font-extrabold text-[11px] text-slate-300">2</div>
                <div className="text-[10px] font-black text-white truncate mb-0.5">@{processedLeaderboard[1].username}</div>
                <div className="text-[7.5px] text-slate-400 truncate mb-2">{processedLeaderboard[1].fullName}</div>
                <div className="text-[9px] font-mono font-black text-slate-300 truncate leading-none">{processedLeaderboard[1].displayStr}</div>
              </div>
            )}

            {/* Rank 1 (Center) - Rendered if there is a first real user */}
            {processedLeaderboard[0] && (
              <div className="p-3.5 rounded-2xl border bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)] scale-105 z-10 ring-1 ring-yellow-500/15 flex flex-col justify-end min-h-[165px] relative overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center font-black text-[14px] text-yellow-400 animate-bounce">👑</div>
                <div className="text-[11px] font-black text-yellow-400 truncate mb-0.5">@{processedLeaderboard[0].username}</div>
                <div className="text-[8px] text-slate-300 truncate mb-2.5">{processedLeaderboard[0].fullName}</div>
                <div className="text-[10px] font-mono font-black text-gradient-gold truncate leading-none">{processedLeaderboard[0].displayStr}</div>
              </div>
            )}

            {/* Rank 3 (Right) - Rendered only if there is a third real user */}
            {processedLeaderboard.length >= 3 && processedLeaderboard[2] && (
              <div className="p-3 rounded-2xl border bg-amber-700/5 border-amber-700/20 shadow-[0_0_20px_rgba(180,83,9,0.04)] flex flex-col justify-end min-h-[130px] relative overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-700/10 border border-amber-700/30 flex items-center justify-center font-extrabold text-[11px] text-amber-600">3</div>
                <div className="text-[10px] font-black text-white truncate mb-0.5">@{processedLeaderboard[2].username}</div>
                <div className="text-[7.5px] text-slate-400 truncate mb-2">{processedLeaderboard[2].fullName}</div>
                <div className="text-[9px] font-mono font-black text-amber-500 truncate leading-none">{processedLeaderboard[2].displayStr}</div>
              </div>
            )}
          </div>

          {/* Rank Rewards Section */}
          <div className="bg-gradient-to-r from-[#180e29] to-[#0d071a] border border-yellow-500/15 rounded-2xl p-4 shadow-xl">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-xl shadow-lg">🎁</div>
              <div className="flex-1">
                <span className="text-[8.5px] font-black tracking-widest text-yellow-400 block uppercase mb-1">{language === 'id' ? 'HADIAH BULANAN LEADERBOARD' : 'LEADERBOARD REWARDS'}</span>
                <p className="text-[10px] text-slate-300 font-bold leading-tight">
                  {language === 'id' ? 'Peringkat 1 mendapat Rp 10.000.000 + EXC-1000 Premium Hashrate' : 'Rank 1 receives Rp 10,000,000 + EXC-1000 Premium Booster'}
                </p>
              </div>
            </div>
          </div>

          {/* List entries for Rank 4 onwards */}
          {processedLeaderboard.length > 3 && (
            <div className="bg-[#0b0519] border border-white/5 rounded-3xl p-4 shadow-xl space-y-2.5">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Daftar Peringkat Tambahan' : 'Additional Rankings'}</div>
              
              <div className="space-y-2">
                {processedLeaderboard.slice(3, 100).map((user, idx) => {
                  const rankNum = idx + 4;
                  const isSelf = currentAccount && user.username.toLowerCase() === currentAccount.username.toLowerCase();
                  const isExpanded = expandedLeaderboardUser === user.username;

                  return (
                    <div 
                      key={user.username} 
                      className={`flex flex-col p-3 rounded-2xl border transition duration-300 cursor-pointer ${isSelf ? 'bg-purple-500/15 border-purple-500/30' : 'bg-white/[0.01] border-white/5 hover:border-purple-500/15'}`}
                      onClick={() => setExpandedLeaderboardUser(isExpanded ? null : user.username)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-extrabold text-slate-500 font-mono w-4">{rankNum}</span>
                          <div>
                            <div className="text-[10.5px] font-black text-white leading-none flex items-center gap-1.5">
                              <span>@{user.username}</span>
                              {isSelf && (
                                <span className="text-[7.5px] bg-yellow-400/25 text-yellow-400 px-1 py-0.5 rounded uppercase font-black tracking-wider leading-none">
                                  {language === 'id' ? 'Kamu' : 'You'}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">{user.fullName}</span>
                          </div>
                        </div>
                        <div className="text-[10.5px] font-mono font-black text-slate-300">{user.displayStr}</div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-500/10">
                                <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                                  {language === 'id' ? 'Rujukan Jaringan' : 'Network Downlines'}
                                </span>
                                <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                                  {user.totalMembers} {language === 'id' ? 'Mitra' : 'Partners'}
                                </span>
                              </div>
                              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-500/10">
                                <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                                  {language === 'id' ? 'Komisi Diterima' : 'Commission Earned'}
                                </span>
                                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                                  Rp {user.totalCommissionEarned.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-500/10">
                                <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                                  {language === 'id' ? 'Kontrak Pribadi' : 'Personal Contracts'}
                                </span>
                                <span className="text-xs font-extrabold text-yellow-400 flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-yellow-400" />
                                  {user.activeContracts} Unit
                                </span>
                              </div>
                              <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-500/10">
                                <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                                  {language === 'id' ? 'Hasil Pribadi' : 'Personal Earnings'}
                                </span>
                                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                                  <Gem className="w-3.5 h-3.5 text-amber-300" />
                                  Rp {user.totalEarned.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
