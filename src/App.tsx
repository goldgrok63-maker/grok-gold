import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Globe,
  Bell,
  Crown,
  Coins,
  Eye,
  EyeOff,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Star,
  Users,
  Ticket,
  Cpu,
  Gift,
  Network,
  Wallet,
  FileText,
  Award,
  History,
  Home,
  User,
  Camera,
  Check,
  LogOut,
  Download,
  ChevronLeft,
  Trophy,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck,
  HelpCircle,
  Gem,
  Truck,
  FileBadge,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  XCircle,
  X,
  Lock,
  Unlock,
  RotateCcw,
  Settings,
  Info,
  Target,
  Compass,
  MessageCircle,
  MessageSquare,
  Send,
  Briefcase,
  Sparkles,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { AppState, Transaction, Holder, CONFIG, UserAccount } from './types';
import { TRANSLATIONS } from './translations';
import WelcomeTicker from './components/WelcomeTicker';
import Modal from './components/Modal';
import GoldMarketChart from './components/GoldMarketChart';
import Leaderboard from './components/Leaderboard';
import HomeSkeleton from './components/HomeSkeleton';
import AdminLayout from './components/AdminLayout';
import {
  supabase,
  saveAccountToSupabase,
  fetchAccountsFromSupabase,
  registerUserInSupabase,
  createDepositInSupabase,
  createWithdrawalInSupabase,
  updateProfileImageInSupabase,
  updateUserSettingsInSupabase,
  purchaseContractInSupabase,
  claimWelcomeBonusInSupabase,
  claimDailyRewardInSupabase,
  updatePendingMiningRewardInSupabase,
  resetAllDataInSupabase,
  fetchGlobalConfig,
  saveGlobalConfig,
  updateGlobalConfig
} from './supabase';

// Initial dummy downline holders to populate Network structures
const INITIAL_HOLDERS: Holder[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const SPIN_ITEMS = [
  { label: 'Rp 5.000', color: '#7209b7', value: 5000, type: 'cash' },
  { label: 'ZONK', color: '#1a103c', value: 0, type: 'zonk' },
  { label: 'Rp 15.000', color: '#b5179e', value: 15000, type: 'cash' },
  { label: 'Boost 5x', color: '#f72585', value: 5, type: 'boost' },
  { label: 'Rp 25.000', color: '#7209b7', value: 25000, type: 'cash' },
  { label: 'ZONK', color: '#1a103c', value: 0, type: 'zonk' },
  { label: 'Rp 50.000', color: '#da70d6', value: 50000, type: 'cash' },
  { label: 'Boost 10x', color: '#f8961e', value: 10, type: 'boost' },
];

function isSameDay(t1: number, t2: number) {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function getWeekNumber(d: Date) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

function isSameWeek(t1: number, t2: number) {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return d1.getFullYear() === d2.getFullYear() && getWeekNumber(d1) === getWeekNumber(d2);
}

function isSameMonth(t1: number, t2: number) {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export default function App() {
  // --- SYSTEM STATES ---
  const [isSplashScreen, setIsSplashScreen] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [hideBalance, setHideBalance] = useState(false);
  const [isSyncing, setIsSyncing] = useState(() => {
    try {
      const cached = sessionStorage.getItem('grockgold_accounts_cache_v4');
      return !cached; // If cached, load instantly (stale-while-revalidate), no need to block UI
    } catch (e) {
      return true;
    }
  });

  // --- MULTI-ACCOUNT AUTH STATES ---
  const [authScreen, setAuthScreen] = useState<'welcome' | 'login' | 'register' | 'forgot'>('welcome');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(null);
  const [globalConfig, setGlobalConfig] = useState<any>({
    pricePerUnit: 180000,
    dailyRewardPercent: 4.0,
    cappingPercent: 250,
    minDeposit: 100000,
    minWithdraw: 100000,
    simulationSpeed: 1,
    botsEnabled: true,
    bankName: 'BCA',
    bankNumber: '8402-1920-22',
    bankHolder: 'PT GROCKGOLD INDONESIA',
    usdtAddress: 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a'
  });

  // --- REGISTRATION FORM STATES ---
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);

  // --- LOGIN FORM STATES ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // --- FORGOT PASSWORD STATES ---
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // --- CHANGE PASSWORD STATES ---
  const [profileOldPassword, setProfileOldPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  // --- LEADERBOARD EXPANDED STATE ---
  const [expandedLeaderboardUser, setExpandedLeaderboardUser] = useState<string | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('allTime');

  // --- MODEL MODAL STATES ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'danger' | 'warning' | 'info'>('info');
  const [modalShowConfirm, setModalShowConfirm] = useState(false);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);

  // --- WALLET / CORE INPUTS ---
  const [depositValue, setDepositValue] = useState('');
  const [txFilter, setTxFilter] = useState('all');
  const [contractQty, setContractQty] = useState(1);
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('admin123');

  // --- CUSTOM WITHDRAW MODAL STATES ---
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('BCA');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  // --- CUSTOM TRANSFER MODAL STATES ---
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');

  // --- CUSTOM HARVEST MODAL STATE ---
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [showBonusSchemaModal, setShowBonusSchemaModal] = useState(false);

  // --- LUCKY SPIN STATES ---
  const [luckySpinModalOpen, setLuckySpinModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinPrizeIndex, setSpinPrizeIndex] = useState<number | null>(null);

  // --- MISSION STATES ---
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);
  const [claimedMissionsHistory, setClaimedMissionsHistory] = useState<Array<{ id: string; title: string; reward: number; timestamp: number }>>([
    { id: 'hist_1', title: 'Registrasi Akun Berhasil', reward: 10000, timestamp: Date.now() - 3600000 * 48 },
    { id: 'hist_2', title: 'Verifikasi Keamanan Dasar', reward: 5000, timestamp: Date.now() - 3600000 * 24 }
  ]);
  const [dailyTaskCheck, setDailyTaskCheck] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [dailyTaskVisit, setDailyTaskVisit] = useState(false);
  const [dailyTaskClaimed, setDailyTaskClaimed] = useState(false);

  // --- INTEGRATED SHORTCUTS STATES ---
  const [spinTickets, setSpinTickets] = useState(5);
  const [spinCount, setSpinCount] = useState(0);
  const [sharedReferral, setSharedReferral] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedUSDT, setCopiedUSDT] = useState(false);
  const [luckySpinHistory, setLuckySpinHistory] = useState<Array<{ id: string; prize: string; date: number; success: boolean }>>([
    { id: '1', prize: 'Rp 15.000', date: Date.now() - 3600000 * 2.5, success: true },
    { id: '2', prize: 'Boost 5x', date: Date.now() - 3600000 * 5, success: true },
    { id: '3', prize: 'ZONK', date: Date.now() - 3600000 * 12, success: false }
  ]);
  const [communityMessages, setCommunityMessages] = useState<Array<{ id: string; user: string; text: string; time: string; initials: string; isSelf?: boolean }>>([
    { id: 'm1', user: 'rudi_gold', text: 'Klaim bonus Rp 1.8M beneran cair gan! Mantul bener rujukan target tercapai langsung landing!', time: '14:20', initials: 'RG' },
    { id: 'm2', user: 'mining_boss', text: 'Baru WD Rp 500rb instan langsung masuk rekening BCA 👍 Rekomendasi banget nih platform.', time: '14:22', initials: 'MB' },
    { id: 'm3', user: 'grock_global', text: 'West Africa mining server hashing rate is super stable. Got my hourly bonus on time!', time: '14:25', initials: 'GG' },
    { id: 'm4', user: 'santi_lestari', text: 'Ada yang dapet jackpot dari Lucky Spin hari ini? Kemarin dapet Rp 50.000 lumayan buat nambah hashrate.', time: '14:30', initials: 'SL' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'investor' | 'referral' | 'contract' | 'profit'>('investor');
  const [missionActiveTab, setMissionActiveTab] = useState<'daily' | 'weekly' | 'achievement'>('daily');

  // --- SIMULATION SETTINGS ---
  const [simSpeed, setSimSpeed] = useState(1); // multiplier (1x, 5x, 25x, 100x)
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [showBoosterRipple, setShowBoosterRipple] = useState(false);

  // --- APP STATE ---
  const [state, setState] = useState<AppState>({
    mainBalance: 0,
    activeContracts: 0,
    totalEarned: 0,
    referralEarned: 0,
    rebateEarned: 0,
    lastClaimTime: 0,
    welcomeBonusClaimed: false,
    isLoggedIn: false,
    username: 'ADMIN',
    holders: INITIAL_HOLDERS,
    goldProduction: 0,
    cyclePercent: 0,
    hasPurchased: false,
    profileImage: null,
    transactions: INITIAL_TRANSACTIONS,
    pendingMiningReward: 0,
    todayProfit: 0,
    totalProfit: 0,
  });

  // --- COOLDOWN COUNTERS ---
  const [claimCooldownText, setClaimCooldownText] = useState('');

  const t = TRANSLATIONS[language];

  // --- ASYNC BACKGROUND SYNC FROM SUPABASE ---
  const syncFromSupabase = async () => {
    try {
      const config = await fetchGlobalConfig();
      if (config) {
        setGlobalConfig(config);
        updateGlobalConfig(config);
      }

      const supabaseAccounts = await fetchAccountsFromSupabase();
      if (supabaseAccounts) {
        setAccounts(supabaseAccounts);
        localStorage.setItem('grockgold_accounts_v4', JSON.stringify(supabaseAccounts));
        sessionStorage.setItem('grockgold_accounts_cache_v4', JSON.stringify(supabaseAccounts));

        // Re-sync current active logged-in user if applicable
        const loggedInUsername = localStorage.getItem('grockgold_logged_in_username_v4');
        if (loggedInUsername) {
          const found = supabaseAccounts.find(acc => acc.username.toLowerCase() === loggedInUsername.toLowerCase());
          if (found) {
            setCurrentAccount(found);
            setState(prev => ({
              ...prev,
              ...found.state,
              isLoggedIn: true,
            }));
            if (found.settings?.language) {
              setLanguage(found.settings.language);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase not fully configured yet or schema missing.', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- LOAD PERSISTENT STATE & SETUP REALTIME ---
  useEffect(() => {
    // Initial Sync
    syncFromSupabase();

    // Setup Realtime PostgreSQL Changes listener for the 5 relational tables
    const dbChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        syncFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_config' }, () => {
        syncFromSupabase();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, []);

  // --- PARSE REFERRAL PARAMETER FROM URL ---
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        setAuthScreen('register');
        setRegReferralCode(refParam.trim());
      }
    } catch (e) {
      console.error("Error reading URL referral parameters", e);
    }
  }, []);

  // --- SAVE STATE WRAPPER (IN-MEMORY ONLY TO PREVENT STUTTERING) ---
  // To solve lag (patah-patah) caused by frequent synchronous disk writes (1s ticks),
  // we decouple React state updates from synchronous localStorage I/O.
  const updateState = (
    updater: Partial<AppState> | ((prev: AppState) => AppState),
    forceSaveImmediately: boolean = false
  ) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (forceSaveImmediately) {
        setTimeout(() => saveImmediately(next), 0);
      }
      return next;
    });
  };

  // Immediate save helper for critical actions (e.g., login, register, purchases, claims, top-ups)
  const saveImmediately = (latestState: AppState) => {
    if (!latestState.isLoggedIn || !currentAccount) return;
    try {
      setAccounts(prevAccounts => {
        const updatedAccounts = prevAccounts.map(acc => {
          if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
            const updatedAcc = {
              ...acc,
              state: latestState,
              settings: {
                ...acc.settings,
                language: language,
              }
            };
            saveAccountToSupabase(updatedAcc);
            return updatedAcc;
          }
          return acc;
        });
        localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
        return updatedAccounts;
      });
      localStorage.setItem('grockgold_state_v4', JSON.stringify(latestState));
    } catch (e) {
      console.error('Error in immediate localStorage save', e);
    }
  };

  // --- DEBOUNCED PERSISTENCE TO LOCALSTORAGE ---
  // Periodically saves background ticking yields to disk without blocking the UI thread.
  useEffect(() => {
    if (!state.isLoggedIn || !currentAccount) return;

    const handler = setTimeout(() => {
      try {
        setAccounts(prevAccounts => {
          const updatedAccounts = prevAccounts.map(acc => {
            if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
              const updatedAcc = {
                ...acc,
                state: state,
                settings: {
                  ...acc.settings,
                  language: language,
                }
              };
              saveAccountToSupabase(updatedAcc);
              return updatedAcc;
            }
            return acc;
          });
          localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
          return updatedAccounts;
        });
        localStorage.setItem('grockgold_state_v4', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving state to localStorage', e);
      }
    }, 4000); // Debounce write by 4 seconds (extremely smooth UI!)

    return () => clearTimeout(handler);
  }, [state, currentAccount, language]);

  // --- SPLASH SCREEN LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsSplashScreen(false), 500);
          return 100;
        }
        return prev + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // --- BOOST COUNTDOWN TIMER ---
  useEffect(() => {
    if (boostTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setBoostTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [boostTimeLeft]);

  // --- TICKING EXTRACTION CORE LOOP ---
  useEffect(() => {
    if (!state.isLoggedIn || isSplashScreen) return;

    const timer = setInterval(() => {
      // Calculate earnings and check capping limits
      const totalPortfolio = state.activeContracts * CONFIG.PRICE_PER_UNIT;
      const maxAllowed = totalPortfolio * CONFIG.CAPPING_PERCENT;
      const isCapped = state.totalEarned >= maxAllowed;

      // Active boost speeds up hashing cycles by 1.5x
      const activeBoostMult = boostTimeLeft > 0 ? 1.5 : 1.0;

      if (state.activeContracts > 0 && !isCapped) {
        updateState(prev => {
          let nextCycle = prev.cyclePercent + 1.5 * simSpeed * activeBoostMult;
          let addedGold = 0;

          if (nextCycle >= 100) {
            nextCycle = nextCycle % 100;
            // Add a realistic trace amount of gold per active contract unit
            addedGold = (0.0003 + Math.random() * 0.0007) * prev.activeContracts * simSpeed * activeBoostMult;
          }

          const now = Date.now();
          const lastUpdate = prev.lastGoldUpdateTime || now;

          let nextDaily = prev.goldProductionDaily || 0;
          let nextWeekly = prev.goldProductionWeekly || 0;
          let nextMonthly = prev.goldProductionMonthly || 0;

          if (!isSameDay(now, lastUpdate)) {
            nextDaily = 0;
          }
          if (!isSameWeek(now, lastUpdate)) {
            nextWeekly = 0;
          }
          if (!isSameMonth(now, lastUpdate)) {
            nextMonthly = 0;
          }

          if (addedGold > 0) {
            nextDaily += addedGold;
            nextWeekly += addedGold;
            nextMonthly += addedGold;
          }

          // Calculate daily yield per second (4% daily rate / 86400 seconds)
          const dailyYieldSec = (prev.activeContracts * CONFIG.PRICE_PER_UNIT * CONFIG.DAILY_REWARD_PERCENT) / 86400;
          const increment = dailyYieldSec * simSpeed * activeBoostMult;

          // Ensure we don't exceed the capping ceiling
          const currentTotalPortfolio = prev.activeContracts * CONFIG.PRICE_PER_UNIT;
          const currentMaxAllowed = currentTotalPortfolio * CONFIG.CAPPING_PERCENT;
          const currentEarnedTotal = prev.totalEarned + prev.pendingMiningReward;

          let addedReward = increment;
          if (currentEarnedTotal + increment > currentMaxAllowed) {
            addedReward = Math.max(0, currentMaxAllowed - currentEarnedTotal);
          }

          const nextPending = prev.pendingMiningReward + addedReward;

          // Auto Reinvest simulation if enabled and meets price per unit
          if (currentAccount?.settings?.autoReinvest && nextPending >= CONFIG.PRICE_PER_UNIT) {
            const unitsToBuy = Math.floor(nextPending / CONFIG.PRICE_PER_UNIT);
            const cost = unitsToBuy * CONFIG.PRICE_PER_UNIT;
            
            const autoTx: Transaction = {
              id: 'AUTO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
              type: 'reward',
              amount: cost,
              date: Date.now(),
              description: language === 'id'
                ? `Auto-Reinvest: Beli ${unitsToBuy} Unit`
                : `Auto-Reinvest: Purchased ${unitsToBuy} Units`,
            };

            return {
              ...prev,
              cyclePercent: nextCycle,
              goldProduction: prev.goldProduction + addedGold,
              goldProductionDaily: nextDaily,
              goldProductionWeekly: nextWeekly,
              goldProductionMonthly: nextMonthly,
              lastGoldUpdateTime: now,
              pendingMiningReward: nextPending - cost,
              activeContracts: prev.activeContracts + unitsToBuy,
              transactions: [autoTx, ...prev.transactions],
            };
          }

          return {
            ...prev,
            cyclePercent: nextCycle,
            goldProduction: prev.goldProduction + addedGold,
            goldProductionDaily: nextDaily,
            goldProductionWeekly: nextWeekly,
            goldProductionMonthly: nextMonthly,
            lastGoldUpdateTime: now,
            pendingMiningReward: nextPending,
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isLoggedIn, state.activeContracts, state.totalEarned, isSplashScreen, simSpeed, boostTimeLeft, currentAccount?.settings?.autoReinvest]);

  // --- REWARD CLAIM COUNTDOWN TIMER ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (state.lastClaimTime === 0) {
        setClaimCooldownText('');
        return;
      }
      const now = Date.now();
      const elapsed = now - state.lastClaimTime;
      if (elapsed >= CONFIG.CLAIM_COOLDOWN) {
        setClaimCooldownText('');
      } else {
        const remainingMs = CONFIG.CLAIM_COOLDOWN - elapsed;
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        const pad = (num: number) => String(num).padStart(2, '0');
        setClaimCooldownText(
          `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastClaimTime]);

  // --- HELPER METRICS ---
  // --- DYNAMIC WALLET METRICS (PERFECTLY SYNCHRONIZED WITH THE DATABASE TRANSACTIONS) ---
  const miningProfit = (state.transactions || [])
    .filter(t => t.type === 'reward')
    .reduce((sum, item) => sum + item.amount, 0);

  const referralReward = (state.transactions || [])
    .filter(t => t.type === 'referral')
    .reduce((sum, item) => sum + item.amount, 0);

  const rebateReward = (state.transactions || [])
    .filter(t => t.type === 'rebate')
    .reduce((sum, item) => sum + item.amount, 0);

  const bonusReward = (state.transactions || [])
    .filter(t => t.type === 'welcome_bonus' || t.type === 'bonus')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalEarned = miningProfit + referralReward + rebateReward + bonusReward;

  const totalPortfolioValue = state.activeContracts * CONFIG.PRICE_PER_UNIT;
  const maxPossibleEarnings = totalPortfolioValue * CONFIG.CAPPING_PERCENT;
  const cappingRatio = maxPossibleEarnings > 0 ? Math.min((totalEarned / maxPossibleEarnings) * 100, 100) : 0;
  const isCappedLimitMet = totalEarned >= maxPossibleEarnings && maxPossibleEarnings > 0;
  const dailyYield = totalPortfolioValue * CONFIG.DAILY_REWARD_PERCENT;

  // Booster Cooldown Helpers (24 hours cooldown)
  const boosterCooldownPeriod = 24 * 60 * 60 * 1000;
  const boosterElapsed = state.lastBoostTime ? Date.now() - state.lastBoostTime : boosterCooldownPeriod;
  const boosterCooldownActive = boosterElapsed < boosterCooldownPeriod;
  const boosterRemainingMs = Math.max(0, boosterCooldownPeriod - boosterElapsed);
  
  const boosterHrs = Math.floor(boosterRemainingMs / (60 * 60 * 1000));
  const boosterMins = Math.floor((boosterRemainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const boosterSecs = Math.floor((boosterRemainingMs % (60 * 1000)) / 1000);
  
  const boosterCooldownStr = `${boosterHrs}j ${boosterMins}m ${boosterSecs}s`;

  // Dynamic Referral & Downline Calculations based on registered accounts (memoized to prevent performance drain on 1s tick renders)
  const {
    directDownlines,
    level1Usernames,
    level2Downlines,
    level2Usernames,
    level3Downlines,
    l1Count,
    l2Count,
    l3Count,
    totalDownlinesCount,
    l1Contracts,
    l2Contracts,
    l3Contracts,
    totalDownlineContracts,
    activeDownlinesCount,
    teamVolumeValue,
    activeHolders,
    networkActiveCount,
    bonusProgressRatio,
    canClaimWelcomeBonus,
  } = React.useMemo(() => {
    const direct = accounts.filter(
      acc =>
        acc.invitedBy &&
        currentAccount &&
        acc.invitedBy.toLowerCase() === currentAccount.username.toLowerCase()
    );
    const l1Usernames = direct.map(acc => acc.username.toLowerCase());
    const l2 = accounts.filter(
      acc => acc.invitedBy && l1Usernames.includes(acc.invitedBy.toLowerCase())
    );
    const l2Usernames = l2.map(acc => acc.username.toLowerCase());
    const l3 = accounts.filter(
      acc => acc.invitedBy && l2Usernames.includes(acc.invitedBy.toLowerCase())
    );

    const l1C = direct.length;
    const l2C = l2.length;
    const l3C = l3.length;
    const totalDownlinesC = l1C + l2C + l3C;

    const l1Contracts = direct.reduce(
      (sum, acc) => sum + (acc.state?.activeContracts || 0),
      0
    );
    const l2Contracts = l2.reduce(
      (sum, acc) => sum + (acc.state?.activeContracts || 0),
      0
    );
    const l3Contracts = l3.reduce(
      (sum, acc) => sum + (acc.state?.activeContracts || 0),
      0
    );
    const totalDownlineContracts = l1Contracts + l2Contracts + l3Contracts;

    const activeDownlinesCount = [
      ...direct,
      ...l2,
      ...l3
    ].filter(acc => (acc.state?.activeContracts || 0) > 0).length;

    const teamVolumeValue = totalDownlineContracts * CONFIG.PRICE_PER_UNIT;

    const activeHolders = direct.filter(
      acc => (acc.state?.activeContracts || 0) >= CONFIG.MIN_CONTRACT_PER_HOLDER
    );
    const networkActiveCount = activeHolders.length;

    const bonusProgressRatio = Math.min(
      (networkActiveCount / CONFIG.REQUIRED_HOLDERS) * 100,
      100
    );
    const canClaimWelcomeBonus =
      networkActiveCount >= CONFIG.REQUIRED_HOLDERS &&
      !state.welcomeBonusClaimed;

    return {
      directDownlines: direct,
      level1Usernames: l1Usernames,
      level2Downlines: l2,
      level2Usernames: l2Usernames,
      level3Downlines: l3,
      l1Count: l1C,
      l2Count: l2C,
      l3Count: l3C,
      totalDownlinesCount: totalDownlinesC,
      l1Contracts,
      l2Contracts,
      l3Contracts,
      totalDownlineContracts,
      activeDownlinesCount,
      teamVolumeValue,
      activeHolders,
      networkActiveCount,
      bonusProgressRatio,
      canClaimWelcomeBonus,
    };
  }, [accounts, currentAccount, state.welcomeBonusClaimed]);

  // --- LEADERBOARD CALCULATION ---
  const leaderboardData = React.useMemo(() => {
    // Only display real registered users (exclude 'admin' from the leaderboard)
    const filteredAccounts = accounts.filter(u => u.username.toLowerCase() !== 'admin');
    const mapped = filteredAccounts.map(u => {
      const isSelf = currentAccount && u.username.toLowerCase() === currentAccount.username.toLowerCase();
      const activeState = isSelf ? state : u.state;

      const l1 = accounts.filter(
        acc =>
          acc.invitedBy &&
          acc.invitedBy.toLowerCase() === u.username.toLowerCase()
      );
      const l1Usernames = l1.map(acc => acc.username.toLowerCase());

      const l2 = accounts.filter(
        acc =>
          acc.invitedBy && l1Usernames.includes(acc.invitedBy.toLowerCase())
      );
      const l2Usernames = l2.map(acc => acc.username.toLowerCase());

      const l3 = accounts.filter(
        acc =>
          acc.invitedBy && l2Usernames.includes(acc.invitedBy.toLowerCase())
      );

      const l1Contracts = l1.reduce(
        (sum, acc) => sum + (acc.state?.activeContracts || 0),
        0
      );
      const l2Contracts = l2.reduce(
        (sum, acc) => sum + (acc.state?.activeContracts || 0),
        0
      );
      const l3Contracts = l3.reduce(
        (sum, acc) => sum + (acc.state?.activeContracts || 0),
        0
      );

      const totalContracts = l1Contracts + l2Contracts + l3Contracts;
      const teamVolume = totalContracts * CONFIG.PRICE_PER_UNIT;

      const goldAllTime = activeState?.goldProduction || 0;
      const goldDaily = activeState?.goldProductionDaily || 0;
      const goldWeekly = activeState?.goldProductionWeekly || 0;
      const goldMonthly = activeState?.goldProductionMonthly || 0;

      const vipLevel = (activeState?.activeContracts || 0) >= 50 ? 5 :
                       (activeState?.activeContracts || 0) >= 25 ? 4 :
                       (activeState?.activeContracts || 0) >= 10 ? 3 :
                       (activeState?.activeContracts || 0) >= 5 ? 2 :
                       (activeState?.activeContracts || 0) >= 1 ? 1 : 0;

      return {
        username: u.username,
        fullName: u.fullName,
        teamVolume,
        totalMembers: l1.length + l2.length + l3.length,
        totalContracts,
        directReferrals: l1.length,
        totalCommissionEarned: (activeState?.referralEarned || 0) + (activeState?.rebateEarned || 0),
        activeContracts: activeState?.activeContracts || 0,
        totalEarned: activeState?.totalEarned || 0,
        createdAt: u.createdAt || Date.now(),
        goldAllTime,
        goldDaily,
        goldWeekly,
        goldMonthly,
        vipLevel,
        profileImage: activeState?.profileImage || null,
      };
    });

    return [...mapped].sort((a, b) => {
      const valA = a.goldAllTime;
      const valB = b.goldAllTime;
      if (valB !== valA) {
        return valB - valA;
      }
      return a.createdAt - b.createdAt;
    });
  }, [accounts, state, currentAccount]);

  const currentAccountRankIndex = React.useMemo(() => {
    if (!currentAccount) return -1;
    return leaderboardData.findIndex(
      entry => entry.username.toLowerCase() === currentAccount.username.toLowerCase()
    );
  }, [leaderboardData, currentAccount]);

  const currentAccountRank = currentAccountRankIndex !== -1 ? currentAccountRankIndex + 1 : null;

  // --- ALERT / MODAL WRAPPERS ---
  const triggerModal = (
    msg: string,
    type: 'success' | 'danger' | 'warning' | 'info' = 'info',
    showConfirm = false,
    onConfirmFn?: () => void
  ) => {
    setModalMessage(msg);
    setModalType(type);
    setModalShowConfirm(showConfirm);
    setModalOnConfirm(() => onConfirmFn);
    setModalOpen(true);
  };

  // --- ACTIONS ---
  const toggleLanguage = () => {
    const nextLang = language === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
    localStorage.setItem('grockgold_lang', nextLang);

    // Sync to active account settings
    if (state.isLoggedIn && currentAccount) {
      setAccounts(prevAccounts => {
        const updatedAccounts = prevAccounts.map(acc => {
          if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
            return {
              ...acc,
              settings: {
                ...acc.settings,
                language: nextLang,
              }
            };
          }
          return acc;
        });
        try {
          localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
        } catch (e) {
          console.error(e);
        }
        return updatedAccounts;
      });
    }
  };

  const handleLogin = () => {
    const ident = loginIdentifier.trim().toLowerCase();
    const pass = loginPassword;

    if (!ident || !pass) {
      triggerModal(language === 'id' ? '❌ Harap isi semua kolom!' : '❌ Please fill in all fields!', 'warning');
      return;
    }

    const found = accounts.find(acc => acc.username.toLowerCase() === ident || acc.email.toLowerCase() === ident);
    if (!found) {
      triggerModal(language === 'id' ? '❌ Akun tidak ditemukan!' : '❌ Account not found!', 'danger');
      return;
    }

    if (found.password !== pass) {
      triggerModal(language === 'id' ? '❌ Kata sandi salah!' : '❌ Incorrect password!', 'danger');
      return;
    }

    setCurrentAccount(found);

    if (rememberMe) {
      localStorage.setItem('grockgold_logged_in_username_v4', found.username);
    } else {
      localStorage.removeItem('grockgold_logged_in_username_v4');
    }

    setState({
      ...found.state,
      isLoggedIn: true,
    });

    if (found.settings?.language) {
      setLanguage(found.settings.language);
    }

    triggerModal(t.successLogin, 'success');
    setCurrentTab('home');
  };

  const handleLogout = () => {
    if (currentAccount) {
      setAccounts(prevAccounts => {
        const updatedAccounts = prevAccounts.map(acc => {
          if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
            return {
              ...acc,
              state: {
                ...state,
                isLoggedIn: false,
              },
            };
          }
          return acc;
        });
        try {
          localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
        } catch (e) {
          console.error(e);
        }
        return updatedAccounts;
      });
    }

    setCurrentAccount(null);
    setState(prev => ({
      ...prev,
      isLoggedIn: false,
    }));
    localStorage.removeItem('grockgold_logged_in_username_v4');

    setIsSidebarOpen(false);
    triggerModal(language === 'id' ? 'Keluar berhasil.' : 'Sign out successfully.', 'warning');
    setAuthScreen('welcome');
    setCurrentTab('home');
  };

  const handleRegister = () => {
    const fullName = regFullName.trim();
    const username = regUsername.trim().replace(/\s+/g, '');
    const email = regEmail.trim();
    const phone = regPhone.trim();
    const password = regPassword;
    const confirmPassword = regConfirmPassword;
    const refCode = regReferralCode.trim();

    if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
      triggerModal(language === 'id' ? '❌ Semua field wajib diisi kecuali Kode Referral!' : '❌ All fields are mandatory except Referral Code!', 'warning');
      return;
    }

    if (username.length < 3) {
      triggerModal(language === 'id' ? '❌ Username minimal 3 karakter!' : '❌ Username must be at least 3 characters!', 'warning');
      return;
    }

    if (accounts.some(acc => acc.username.toLowerCase() === username.toLowerCase())) {
      triggerModal(language === 'id' ? '❌ Username sudah terdaftar!' : '❌ Username is already registered!', 'danger');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      triggerModal(language === 'id' ? '❌ Format email tidak valid!' : '❌ Invalid email format!', 'warning');
      return;
    }

    if (accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase())) {
      triggerModal(language === 'id' ? '❌ Email sudah terdaftar!' : '❌ Email is already registered!', 'danger');
      return;
    }

    if (password.length < 8) {
      triggerModal(language === 'id' ? '❌ Password minimal 8 karakter!' : '❌ Password must be at least 8 characters!', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      triggerModal(language === 'id' ? '❌ Password dan Konfirmasi Password harus sama!' : '❌ Password and Confirm Password must match!', 'danger');
      return;
    }

    if (!regAgreed) {
      triggerModal(language === 'id' ? '❌ Anda harus menyetujui Syarat & Ketentuan!' : '❌ You must agree to the Terms & Conditions!', 'warning');
      return;
    }

    // Generate next sequential Member ID format GGM-0001, GGM-0002, etc.
    let nextNum = 1;
    const ggmCodes = accounts
      .map(acc => acc.referralCode || '')
      .filter(code => code.startsWith('GGM-'));
    
    const numericParts = ggmCodes
      .map(code => {
        const numStr = code.substring(4);
        return /^\d+$/.test(numStr) ? parseInt(numStr, 10) : 0;
      })
      .filter(num => num > 0);
    
    if (numericParts.length > 0) {
      nextNum = Math.max(...numericParts) + 1;
    }
    const personalReferralCode = 'GGM-' + String(nextNum).padStart(4, '0');

    let sponsorUsername: string | null = null;
    let foundSponsor: UserAccount | null = null;

    if (refCode) {
      const sponsor = accounts.find(acc => acc.username.toLowerCase() === refCode.toLowerCase() || acc.referralCode.toLowerCase() === refCode.toLowerCase());
      if (sponsor) {
        sponsorUsername = sponsor.username;
        foundSponsor = sponsor;
      } else {
        triggerModal(
          language === 'id' ? '❌ Invalid Referral Code (Kode referral tidak valid!)' : '❌ Invalid Referral Code!',
          'danger'
        );
        return;
      }
    }

    const defaultUserState: AppState = {
      mainBalance: 0,
      activeContracts: 0,
      totalEarned: 0,
      referralEarned: 0,
      rebateEarned: 0,
      lastClaimTime: 0,
      welcomeBonusClaimed: false,
      isLoggedIn: false,
      username: username,
      holders: [],
      goldProduction: 0,
      cyclePercent: 0,
      hasPurchased: false,
      profileImage: null,
      transactions: [],
      pendingMiningReward: 0,
      todayProfit: 0,
      totalProfit: 0,
    };

    const newAccount: UserAccount = {
      fullName,
      username,
      email,
      phone,
      password,
      referralCode: personalReferralCode,
      invitedBy: sponsorUsername,
      createdAt: Date.now(),
      state: defaultUserState,
      settings: {
        language: language,
        notificationsEnabled: true,
        autoReinvest: false,
      }
    };

    registerUserInSupabase(newAccount).then(success => {
      if (success) {
        setRegFullName('');
        setRegUsername('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegReferralCode('');
        setRegAgreed(false);

        triggerModal(language === 'id' ? '🎉 Akun berhasil dibuat! Silakan masuk.' : '🎉 Account created successfully! Please sign in.', 'success');
        setAuthScreen('login');
      } else {
        triggerModal(language === 'id' ? '❌ Gagal membuat akun. Username atau Email mungkin sudah terdaftar.' : '❌ Failed to create account.', 'danger');
      }
    });
  };

  const handleChangePassword = () => {
    const oldPass = profileOldPassword;
    const newPass = profileNewPassword;
    const confirmNew = profileConfirmPassword;

    if (!oldPass || !newPass || !confirmNew) {
      triggerModal(language === 'id' ? '❌ Semua kolom wajib diisi!' : '❌ All fields are required!', 'warning');
      return;
    }

    if (currentAccount?.password !== oldPass) {
      triggerModal(language === 'id' ? '❌ Kata sandi lama salah!' : '❌ Incorrect old password!', 'danger');
      return;
    }

    if (newPass.length < 8) {
      triggerModal(language === 'id' ? '❌ Password baru minimal 8 karakter!' : '❌ New password must be at least 8 characters!', 'warning');
      return;
    }

    if (newPass !== confirmNew) {
      triggerModal(language === 'id' ? '❌ Konfirmasi kata sandi baru tidak cocok!' : '❌ Confirm new password does not match!', 'danger');
      return;
    }

    const updatedAccounts = accounts.map(acc => {
      if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
        const updated = {
          ...acc,
          password: newPass,
        };
        saveAccountToSupabase(updated);
        return updated;
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    try {
      localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error(e);
    }

    setCurrentAccount(prev => prev ? { ...prev, password: newPass } : null);

    setProfileOldPassword('');
    setProfileNewPassword('');
    setProfileConfirmPassword('');

    triggerModal(language === 'id' ? '✅ Kata sandi berhasil diperbarui!' : '✅ Password updated successfully!', 'success');
  };

  const handleToggleAutoReinvest = (val: boolean) => {
    if (!currentAccount) return;

    setAccounts(prevAccounts => {
       const updatedAccounts = prevAccounts.map(acc => {
         if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
           const updated = {
             ...acc,
             settings: {
               ...acc.settings,
               autoReinvest: val,
             }
           };
           saveAccountToSupabase(updated);
           return updated;
         }
         return acc;
       });
      try {
        localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.error(e);
      }
      return updatedAccounts;
    });

    setCurrentAccount(prev => prev ? {
      ...prev,
      settings: {
        ...prev.settings,
        autoReinvest: val,
      }
    } : null);

    triggerModal(
      language === 'id'
        ? `✅ Auto Reinvest ${val ? 'Diaktifkan' : 'Dinonaktifkan'}`
        : `✅ Auto Reinvest ${val ? 'Enabled' : 'Disabled'}`,
      'info'
    );
  };

  const handleToggleNotifications = (val: boolean) => {
    if (!currentAccount) return;

    setAccounts(prevAccounts => {
      const updatedAccounts = prevAccounts.map(acc => {
        if (acc.username.toLowerCase() === currentAccount.username.toLowerCase()) {
          return {
            ...acc,
            settings: {
              ...acc.settings,
              notificationsEnabled: val,
            }
          };
        }
        return acc;
      });
      try {
        localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));
      } catch (e) {
        console.error(e);
      }
      return updatedAccounts;
    });

    setCurrentAccount(prev => prev ? {
      ...prev,
      settings: {
        ...prev.settings,
        notificationsEnabled: val,
      }
    } : null);

    triggerModal(
      language === 'id'
        ? `🔔 Notifikasi ${val ? 'Diaktifkan' : 'Dinonaktifkan'}`
        : `🔔 Notifications ${val ? 'Enabled' : 'Disabled'}`,
      'info'
    );
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        updateState({ profileImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    const refCodeStr = currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase());
    const shareUrl = `${window.location.origin}/register?ref=${refCodeStr}`;
    
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    triggerModal(
      language === 'id' 
        ? '✅ Referral Link Copied Successfully!' 
        : '✅ Referral Link Copied Successfully!', 
      'success'
    );
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleCopyCode = () => {
    const refCodeStr = currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase());
    navigator.clipboard.writeText(refCodeStr);
    setCopiedCode(true);
    triggerModal(
      language === 'id' 
        ? '✅ Referral Code Copied Successfully!' 
        : '✅ Referral Code Copied Successfully!', 
      'success'
    );
    setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  };

  const handleCopyBankNumber = () => {
    const num = globalConfig?.bankNumber || '8402-1920-22';
    navigator.clipboard.writeText(num);
    setCopiedBank(true);
    triggerModal(
      language === 'id' 
        ? '✅ Nomor rekening bank berhasil disalin!' 
        : '✅ Bank account number copied successfully!', 
      'success'
    );
    setTimeout(() => {
      setCopiedBank(false);
    }, 2000);
  };

  const handleCopyUSDTAddress = () => {
    const addr = globalConfig?.usdtAddress || 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a';
    navigator.clipboard.writeText(addr);
    setCopiedUSDT(true);
    triggerModal(
      language === 'id' 
        ? '✅ Alamat USDT berhasil disalin!' 
        : '✅ USDT address copied successfully!', 
      'success'
    );
    setTimeout(() => {
      setCopiedUSDT(false);
    }, 2000);
  };

  const handleTapBooster = () => {
    if (state.activeContracts === 0) {
      triggerModal(
        language === 'id' 
          ? '🔒 Anda tidak memiliki Kontrak Aktif. Silakan beli kontrak tambang terlebih dahulu untuk mengaktifkan Turbo Booster!' 
          : '🔒 You have no active contracts. Please buy mining contracts first to utilize the Turbo Booster!', 
        'warning'
      );
      return;
    }

    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
    
    if (state.lastBoostTime) {
      const elapsed = now - state.lastBoostTime;
      if (elapsed < cooldownPeriod) {
        const remainingMs = cooldownPeriod - elapsed;
        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
        
        triggerModal(
          language === 'id'
            ? `⏳ Turbo Booster sedang dalam masa pemulihan (cooldown).\n\nAnda dapat mengaktifkannya kembali dalam:\n<b>${hours} jam, ${minutes} menit, ${seconds} detik</b>.`
            : `⏳ Turbo Booster is on cooldown.\n\nYou can reactivate it in:\n<b>${hours} hours, ${minutes} minutes, ${seconds} seconds</b>.`,
          'warning'
        );
        return;
      }
    }
    
    // Trigger visual ripple feedback
    setShowBoosterRipple(true);
    setTimeout(() => setShowBoosterRipple(false), 500);

    // Set boost countdown to 15 seconds
    setBoostTimeLeft(15);

    // Save activation timestamp and sync instantly
    updateState({ lastBoostTime: now }, true);

    // Visual toast notification on first activation
    if (boostTimeLeft === 0) {
      triggerModal(
        language === 'id'
          ? '⚡ EXC-700 TURBO BOOST AKTIF!\n\nKecepatan siklus cloud hashing meningkat +50% selama 15 detik ke depan!'
          : '⚡ EXC-700 TURBO BOOST ENGAGED!\n\nCloud hashing cycle step velocity accelerated by +50% for the next 15 seconds!',
        'success'
      );
    }
  };

  // --- PROCESS COOLDOWN & HARVEST CLAIMS ---
  const handleClaimYield = () => {
    if (state.activeContracts === 0) {
      triggerModal(
        "No active contract. Purchase a contract to start earning rewards.",
        'warning'
      );
      return;
    }

    const now = Date.now();
    if (state.lastClaimTime !== 0 && now - state.lastClaimTime < CONFIG.CLAIM_COOLDOWN) {
      triggerModal(
        "You have already claimed today's reward. Please come back after the countdown ends.",
        'warning'
      );
      return;
    }

    // Reward dihitung berdasarkan nilai kontrak aktif: Daily Reward = Nilai Kontrak × Daily Yield (%)
    const contractValue = state.activeContracts * CONFIG.PRICE_PER_UNIT;
    const rewardAmount = contractValue * CONFIG.DAILY_REWARD_PERCENT;
    const claimAmountRounded = Math.round(rewardAmount);

    if (!currentAccount) return;

    claimDailyRewardInSupabase(currentAccount.username, claimAmountRounded).then(success => {
      if (success) {
        triggerModal(
          language === 'id'
            ? `✅ Berhasil mengklaim reward harian sebesar Rp ${claimAmountRounded.toLocaleString('id-ID')}!`
            : `✅ Successfully claimed daily reward of Rp ${claimAmountRounded.toLocaleString('id-ID')}!`,
          'success'
        );
      } else {
        triggerModal(
          language === 'id' ? '❌ Gagal mengklaim reward harian.' : '❌ Failed to claim daily reward.',
          'danger'
        );
      }
    });
  };

  // --- DEPOSIT FLOW ---
  const formatDepositAmount = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean) {
      setDepositValue(parseInt(clean).toLocaleString('id-ID'));
    } else {
      setDepositValue('');
    }
  };

  const handleQuickDeposit = (amount: number) => {
    setDepositValue(amount.toLocaleString('id-ID'));
  };

  const executeDeposit = () => {
    const numeric = parseInt(depositValue.replace(/[^0-9]/g, '')) || 0;
    if (numeric < CONFIG.MIN_DEPOSIT) {
      triggerModal(
        language === 'id'
          ? `Minimal deposit adalah Rp${CONFIG.MIN_DEPOSIT.toLocaleString('id-ID')}.`
          : `Minimum deposit is Rp ${CONFIG.MIN_DEPOSIT.toLocaleString('id-ID')}.`,
        'warning'
      );
      return;
    }

    if (!currentAccount) return;
    const depId = 'DEP-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    createDepositInSupabase(depId, currentAccount.username, numeric, 'Instant Transfer', null).then(success => {
      if (success) {
        setDepositValue('');
        triggerModal(
          language === 'id'
            ? `⏳ Permintaan deposit sebesar Rp ${numeric.toLocaleString('id-ID')} telah dikirim dan sedang menunggu persetujuan admin!`
            : `⏳ Deposit request of Rp ${numeric.toLocaleString('id-ID')} is submitted and pending admin approval!`,
          'success'
        );
        setCurrentTab('wallet');
      } else {
        triggerModal(language === 'id' ? '❌ Gagal mengirim permintaan deposit.' : '❌ Failed to submit deposit request.', 'danger');
      }
    });
  };

  // --- WITHDRAW FLOW ---
  const triggerWithdrawFlow = () => {
    setWithdrawAmount('');
    setWithdrawAccount('');
    setWithdrawModalOpen(true);
  };

  const formatWithdrawAmount = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean) {
      setWithdrawAmount(parseInt(clean).toLocaleString('id-ID'));
    } else {
      setWithdrawAmount('');
    }
  };

  const executeWithdrawal = () => {
    const amount = parseInt(withdrawAmount.replace(/[^0-9]/g, '')) || 0;

    if (amount < CONFIG.MIN_WITHDRAW) {
      triggerModal(
        language === 'id' 
          ? `Minimal penarikan adalah Rp${CONFIG.MIN_WITHDRAW.toLocaleString('id-ID')}.` 
          : `Minimum withdrawal is Rp ${CONFIG.MIN_WITHDRAW.toLocaleString('id-ID')}.`,
        'warning'
      );
      return;
    }

    if (!withdrawAccount.trim()) {
      triggerModal(
        language === 'id' ? '❌ Nomor rekening bank harus diisi!' : '❌ Bank account number is required!',
        'warning'
      );
      return;
    }

    if (amount > state.mainBalance) {
      triggerModal(
        language === 'id' ? '❌ Saldo utama Anda tidak mencukupi!' : '❌ Your main balance is insufficient!',
        'danger'
      );
      return;
    }

    if (!currentAccount) return;
    const wdId = 'WD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    createWithdrawalInSupabase(wdId, currentAccount.username, amount, withdrawBank, withdrawAccount, currentAccount.fullName).then(success => {
      if (success) {
        setWithdrawModalOpen(false);
        triggerModal(
          language === 'id'
            ? `⏳ Permintaan penarikan Rp ${amount.toLocaleString('id-ID')} ke rekening ${withdrawBank} ${withdrawAccount} sedang diproses menunggu persetujuan admin!`
            : `⏳ Withdrawal request of Rp ${amount.toLocaleString('id-ID')} to ${withdrawBank} ${withdrawAccount} submitted. Pending admin approval!`,
          'success'
        );
      } else {
        triggerModal(language === 'id' ? '❌ Gagal mengajukan penarikan.' : '❌ Failed to submit withdrawal request.', 'danger');
      }
    });
  };

  // --- TRANSFER FLOW ---
  const triggerTransferFlow = () => {
    setTransferAmount('');
    setTransferRecipient('');
    setTransferModalOpen(true);
  };

  const formatTransferAmount = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean) {
      setTransferAmount(parseInt(clean).toLocaleString('id-ID'));
    } else {
      setTransferAmount('');
    }
  };

  const executeTransfer = () => {
    const amount = parseInt(transferAmount.replace(/[^0-9]/g, '')) || 0;

    if (amount < 10000) {
      triggerModal(
        language === 'id' ? '❌ Minimal transfer Rp 10.000' : '❌ Minimum transfer is Rp 10,000',
        'warning'
      );
      return;
    }

    if (!transferRecipient.trim()) {
      triggerModal(
        language === 'id' ? '❌ ID Penerima harus diisi!' : '❌ Recipient ID is required!',
        'warning'
      );
      return;
    }

    if (amount > state.mainBalance) {
      triggerModal(
        language === 'id' ? '❌ Saldo utama Anda tidak mencukupi!' : '❌ Your main balance is insufficient!',
        'danger'
      );
      return;
    }

    const newTx: Transaction = {
      id: 'TRF-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'withdraw',
      amount: amount,
      date: Date.now(),
      description: language === 'id' 
        ? `Transfer ke ${transferRecipient}` 
        : `Transfer to ${transferRecipient}`,
    };

    updateState(prev => ({
      ...prev,
      mainBalance: prev.mainBalance - amount,
      transactions: [newTx, ...prev.transactions],
    }), true);

    setTransferModalOpen(false);
    triggerModal(
      language === 'id'
        ? `✅ Berhasil mentransfer Rp ${amount.toLocaleString('id-ID')} ke ${transferRecipient}!`
        : `✅ Successfully transferred Rp ${amount.toLocaleString('id-ID')} to ${transferRecipient}!`,
      'success'
    );
  };

  // --- CONTRACT PURCHASE FLOW ---
  const adjustContractQty = (change: number) => {
    setContractQty(prev => {
      const next = prev + change;
      return next < 1 ? 1 : next;
    });
  };

  const handlePurchaseContract = () => {
    const cost = contractQty * CONFIG.PRICE_PER_UNIT;
    if (cost > state.mainBalance) {
      triggerModal(t.insufficientBalance, 'danger');
      return;
    }

    const confirmAction = () => {
      if (!currentAccount) return;

      purchaseContractInSupabase(currentAccount.username, contractQty, CONFIG.PRICE_PER_UNIT).then(success => {
        if (success) {
          triggerModal(
            language === 'id'
              ? `🎉 Berhasil membeli ${contractQty} unit Stock Contract!`
              : `🎉 Successfully purchased ${contractQty} Stock Contract units!`,
            'success'
          );
          setContractQty(1);
        } else {
          triggerModal(
            language === 'id'
              ? '❌ Gagal melakukan pembelian kontrak.'
              : '❌ Failed to complete contract purchase.',
            'danger'
          );
        }
      });
    };

    triggerModal(
      language === 'id'
        ? `Beli ${contractQty} Unit Kontrak?\nTotal: Rp ${cost.toLocaleString('id-ID')}`
        : `Buy ${contractQty} Contract Units?\nTotal: Rp ${cost.toLocaleString('id-ID')}`,
      'info',
      true,
      confirmAction
    );
  };

  // --- MLM DOWNLINE PURCHASE SIMULATION ENGINE ---
  const simulateDownlinePurchase = () => {
    const levels = [
      { level: 1, pct: 0.10, label: 'Level 1 (Direct)' },
      { level: 2, pct: 0.03, label: 'Level 2 (Indirect)' },
      { level: 3, pct: 0.02, label: 'Level 3 (Indirect)' }
    ];
    const picked = levels[Math.floor(Math.random() * levels.length)];
    const names = [
      'Andi Wijaya', 'Budi Santoso', 'Chandra Lestari', 'Dedi Heryanto', 'Eko Prasetyo',
      'Fajar Ramadhan', 'Gita Permata', 'Hendra Kusuma', 'Iwan Setiawan', 'Joni Iskandar',
      'Kartika Sari', 'Lutfi Hakim', 'Mega Utami', 'Novi Andriani', 'Rian Hidayat'
    ];
    const pickedName = names[Math.floor(Math.random() * names.length)];
    const qty = Math.floor(1 + Math.random() * 5); // 1 to 5 contracts
    const totalPurchase = qty * CONFIG.PRICE_PER_UNIT;
    const commission = totalPurchase * picked.pct;

    const confirmSimulate = () => {
      const newTx: Transaction = {
        id: 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        type: 'deposit',
        amount: commission,
        date: Date.now(),
        description: language === 'id'
          ? `Komisi Ref L${picked.level} (${pickedName} Beli ${qty} Unit)`
          : `Ref Commission L${picked.level} (${pickedName} Bought ${qty} Units)`,
      };

      // Create a simulated holder record if L1
      let newHolder = null;
      if (picked.level === 1) {
        newHolder = {
          id: 'H00' + (state.holders.length + 1),
          name: pickedName,
          contracts: qty,
          joinDate: Date.now()
        };
      }

      updateState(prev => {
        const nextHolders = newHolder ? [newHolder, ...prev.holders] : prev.holders;
        return {
          ...prev,
          mainBalance: prev.mainBalance + commission,
          referralEarned: prev.referralEarned + commission,
          holders: nextHolders,
          transactions: [newTx, ...prev.transactions],
        };
      });

      triggerModal(
        language === 'id'
          ? `👥 <b>Simulasi Berhasil!</b><br>Downline Anda <b>${pickedName}</b> di <b>L${picked.level}</b> membeli ${qty} Unit Kontrak.<br><br>Sponsor Commission (<b>${picked.pct * 100}%</b>):<br><span class="text-emerald-400 font-extrabold">Rp ${commission.toLocaleString('id-ID')}</span> berhasil ditambahkan ke saldo Anda!`
          : `👥 <b>Simulation Successful!</b><br>Your downline <b>${pickedName}</b> at <b>L${picked.level}</b> purchased ${qty} Contract Units.<br><br>Sponsor Commission (<b>${picked.pct * 100}%</b>):<br><span class="text-emerald-400 font-extrabold">Rp ${commission.toLocaleString('id-ID')}</span> has been added to your balance!`,
        'success'
      );
    };

    confirmSimulate();
  };

  // --- CLAIM WELCOME BONUS FLOW ---
  const handleClaimWelcomeBonus = () => {
    if (state.welcomeBonusClaimed) {
      triggerModal('Welcome bonus already claimed!', 'info');
      return;
    }
    if (!canClaimWelcomeBonus) {
      triggerModal(
        language === 'id'
          ? `⚠️ SYARAT BELUM TERPENUHI\n\nUntuk mengklaim Welcome Bonus sebesar Rp 1.800.000, Anda harus memiliki minimal 80 Holder Aktif di jaringan Anda.\n\nProgress Anda saat ini baru mencapai ${networkActiveCount} dari syarat ${CONFIG.REQUIRED_HOLDERS} Holder Aktif.\n\nSilakan undang lebih banyak rekan atau aktifkan lisensi di tim Anda untuk memenuhi syarat!`
          : `⚠️ REQUIREMENTS NOT MET\n\nTo claim the Welcome Bonus of Rp 1,800,000, you must have at least 80 Active Holders in your network.\n\nYour current progress is ${networkActiveCount} out of the required ${CONFIG.REQUIRED_HOLDERS} Active Holders.`,
        'warning'
      );
      return;
    }

    if (!currentAccount) return;

    claimWelcomeBonusInSupabase(currentAccount.username).then(success => {
      if (success) {
        triggerModal(t.welcomeBonusClaimedSuccess, 'success');
      } else {
        triggerModal(
          language === 'id' ? '❌ Gagal mengklaim Welcome Bonus.' : '❌ Failed to claim Welcome Bonus.',
          'danger'
        );
      }
    });
  };

  // --- LUCKY SPIN HANDLER ---
  const handleSpin = () => {
    if (isSpinning) return;
    
    const randomIndex = Math.floor(Math.random() * SPIN_ITEMS.length);
    const degreePerSegment = 360 / SPIN_ITEMS.length;
    const extraSpins = 5;
    const targetRotation = spinRotation + (extraSpins * 360) + (360 - (randomIndex * degreePerSegment)) - (spinRotation % 360);
    
    setIsSpinning(true);
    setSpinRotation(targetRotation);
    setSpinPrizeIndex(randomIndex);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = SPIN_ITEMS[randomIndex];
      
      if (prize.type === 'cash') {
        const newTx: Transaction = {
          id: 'SPN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          type: 'reward',
          amount: prize.value,
          date: Date.now(),
          description: language === 'id' ? `Hadiah Lucky Spin Wheel` : `Lucky Spin Wheel Prize`,
        };
        
        updateState(prev => ({
          ...prev,
          mainBalance: prev.mainBalance + prize.value,
          totalEarned: prev.totalEarned + prize.value,
          transactions: [newTx, ...prev.transactions],
        }));

        triggerModal(
          language === 'id'
            ? `🎉 SELAMAT!\n\nAnda memenangkan Saldo sebesar Rp ${prize.value.toLocaleString('id-ID')} dari Lucky Spin Wheel!\n\nHadiah telah ditambahkan ke Saldo Utama Anda.`
            : `🎉 CONGRATULATIONS!\n\nYou won a Balance of Rp ${prize.value.toLocaleString('id-ID')} from the Lucky Spin Wheel!\n\nThe prize has been added to your Main Balance.`,
          'success'
        );
      } else if (prize.type === 'boost') {
        setBoostTimeLeft(300);
        setShowBoosterRipple(true);
        triggerModal(
          language === 'id'
            ? `⚡ BOOSTER AKTIF!\n\nAnda memenangkan Booster Kecepatan Tambang ${prize.value}x selama 5 menit!\n\nKecepatan penambangan kontrak Anda meningkat secara masif!`
            : `⚡ BOOSTER ACTIVE!\n\nYou won a ${prize.value}x Mining Speed Booster for 5 minutes!\n\nYour mining speed has increased massively!`,
          'success'
        );
      } else {
        triggerModal(
          language === 'id'
            ? `😢 ZONK!\n\nSayang sekali, putaran Anda mendarat di Zonk. Jangan menyerah, silakan coba lagi nanti!`
            : `😢 ZONK!\n\nBad luck! Your spin landed on Zonk. Don't give up, try again later!`,
          'info'
        );
      }
    }, 3600);
  };

  // --- MISSION CLAIM HANDLER ---
  const handleClaimMission = (missionId: string, rewardValue: number, title: string) => {
    if (claimedMissions.includes(missionId)) {
      triggerModal(language === 'id' ? 'Misi ini sudah diklaim!' : 'This mission has already been claimed!', 'info');
      return;
    }

    const newTx: Transaction = {
      id: 'MSN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'reward',
      amount: rewardValue,
      date: Date.now(),
      description: `Mission Reward: ${title}`,
    };

    updateState(prev => ({
      ...prev,
      mainBalance: prev.mainBalance + rewardValue,
      totalEarned: prev.totalEarned + rewardValue,
      transactions: [newTx, ...prev.transactions],
    }));

    setClaimedMissions(prev => [...prev, missionId]);
    setClaimedMissionsHistory(prev => [
      { id: 'hist_' + Math.random().toString(36).substring(2, 9).toUpperCase(), title, reward: rewardValue, timestamp: Date.now() },
      ...prev
    ]);

    triggerModal(
      language === 'id'
        ? `🎁 MISI SELESAI!\n\nAnda berhasil mengklaim hadiah sebesar Rp ${rewardValue.toLocaleString('id-ID')} untuk misi: "${title}".`
        : `🎁 MISSION COMPLETED!\n\nYou successfully claimed a reward of Rp ${rewardValue.toLocaleString('id-ID')} for the mission: "${title}".`,
      'success'
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#040108] text-slate-100 flex flex-col items-center font-sans antialiased">
      
      {/* 1. SPLASH SCREEN */}
      <AnimatePresence>
        {isSplashScreen && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[999999] bg-[#040108] flex flex-col justify-center items-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="text-4xl font-extrabold tracking-wider text-gold-primary font-orbitron drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            >
              GROCKGOLD
            </motion.div>
            <div className="text-xs text-purple-400 font-bold tracking-widest mt-2 uppercase">
              A Randgold Resources Company
            </div>
            <div className="text-slate-400 text-sm mt-12 font-medium">
              Initializing Secure Mining Network...
            </div>
            <div className="w-56 h-2 bg-slate-900 border border-purple-900/40 rounded-full overflow-hidden mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${splashProgress}%` }}
                className="h-full bg-gradient-to-r from-yellow-500 via-gold-primary to-yellow-300 shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-2">{splashProgress}%</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER FULL-SCREEN ADMIN CONSOLE IF LOGGED IN AS ADMIN, ELSE STANDARD USER INTERFACE */}
      {state.isLoggedIn && currentAccount?.username?.toLowerCase() === 'admin' ? (
        <div className="w-full min-h-screen bg-slate-950">
          <AdminLayout
            accounts={accounts}
            setAccounts={setAccounts}
            currentAccount={currentAccount}
            setCurrentAccount={setCurrentAccount}
            saveAccountToSupabase={saveAccountToSupabase}
            language={language}
            triggerModal={triggerModal}
            updateState={updateState}
            onLogout={handleLogout}
            globalConfig={globalConfig}
            onSaveGlobalConfig={async (newConfig: any) => {
              const success = await saveGlobalConfig(newConfig);
              if (success) {
                setGlobalConfig(newConfig);
                updateGlobalConfig(newConfig);
              }
              return success;
            }}
          />
        </div>
      ) : (
        <div className="w-full max-w-[425px] min-h-screen bg-[#050212]/95 border-x border-purple-950/20 shadow-2xl relative flex flex-col pb-24">
        
        {/* SIDEBAR NAVIGATION DRAWER */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100000] w-full max-w-[425px] mx-auto"
              />

              {/* Sidebar Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 min-[425px]:left-[calc(50%-212.5px)] w-[290px] h-screen bg-[#0f0a21] border-r border-gold-primary/20 z-[100001] p-6 flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-extrabold text-gold-primary tracking-widest">MENU</span>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 text-slate-400 hover:text-white transition"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Profile Section inside Sidebar */}
                  <div className="text-center pb-6 border-b border-white/5 mb-6">
                    <div className="relative w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-tr from-purple-900/50 to-gold-primary/30 border border-gold-primary/30 flex items-center justify-center overflow-hidden shadow-lg group">
                      {state.profileImage ? (
                        <img src={state.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gold-primary" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-250">
                        <Camera className="w-4 h-4 text-white" />
                        <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                      </label>
                    </div>
                    <div className="text-sm font-extrabold text-white uppercase">{state.username}</div>
                    {state.username.toLowerCase() !== 'admin' && (
                      <div className="text-[10px] text-purple-300/70 font-mono mt-0.5">
                        ID: {currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase())}
                      </div>
                    )}
                  </div>

                  {/* Sidebar Menu Items */}
                  <div className="space-y-6">
                    {/* Menu Group: Utama */}
                    <div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">
                        {language === 'id' ? 'NAVIGASI UTAMA' : 'MAIN NAVIGATION'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'home', label: 'Home', icon: Home },
                          { id: 'contract', label: language === 'id' ? 'Kontrak' : 'Contracts', icon: Ticket },
                          { id: 'livemining', label: 'Live Mining', icon: Cpu },
                          { id: 'wallet', label: 'Wallet', icon: Wallet },
                          { id: 'profile', label: language === 'id' ? 'Profil' : 'Profile', icon: User },
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = currentTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setCurrentTab(item.id);
                              }}
                              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                                isActive
                                  ? 'bg-gradient-to-r from-purple-950/40 to-purple-900/25 text-gold-primary border-l-2 border-gold-primary'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <Icon className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Menu Group: Fitur & Layanan */}
                    <div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">
                        {language === 'id' ? 'FITUR & REWARDS' : 'FEATURES & REWARDS'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'reward', label: t.rewards, icon: Gift },
                          ...(state.username.toLowerCase() !== 'admin' ? [{ id: 'referral', label: t.referral, icon: Users }] : []),
                          { id: 'transactions', label: language === 'id' ? 'Riwayat Transaksi' : 'Transaction History', icon: History },
                          { id: 'notifications', label: language === 'id' ? 'Notifikasi' : 'Notifications', icon: Bell },
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = currentTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setCurrentTab(item.id);
                              }}
                              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                                isActive
                                  ? 'bg-gradient-to-r from-purple-950/40 to-purple-900/25 text-gold-primary border-l-2 border-gold-primary'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <Icon className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Menu Group: Sistem & Preferensi */}
                    <div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">
                        {language === 'id' ? 'PENGATURAN TERMINAL' : 'TERMINAL SETTINGS'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const items = [
                            { id: 'settings', label: language === 'id' ? 'Pengaturan' : 'Settings', icon: Settings },
                            { id: 'language', label: language === 'id' ? 'Ubah Bahasa' : 'Change Language', icon: Globe, action: true },
                            { id: 'help', label: language === 'id' ? 'Bantuan FAQ' : 'Help & FAQ', icon: HelpCircle },
                            { id: 'about', label: language === 'id' ? 'Tentang Kami' : 'About Us', icon: Info },
                          ];
                          if (currentAccount?.username?.toLowerCase() === 'admin') {
                            items.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
                          }
                          return items;
                        })().map((item) => {
                          const Icon = item.icon;
                          const isActive = currentTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setIsSidebarOpen(false);
                                if ('action' in item && item.action) {
                                  toggleLanguage();
                                  triggerModal(
                                    language === 'id'
                                      ? '🇬🇧 Language changed to English!'
                                      : '🇲🇨 Bahasa diubah ke Bahasa Indonesia!',
                                    'success'
                                  );
                                } else {
                                  setCurrentTab(item.id);
                                }
                              }}
                              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                                isActive
                                  ? 'bg-gradient-to-r from-purple-950/40 to-purple-900/25 text-gold-primary border-l-2 border-gold-primary'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <Icon className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                <span className="truncate">{item.label}</span>
                                {item.id === 'language' && (
                                  <span className="text-[8px] bg-purple-900/40 px-2 py-0.5 rounded text-gold-primary uppercase font-mono shrink-0">
                                    {language}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-extrabold transition text-left text-rose-400 hover:bg-rose-950/20"
                    >
                      <LogOut className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>

                {/* Footer brand info */}
                <div className="pt-6 border-t border-white/5">
                  <div className="text-[9px] text-center text-slate-500 font-mono leading-relaxed">
                    GROCKGOLD v2.2<br />
                    A RANDGOLD RESOURCES COMPANY
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. AUTHENTICATION SCREENS (WELCOME, REGISTER, LOGIN, FORGOT PASSWORD) */}
        {!state.isLoggedIn ? (
          <div className="flex-1 flex flex-col justify-center min-h-screen">
            <AnimatePresence mode="wait">
              {/* WELCOME SCREEN */}
              {authScreen === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col justify-between w-full px-6 py-12"
                >
                  {/* Logo & Branding */}
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-purple-900/60 to-gold-primary/40 border border-gold-primary/30 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)]"
                      />
                      <Coins className="w-12 h-12 text-gold-primary filter drop-shadow-[0_4px_10px_rgba(212,175,55,0.4)]" />
                    </div>
                    <h1 className="text-3xl font-black tracking-wider text-white font-orbitron">
                      GROCKGOLD
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-4">
                      A Randgold Resources Company
                    </p>
                    
                    <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-gold-primary rounded-full mb-8" />
                    
                    <h2 className="text-sm font-extrabold text-gold-primary uppercase tracking-widest mb-3">
                      {t.welcomeTitle}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium px-4 leading-relaxed max-w-[320px]">
                      {t.welcomeSubtitle}
                    </p>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="space-y-4 mt-8 w-full">
                    <button
                      onClick={() => setAuthScreen('login')}
                      className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/10 hover:brightness-110 active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      {t.welcomeMasuk}
                    </button>
                    
                    <button
                      onClick={() => setAuthScreen('register')}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition border border-purple-900/40 hover:border-gold-primary/30 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4 text-gold-primary" />
                      {t.welcomeDaftar}
                    </button>

                    <p className="text-[9px] text-slate-500 text-center font-mono leading-relaxed mt-4">
                      {t.welcomeNotice}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* REGISTER SCREEN */}
              {authScreen === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 w-full px-6 py-8 overflow-y-auto"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setAuthScreen('welcome')}
                    className="mb-6 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 text-gold-primary" />
                    Kembali
                  </button>

                  <div className="text-center mb-6">
                    <h2 className="text-lg font-black text-white tracking-wider uppercase font-orbitron">
                      {t.regTitle}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1">
                      {t.regSubtitle}
                    </p>
                  </div>

                  <div className="space-y-4 bg-[#100b26]/80 border border-purple-950/40 rounded-2xl p-5 shadow-2xl">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.fullName}
                      </label>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Contoh: Kenala Wijaya"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.username}
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="Contoh: kenala123"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.emailAddress}
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Contoh: kenala@grockgold.com"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.phoneNumber}
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                        placeholder="Contoh: 081234567890"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition font-mono"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.password}
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Referral Code (optional) */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                        {t.referralCodeOptional}
                      </label>
                      <input
                        type="text"
                        value={regReferralCode}
                        onChange={(e) => setRegReferralCode(e.target.value)}
                        placeholder="Kode sponsor atau username"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3.5 py-2.5 text-xs font-medium text-white transition font-mono"
                      />
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className="flex items-start gap-2 pt-2">
                      <input
                        id="agree-tc"
                        type="checkbox"
                        checked={regAgreed}
                        onChange={(e) => setRegAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-purple-900 text-gold-primary focus:ring-gold-primary bg-black/40"
                      />
                      <label htmlFor="agree-tc" className="text-[10px] text-slate-400 leading-snug cursor-pointer select-none">
                        Saya menyetujui <span className="text-gold-primary font-bold hover:underline cursor-pointer" onClick={(e) => { e.preventDefault(); triggerModal(language === 'id' ? "📜 SYARAT & KETENTUAN\n\n1. Seluruh investasi dalam simulator GROCKGOLD sepenuhnya bersifat edukatif dan representasi digital PT GrockGold Mining.\n2. Pengguna bertanggung jawab penuh atas keamanan kredensial akun miliknya.\n3. Setiap tindakan manipulasi data akan ditindak secara otomatis oleh sistem keamanan Randgold." : "📜 TERMS & CONDITIONS\n\n1. All investments in the GROCKGOLD simulator are strictly educational representations of PT GrockGold Mining.\n2. Users are fully responsible for the security of their own account credentials.\n3. Any attempt at data manipulation will be automatically flagged by Randgold security protocols.", 'info'); }}>Syarat & Ketentuan</span> PT GrockGold Mining.
                      </label>
                    </div>

                    {/* Register Action button */}
                    <button
                      onClick={handleRegister}
                      className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/20 hover:brightness-110 active:scale-98 mt-2"
                    >
                      {t.createAccount}
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    <button
                      onClick={() => setAuthScreen('login')}
                      className="text-[10px] font-bold text-gold-primary hover:underline transition"
                    >
                      {t.hasAccount}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* LOGIN SCREEN */}
              {authScreen === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 w-full px-6 py-12 flex flex-col justify-center"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setAuthScreen('welcome')}
                    className="mb-8 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition uppercase tracking-wider self-start"
                  >
                    <ChevronLeft className="w-4 h-4 text-gold-primary" />
                    Kembali
                  </button>

                  <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-white tracking-wider uppercase font-orbitron">
                      {t.loginTitle}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1">
                      {t.loginSubtitle}
                    </p>
                  </div>

                  <div className="space-y-5 bg-[#100b26]/80 border border-purple-950/40 rounded-2xl p-6 shadow-2xl">
                    {/* Username or Email */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                        {t.usernameOrEmail}
                      </label>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Masukkan Username atau Email"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                          {t.password}
                        </label>
                        <button
                          onClick={() => {
                            setAuthScreen('forgot');
                            setForgotStep(1);
                          }}
                          className="text-[9px] font-extrabold text-gold-primary hover:underline"
                        >
                          {t.forgotPassword}
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                      />
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-2 py-1">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-purple-900 text-gold-primary focus:ring-gold-primary bg-black/40"
                      />
                      <label htmlFor="remember-me" className="text-[10px] text-slate-400 leading-none cursor-pointer select-none">
                        {t.rememberMe}
                      </label>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={handleLogin}
                      className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/20 hover:brightness-110 active:scale-98"
                    >
                      {t.accessDashboard}
                    </button>
                  </div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => setAuthScreen('register')}
                      className="text-[10px] font-bold text-gold-primary hover:underline transition"
                    >
                      {t.noAccount}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* FORGOT PASSWORD SCREEN */}
              {authScreen === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 w-full px-6 py-12 flex flex-col justify-center"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setAuthScreen('login')}
                    className="mb-8 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition uppercase tracking-wider self-start"
                  >
                    <ChevronLeft className="w-4 h-4 text-gold-primary" />
                    Kembali ke Login
                  </button>

                  <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-white tracking-wider uppercase font-orbitron">
                      LUPA KATA SANDI
                    </h2>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1">
                      Pulihkan kredensial terminal aman Anda
                    </p>
                  </div>

                  {forgotStep === 1 ? (
                    <div className="space-y-5 bg-[#100b26]/80 border border-purple-950/40 rounded-2xl p-6 shadow-2xl">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                          {t.username}
                        </label>
                        <input
                          type="text"
                          value={forgotUsername}
                          onChange={(e) => setForgotUsername(e.target.value.trim())}
                          placeholder="Masukkan Username terdaftar"
                          className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                          {t.emailAddress}
                        </label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value.trim())}
                          placeholder="Masukkan Email terdaftar"
                          className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!forgotUsername || !forgotEmail) {
                            triggerModal(language === 'id' ? '❌ Mohon isi username dan email!' : '❌ Please fill in both username and email!', 'warning');
                            return;
                          }
                          const found = accounts.find(acc => acc.username.toLowerCase() === forgotUsername.toLowerCase() && acc.email.toLowerCase() === forgotEmail.toLowerCase());
                          if (!found) {
                            triggerModal(language === 'id' ? '❌ Data akun tidak cocok atau tidak ditemukan!' : '❌ Account details mismatch or not found!', 'danger');
                            return;
                          }
                          setForgotStep(2);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/20 hover:brightness-110 active:scale-98"
                      >
                        VERIFIKASI AKUN
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5 bg-[#100b26]/80 border border-purple-950/40 rounded-2xl p-6 shadow-2xl">
                      <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 flex gap-3 items-center">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-[10px] text-emerald-300 font-medium leading-relaxed">
                          Akun Anda berhasil diverifikasi. Silakan tetapkan kata sandi baru Anda di bawah ini.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                          {t.newPassword}
                        </label>
                        <input
                          type="password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="Minimal 8 karakter"
                          className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                          {t.confirmNewPassword}
                        </label>
                        <input
                          type="password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-4 py-3 text-xs font-medium text-white transition"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (forgotNewPassword.length < 8) {
                            triggerModal(language === 'id' ? '❌ Password baru minimal 8 karakter!' : '❌ New password must be at least 8 characters!', 'warning');
                            return;
                          }
                          if (forgotNewPassword !== forgotConfirmPassword) {
                            triggerModal(language === 'id' ? '❌ Konfirmasi kata sandi baru tidak cocok!' : '❌ Confirm password does not match!', 'danger');
                            return;
                          }

                          // Update password for verified user
                          const updatedAccounts = accounts.map(acc => {
                            if (acc.username.toLowerCase() === forgotUsername.toLowerCase()) {
                              return {
                                ...acc,
                                password: forgotNewPassword,
                              };
                            }
                            return acc;
                          });

                          setAccounts(updatedAccounts);
                          localStorage.setItem('grockgold_accounts_v4', JSON.stringify(updatedAccounts));

                          triggerModal(language === 'id' ? '✅ Kata sandi berhasil diperbarui! Silakan login.' : '✅ Password updated successfully! Please login.', 'success');
                          
                          // Clear state
                          setForgotUsername('');
                          setForgotEmail('');
                          setForgotNewPassword('');
                          setForgotConfirmPassword('');
                          setForgotStep(1);
                          setAuthScreen('login');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg hover:brightness-110 active:scale-98"
                      >
                        SIMPAN KATA SANDI BARU
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            {/* 3. APP HEADER BAR */}
            <div className="sticky top-0 bg-[#050212]/90 backdrop-blur-md z-40 border-b border-purple-950/15">
              
              <div className="px-4 py-4 flex items-center justify-between">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  <Menu className="w-5.5 h-5.5" />
                </button>

                <div className="text-center">
                  <div className="text-base font-black tracking-widest text-white font-orbitron">
                    GROCKGOLD
                  </div>
                  <div className="text-[8px] text-slate-500 tracking-wider font-extrabold mt-[-2px] uppercase">
                    A Randgold Resources Company
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleLanguage}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-0.5"
                  >
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                      {language}
                    </span>
                  </button>
                  <button
                    onClick={() => triggerModal(language === 'id' ? 'Belum ada notifikasi baru.' : 'No new notifications.', 'info')}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    <Bell className="w-4.5 h-4.5 text-purple-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. MAIN VIEWS SWITCH */}
            <div className="flex-1 px-4 py-3 space-y-4">

              {/* HOME VIEW */}
              {currentTab === 'home' && (
                isSyncing ? (
                  <HomeSkeleton />
                ) : (
                  <div className="space-y-4">
                    
                    {/* STATS GRID (WELCOME TICKER AT THE TOP) */}
                    <div className="pt-3.5 pb-6">
                      <WelcomeTicker memberCount={state.holders.length} isIndonesian={language === 'id'} />
                    </div>
                  
                  {/* MASTER BALANCE CARD */}
                  <div className="relative bg-gradient-to-br from-[#1b0b3a] via-[#09041a] to-[#03010c] border border-gold-primary/25 rounded-3xl p-5 shadow-2xl overflow-hidden group">
                    {/* Glowing Accent Orbs */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-radial-gradient from-gold-primary/10 to-transparent pointer-events-none rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition duration-500" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

                    {/* DYNAMIC MASTER BALANCE SECTION */}
                    <div className="bg-black/45 border border-purple-500/15 rounded-2xl p-4.5 mb-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold-primary/20 to-transparent" />
                      
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            {t.mainBalance}
                          </span>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        </div>
                        <button
                          onClick={() => setHideBalance(!hideBalance)}
                          className="text-purple-400 hover:text-white transition p-1 rounded hover:bg-white/5"
                        >
                          {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="text-2xl font-black text-gradient-gold font-orbitron tracking-wide mb-3 flex items-baseline gap-1">
                        {hideBalance ? '••••••••' : `Rp ${state.mainBalance.toLocaleString('id-ID')}`}
                        {!hideBalance && <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">IDR</span>}
                      </div>

                      {/* Animated Gold Hashrate SVG Sparkline */}
                      <div className="h-6 relative overflow-visible mt-1.5 mb-2.5 opacity-80">
                        <svg className="w-full h-full text-gold-primary/25 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <motion.path
                            d="M0 10 Q 15 3, 30 14 T 60 4 T 90 12 H 100"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          />
                          <motion.circle
                            cx="100"
                            cy="12"
                            r="2"
                            className="fill-gold-primary shadow-[0_0_8px_rgba(212,175,55,1)]"
                            animate={{ scale: [1, 1.6, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                        </svg>
                        <span className="absolute top-0 right-1 text-[8px] font-mono font-black text-emerald-400 tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {state.activeContracts > 0 ? '● ONLINE' : '○ STANDBY'}
                        </span>
                      </div>

                      {/* HIGH-TECH PROFIT METRICS AREA */}
                      <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3 mt-1">
                        {/* 💰 Total Profit Hari Ini */}
                        <div className="bg-purple-950/35 p-2.5 rounded-xl border border-purple-500/10 hover:border-purple-500/20 transition duration-300">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4.5 h-4.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                              <Coins className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                              {language === 'id' ? 'Profit Hari Ini' : 'Profit Today'}
                            </span>
                          </div>
                          <div className="text-xs font-black text-emerald-400 font-orbitron">
                            Rp {dailyYield.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wide">
                            {language === 'id' ? 'Est. Hasil Harian' : 'Est. Daily Yield'}
                          </div>
                        </div>

                        {/* ⚡ Hashrate Kecepatan */}
                        <div className="bg-purple-950/35 p-2.5 rounded-xl border border-purple-500/10 hover:border-purple-500/20 transition duration-300">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4.5 h-4.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                              <Cpu className="w-3 h-3 text-purple-400" />
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                              {language === 'id' ? 'Kecepatan Node' : 'Node Hashrate'}
                            </span>
                          </div>
                          <div className="text-xs font-black text-purple-300 font-orbitron">
                            {(state.activeContracts * 15.6).toFixed(1)} <span className="text-[8px] font-bold text-purple-400">GH/s</span>
                          </div>
                          <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wide">
                            {state.activeContracts} {language === 'id' ? 'Kontrak Aktif' : 'Active Units'}
                          </div>
                        </div>
                      </div>
                    </div>



                    {/* VIP / REWARDS HARVEST TRACKER - LUXURY PREMIUM "WELCOME BONUS" CARD */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1203] via-[#09041a] to-[#03010b] border-2 border-amber-500/35 rounded-3xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.18)] transition duration-300 hover:border-amber-400/50 group">
                      {/* Premium Glare / Light Ray Effect */}
                      <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-amber-500/15 to-transparent pointer-events-none rounded-full blur-xl group-hover:scale-125 transition duration-500" />
                      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-tr from-[#7209b7]/20 to-transparent pointer-events-none rounded-full blur-2xl" />
                      
                      {/* Ambient Shimmer Strip overlay */}
                      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-40 group-hover:animate-[shimmer_1.5s_infinite]" />

                      {/* Top Header Row */}
                      <div className="flex justify-between items-start mb-3.5 relative z-10">
                        <div>
                          {/* Glowing Elite Badge */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/25 to-yellow-500/10 border border-amber-500/35 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)] mb-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span className="text-[9.5px] font-black tracking-widest text-amber-300 uppercase font-sans">
                              {language === 'id' ? 'ELITE WELCOME BONUS' : 'ELITE WELCOME BONUS'}
                            </span>
                          </div>
                          
                          {/* Giant Majestic Amount with Gold Gradient */}
                          <div className="text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 tracking-tight font-orbitron flex items-baseline gap-1 drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
                            <span className="text-xs font-black text-amber-400/90 mr-0.5">Rp</span>
                            {CONFIG.WELCOME_BONUS_AMOUNT.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Interactive Info Button */}
                        <button
                          type="button"
                          onClick={() => setShowBonusSchemaModal(true)}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-[#271803] to-[#130735] hover:from-amber-500 hover:to-yellow-500 text-amber-400 hover:text-black flex items-center justify-center text-[10px] font-serif font-black transition-all duration-300 shadow-md border border-amber-500/35 active:scale-90"
                        >
                          i
                        </button>
                      </div>

                      {/* Description Text */}
                      <p className="text-[10px] text-slate-400/95 font-semibold leading-relaxed mb-4 relative z-10">
                        {language === 'id' 
                          ? 'Dapatkan subsidi dana penambangan langsung cair untuk mempercepat penambangan emas Anda setelah syarat terpenuhi!' 
                          : 'Get a direct mining capital grant instantly credited to supercharge your digital gold yield once requirements are met!'}
                      </p>

                      {/* Elegant Requirement Card */}
                      <div className="bg-black/55 border border-amber-500/20 rounded-2xl p-3 mb-4.5 relative overflow-hidden z-10">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        
                        <div className="text-[8.5px] text-amber-400 font-black tracking-widest uppercase mb-1.5 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{language === 'id' ? 'PERSYARATAN UTAMA' : 'MAIN REQUIREMENT'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-inner">
                            <Users className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <div className="text-[11.5px] text-slate-100 font-extrabold leading-tight">
                              {language === 'id' ? `Miliki ${CONFIG.REQUIRED_HOLDERS} Holder Aktif` : `Have ${CONFIG.REQUIRED_HOLDERS} Active Holders`}
                            </div>
                            <div className="text-[8.5px] text-slate-400 mt-0.5 leading-normal">
                              {language === 'id' ? 'Ajak rekan Anda mendaftar & aktifkan kontrak tambang' : 'Invite your partners to register and activate a mining contract'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar and counter */}
                      <div className="mb-4.5 relative z-10">
                        <div className="flex justify-between items-baseline mb-1.5 leading-none">
                          <span className="text-[8.5px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            {language === 'id' ? 'PROGRESS TARGET HOLDER' : 'HOLDER TARGET PROGRESS'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-black text-amber-400 font-orbitron">
                              {networkActiveCount} <span className="text-[9px] text-slate-500 font-sans font-bold">/ {CONFIG.REQUIRED_HOLDERS}</span>
                            </span>
                            <span className="text-[8.5px] font-bold text-slate-500">
                              ({Math.min(100, Math.round(bonusProgressRatio))}%)
                            </span>
                          </div>
                        </div>
                        
                        {/* Custom gold glowing progress bar */}
                        <div className="w-full h-3.5 bg-black/55 rounded-full overflow-hidden border border-amber-500/15 p-[2px] shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.5)] relative flex items-center justify-end pr-1"
                            style={{ width: `${bonusProgressRatio}%` }}
                          >
                            {bonusProgressRatio >= 15 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Button / Disbursed Banner */}
                      <div className="relative z-10">
                        {state.welcomeBonusClaimed ? (
                          <div className="w-full py-3 rounded-2xl text-[10.5px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>{language === 'id' ? 'DANA INVESTASI Rp 1.8M SUDAH CAIR' : 'Rp 1.8M INVESTMENT GRANT DISBURSED'}</span>
                          </div>
                        ) : canClaimWelcomeBonus ? (
                          <button
                            onClick={handleClaimWelcomeBonus}
                            className="w-full py-3.5 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:brightness-110 active:scale-[0.98] shadow-lg shadow-amber-500/30 cursor-pointer hover:shadow-amber-500/40 transform animate-pulse hover:animate-none"
                          >
                            <Gem className="w-4 h-4 text-black" />
                            <span>{language === 'id' ? 'KLAIM Rp 1.8 MILIAR SEKARANG' : 'CLAIM Rp 1.8 BILLION NOW'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowBonusSchemaModal(true)}
                            className="w-full py-3 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-[#120a28]/80 text-slate-400 border border-amber-500/15 hover:border-amber-400/35 hover:bg-[#160d32]/90 hover:text-white cursor-pointer group"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500/70 group-hover:scale-110 transition duration-300" />
                            <span>{language === 'id' ? 'PERSYARATAN BELUM TERPENUH' : 'REQUIREMENTS NOT YET MET'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DAILY MISSION INTERACTIVE CARD */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#0c051a] via-[#050212] to-[#010105] border border-cyan-500/20 rounded-3xl p-5 shadow-xl mt-4">
                      {/* Glow elements */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                            <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                              {language === 'id' ? 'Misi Harian' : 'Daily Missions'}
                            </h3>
                            <span className="text-[8px] text-slate-500 font-bold font-mono tracking-wide">3 SIMPLE TASKS FOR INSTANT REWARD</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] font-bold text-slate-500 block uppercase leading-none mb-0.5 font-sans">EST. VALUE</span>
                          <span className="text-[11px] font-black text-emerald-400 font-mono">Rp 5.000</span>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2.5 mb-4 relative z-10">
                        {/* Task 1: Log in today */}
                        <div className="p-2.5 rounded-2xl bg-black/45 border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-100 block truncate">
                                {language === 'id' ? 'Masuk Hari Ini' : 'Log in Today'}
                              </span>
                              <span className="text-[7.5px] text-slate-500 block">
                                {language === 'id' ? 'Mulai sesi harian Anda' : 'Start your daily terminal session'}
                              </span>
                            </div>
                          </div>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black font-mono">
                            DONE
                          </span>
                        </div>

                        {/* Task 2: Check Status */}
                        <div className="p-2.5 rounded-2xl bg-black/45 border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              dailyTaskCheck 
                                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                : 'bg-[#141026] border border-cyan-500/20'
                            }`}>
                              {dailyTaskCheck ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-100 block truncate">
                                {language === 'id' ? 'Periksa Terminal' : 'Check Status'}
                              </span>
                              <span className="text-[7.5px] text-slate-500 block">
                                {language === 'id' ? 'Verifikasi kestabilan hashrate tambang' : 'Verify the stable gold mine hashrate'}
                              </span>
                            </div>
                          </div>
                          {dailyTaskCheck ? (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black font-mono">
                              STABLE
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (isCheckingStatus) return;
                                setIsCheckingStatus(true);
                                setTimeout(() => {
                                  setDailyTaskCheck(true);
                                  setIsCheckingStatus(false);
                                  triggerModal(
                                    language === 'id' 
                                      ? '⚡ Status terminal verified! Hashrate berjalan dengan stabil.' 
                                      : '⚡ Terminal status verified! Hashrate running stable.',
                                    'success'
                                  );
                                }, 1200);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black text-[8px] font-bold tracking-wider transition cursor-pointer active:scale-95 shrink-0"
                            >
                              {isCheckingStatus ? '...' : 'CHECK'}
                            </button>
                          )}
                        </div>

                        {/* Task 3: Visit Market */}
                        <div className="p-2.5 rounded-2xl bg-black/45 border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              dailyTaskVisit 
                                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                : 'bg-[#141026] border border-cyan-500/20'
                            }`}>
                              {dailyTaskVisit ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-100 block truncate">
                                {language === 'id' ? 'Kunjungi Pasar' : 'Visit Market'}
                              </span>
                              <span className="text-[7.5px] text-slate-500 block">
                                {language === 'id' ? 'Lihat daftar kontrak penambangan emas' : 'Browse active gold mining contract list'}
                              </span>
                            </div>
                          </div>
                          {dailyTaskVisit ? (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black font-mono">
                              VISITED
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setDailyTaskVisit(true);
                                setCurrentTab('contract');
                                triggerModal(
                                  language === 'id' 
                                    ? 'Market ditinjau! Misi kunjungan pasar berhasil.' 
                                    : 'Market reviewed! Market visit mission successfully completed.',
                                  'success'
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black text-[8px] font-bold tracking-wider transition cursor-pointer active:scale-95 shrink-0"
                            >
                              VISIT
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Claim Reward Button */}
                      <div className="relative z-10">
                        {dailyTaskClaimed ? (
                          <div className="w-full py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{language === 'id' ? 'HADIAH HARIAN SUDAH DIAMBIL' : 'DAILY REWARD CLAIMED TODAY'}</span>
                          </div>
                        ) : (dailyTaskCheck && dailyTaskVisit) ? (
                          <button
                            onClick={() => {
                              const rewardAmount = 5000;
                              const newTx: Transaction = {
                                id: 'DLY-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                                type: 'reward',
                                amount: rewardAmount,
                                date: Date.now(),
                                description: 'Daily Tasks Completed Reward',
                              };

                              updateState(prev => ({
                                ...prev,
                                mainBalance: prev.mainBalance + rewardAmount,
                                totalEarned: prev.totalEarned + rewardAmount,
                                transactions: [newTx, ...prev.transactions],
                              }));

                              setDailyTaskClaimed(true);

                              triggerModal(
                                language === 'id'
                                  ? `🎁 HADIAH DIKLAIM!\n\nRp ${rewardAmount.toLocaleString('id-ID')} telah ditambahkan ke saldo utama Anda.`
                                  : `🎁 REWARD CLAIMED!\n\nRp ${rewardAmount.toLocaleString('id-ID')} has been credited to your main balance.`,
                                'success'
                              );
                            }}
                            className="w-full py-2.5 rounded-xl text-[9.5px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-400 to-cyan-500 text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>{language === 'id' ? 'AMBIL HADIAH Rp 5.000' : 'CLAIM Rp 5,000 REWARD'}</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <Lock className="w-3 h-3" />
                            <span>{language === 'id' ? 'SELESAIKAN SEMUA MISI UNTUK KLAIM' : 'COMPLETE ALL TASKS TO UNLOCK'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QUICK MENU GRID - PREMIUM NEAT BOXES */}
                    <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-[#291754]/30 relative z-10">
                      {[
                        {
                          id: 'community',
                          label: 'Community',
                          sub: language === 'id' ? 'Grup & Jaringan' : 'Group & Network',
                          icon: Users,
                          color: 'text-emerald-400',
                          glow: 'shadow-emerald-950/10',
                          borderColor: 'hover:border-emerald-500/30 border-[#1f1b3e]',
                          bg: 'bg-gradient-to-br from-[#0c1816] to-[#040810]',
                        },
                        {
                          id: 'leaderboard',
                          label: 'Leaderboard',
                          sub: language === 'id' ? 'Peringkat Volume' : 'Volume Ranks',
                          icon: Trophy,
                          color: 'text-yellow-400',
                          glow: 'shadow-yellow-950/10',
                          borderColor: 'hover:border-yellow-500/30 border-[#1f1b3e]',
                          bg: 'bg-gradient-to-br from-[#18140c] to-[#080610]',
                        },
                        {
                          id: 'luckyspin',
                          label: 'Lucky Spin',
                          sub: language === 'id' ? 'Putar & Menang' : 'Spin & Win Gold',
                          icon: Compass,
                          color: 'text-fuchsia-400',
                          glow: 'shadow-fuchsia-950/10',
                          borderColor: 'hover:border-fuchsia-500/30 border-[#1f1b3e]',
                          bg: 'bg-gradient-to-br from-[#160c24] to-[#060410]',
                        },
                        {
                          id: 'network',
                          label: 'Network',
                          sub: language === 'id' ? 'Jaringan Tim' : 'Downline Network',
                          icon: Network,
                          color: 'text-yellow-400',
                          glow: 'shadow-yellow-950/10',
                          borderColor: 'hover:border-yellow-500/30 border-[#1f1b3e]',
                          bg: 'bg-gradient-to-br from-[#18140c] to-[#080610]',
                        },
                      ].map((menu) => {
                        const Icon = menu.icon;
                        return (
                          <button
                            key={menu.id}
                            onClick={() => {
                              if (menu.id === 'community') {
                                setCurrentTab('community');
                              } else if (menu.id === 'leaderboard') {
                                setCurrentTab('leaderboard');
                              } else if (menu.id === 'luckyspin') {
                                setCurrentTab('luckyspin');
                              } else if (menu.id === 'network') {
                                setCurrentTab('network');
                              }
                            }}
                            className={`flex flex-col items-start p-3 rounded-xl ${menu.bg} border ${menu.borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left relative overflow-hidden group shadow-md ${menu.glow} cursor-pointer`}
                          >
                            <div className="absolute right-0 top-0 w-10 h-10 bg-white/[0.01] group-hover:bg-white/[0.03] rounded-full blur-md transition duration-300 translate-x-3 -translate-y-3" />
                            
                            <div className="flex items-center justify-between w-full mb-1">
                              <div className="w-7 h-7 rounded-lg bg-black/45 border border-white/5 flex items-center justify-center">
                                <Icon className={`w-3.5 h-3.5 ${menu.color} group-hover:scale-110 transition duration-300`} />
                              </div>
                              <span className="text-[10px] text-slate-500 group-hover:text-white transition-colors">➔</span>
                            </div>

                            <span className="text-[11.5px] font-black text-white leading-tight">
                              {menu.label}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400/80 mt-0.5 tracking-wide uppercase">
                              {menu.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>



                  {/* CAPPING PROGRESS PANEL */}
                  <div className="bg-[#0b051a] border border-purple-500/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider">
                          {t.cappingProgress}
                        </div>
                        <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          {t.maxEarnings} (250% Max)
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase ${
                        isCappedLimitMet
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : cappingRatio > 80
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isCappedLimitMet ? 'CAPPED' : 'IN PROGRESS'}
                      </div>
                    </div>

                    {/* Circular meter layout & stats detail split */}
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        {/* Conic progress meter wrapper */}
                        <div
                          className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
                          style={{
                            background: `conic-gradient(var(--color-gold-primary) ${cappingRatio}%, rgba(255,255,255,0.03) ${cappingRatio}%)`,
                          }}
                        />
                        <div className="absolute inset-1 bg-[#0b051a] rounded-full border border-purple-950/20" />
                        <div className="relative z-10 text-center">
                          <div className="text-xl font-black text-yellow-400 font-orbitron leading-none">
                            {Math.round(cappingRatio)}%
                          </div>
                          <span className="text-[7px] text-slate-400 font-bold block mt-1">OF 250%</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2.5 text-xs font-semibold">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-slate-400 text-[10px]">{t.earned}</span>
                          <span className="text-white font-bold">Rp {totalEarned.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-slate-400 text-[10px]">{t.maxEarnings}</span>
                          <span className="text-white font-bold">Rp {maxPossibleEarnings.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">{t.remaining}</span>
                          <span className="text-amber-500 font-bold">
                            Rp {Math.max(0, maxPossibleEarnings - totalEarned).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Footer */}
                    <div className="mt-5 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-2">
                        <span>Rp {totalEarned.toLocaleString('id-ID')}</span>
                        <span>Rp {maxPossibleEarnings.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 via-gold-primary to-yellow-300"
                          style={{ width: `${cappingRatio}%` }}
                        />
                      </div>

                      {/* Yield Claim Action */}
                      <button
                        onClick={handleClaimYield}
                        disabled={claimCooldownText !== '' || state.activeContracts === 0 || isCappedLimitMet}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-2 mt-4 ${
                          claimCooldownText !== ''
                            ? 'bg-slate-900 border border-white/5 text-slate-400 cursor-not-allowed'
                            : isCappedLimitMet
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15 cursor-not-allowed'
                            : 'bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 hover:brightness-110 shadow-lg shadow-gold-primary/25 text-black'
                        }`}
                      >
                        {claimCooldownText !== '' ? (
                          <>
                            <ClockIcon className="w-4 h-4 animate-pulse" />
                            <span>{language === 'id' ? `Klaim dalam ${claimCooldownText}` : `Claim in ${claimCooldownText}`}</span>
                          </>
                        ) : isCappedLimitMet ? (
                          <span>CAPPING SELESAI</span>
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            <span>{t.claimReward} ({(CONFIG.DAILY_REWARD_PERCENT * 100).toFixed(0)}%)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>



                </div>
                )
              )}

              {/* 👥 COMMUNITY VIEW */}
              {currentTab === 'community' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-purple-500/15 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-xs font-black tracking-widest text-white uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-orbitron">
                      {language === 'id' ? 'KOMUNITAS RESMI' : 'OFFICIAL COMMUNITY'}
                    </h2>
                  </div>

                  {/* Member Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-2.5 text-center">
                      <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">{language === 'id' ? 'Anggota' : 'Members'}</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">124.8K</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-2.5 text-center">
                      <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">{language === 'id' ? 'Aktif' : 'Active'}</span>
                      <span className="text-xs font-black text-cyan-400 font-mono">42.9K</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-2.5 text-center">
                      <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Hashrate</span>
                      <span className="text-xs font-black text-yellow-500 font-mono">4.82 EH/s</span>
                    </div>
                  </div>

                  {/* Social Groups Grid */}
                  <div className="bg-[#0b0519] border border-emerald-500/15 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-2">
                      {language === 'id' ? 'Gabung Komunitas Kami' : 'Join Our Communities'}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setSharedReferral(true);
                          triggerModal(language === 'id' ? '🎉 Berhasil terhubung ke WhatsApp VIP Lounge!' : '🎉 Connected to WhatsApp VIP Lounge!', 'success');
                        }}
                        className="w-full p-3 rounded-2xl bg-[#091f14] border border-emerald-500/20 hover:border-emerald-400/40 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white leading-none">WhatsApp VVIP Lounge</div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">{language === 'id' ? 'Khusus Investor Premium' : 'Premium Investors Only'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-black group-hover:translate-x-1 transition-transform">JOIN ➔</span>
                      </button>

                      <button
                        onClick={() => {
                          setSharedReferral(true);
                          triggerModal(language === 'id' ? '🎉 Berhasil terhubung ke Telegram GrockGold Official!' : '🎉 Connected to Telegram GrockGold Official!', 'success');
                        }}
                        className="w-full p-3 rounded-2xl bg-[#0a1829] border border-blue-500/20 hover:border-blue-400/40 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Send className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white leading-none">Telegram GrockGold Indo</div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">48,203 Active Subscribers</span>
                          </div>
                        </div>
                        <span className="text-xs text-blue-400 font-black group-hover:translate-x-1 transition-transform">JOIN ➔</span>
                      </button>

                      <button
                        onClick={() => {
                          setSharedReferral(true);
                          triggerModal(language === 'id' ? '🎉 Berhasil terhubung ke Discord Server Hub!' : '🎉 Connected to Discord Server Hub!', 'success');
                        }}
                        className="w-full p-3 rounded-2xl bg-[#110e24] border border-indigo-500/20 hover:border-indigo-400/40 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white leading-none">Discord Global Server</div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 block">12,410 Online Hashing Leaders</span>
                          </div>
                        </div>
                        <span className="text-xs text-indigo-400 font-black group-hover:translate-x-1 transition-transform">JOIN ➔</span>
                      </button>
                    </div>
                  </div>

                  {/* Announcement Official Feed */}
                  <div className="bg-[#0b0519] border border-white/5 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      {language === 'id' ? 'PENGUMUMAN RESMI' : 'OFFICIAL ANNOUNCEMENTS'}
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <div className="text-[10px] font-black text-amber-400 mb-0.5">✨ GROCKGOLD PARTNERS WITH WEST AFRICA MINING EXPO</div>
                        <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed">
                          {language === 'id' 
                            ? 'Mulai Juli 2026, PT GrockGold resmi mensponsori Expo Tambang Barat untuk ekspansi unit ekskavasi EXC-900.' 
                            : 'Starting July 2026, GrockGold sponsors the West Africa Mining Expo to expand cloud-based mining operations.'}
                        </p>
                        <span className="text-[8px] text-slate-500 block mt-2 font-mono">2026-07-15 10:24</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                        <div className="text-[10px] font-black text-cyan-400 mb-0.5">⚡ SERVER CLUSTER EXC-900 LAUNCHED</div>
                        <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed">
                          {language === 'id' 
                            ? 'Meningkatkan hashrate rata-rata global sebesar +25%. Proses sinkronisasi klaim saldo harian sekarang berjalan 2x lebih cepat.' 
                            : 'Increases global hashing bandwidth by +25%. Daily balance claim calculations are now twice as fast.'}
                        </p>
                        <span className="text-[8px] text-slate-500 block mt-2 font-mono">2026-07-14 18:40</span>
                      </div>
                    </div>
                  </div>

                  {/* Chatroom Live Discussion */}
                  <div className="bg-[#0b0519] border border-purple-500/10 rounded-3xl p-4 shadow-xl space-y-3 flex flex-col h-[320px]">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>💬 {language === 'id' ? 'Obrolan Komunitas (Live)' : 'Community Chat (Live)'}</span>
                      <span className="text-[8px] text-emerald-400 animate-pulse">● 4,921 ONLINE</span>
                    </div>

                    {/* Chat Messages Scrolling viewport */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                      {communityMessages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-2.5 ${msg.isSelf ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-black border ${msg.isSelf ? 'bg-gradient-to-r from-yellow-300 to-gold-primary border-yellow-400 text-black' : 'bg-purple-900/45 text-purple-200 border-purple-800/30'}`}>
                            {msg.initials}
                          </div>
                          <div className={`flex flex-col max-w-[70%] ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                            <span className="text-[8px] font-black text-slate-400 mb-0.5 flex items-center gap-1">
                              @{msg.user}
                              {msg.user === 'admin' && <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1 rounded text-[7px]">STAFF</span>}
                            </span>
                            <div className={`p-2.5 rounded-2xl text-[10px] font-semibold leading-normal ${msg.isSelf ? 'bg-purple-800/20 text-yellow-300 border border-purple-500/20 rounded-tr-none' : 'bg-white/[0.02] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[7.5px] text-slate-500 mt-1 font-mono">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input Field Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!chatInput.trim()) return;
                        const now = new Date();
                        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        const newMsg = {
                          id: Date.now().toString(),
                          user: state.username.toLowerCase(),
                          text: chatInput,
                          time: timeStr,
                          initials: state.username.slice(0, 2).toUpperCase(),
                          isSelf: true
                        };
                        setCommunityMessages(prev => [...prev, newMsg]);
                        setChatInput('');
                        
                        // Fake Auto Response from random user or staff in 2 seconds
                        setTimeout(() => {
                          const botNames = ['andi_wijaya', 'sari_grock', 'm_ikbal', 'admin'];
                          const botInitials = ['AW', 'SG', 'MI', 'AD'];
                          const botResponses = [
                            'Mantap gan! Hashing hashrate saya hari ini tembus 12% profit harian.',
                            'Ada yang tahu min WD hari ini berapa ya?',
                            'Min WD cuma Rp 100.000 saja kak, prosesnya super instan langsung masuk!',
                            'Selamat bergabung semuanya! Silakan hubungi Telegram Group untuk panduan claim welcome bonus 1.8M.'
                          ];
                          const idx = Math.floor(Math.random() * botResponses.length);
                          setCommunityMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            user: botNames[idx],
                            text: botResponses[idx],
                            time: timeStr,
                            initials: botInitials[idx],
                            isSelf: false
                          }]);
                        }, 2000);
                      }}
                      className="flex gap-2 pt-2 border-t border-white/5"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={language === 'id' ? 'Ketik pesan Anda...' : 'Type message here...'}
                        className="flex-1 bg-black/55 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40"
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-gradient-to-r from-yellow-300 to-gold-primary text-black font-extrabold rounded-xl transition hover:brightness-110 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-black" />
                      </button>
                    </form>
                  </div>
                </div>
              )}



              {/* 🎡 LUCKY SPIN VIEW */}
              {currentTab === 'luckyspin' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-purple-500/15 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-xs font-black tracking-widest text-white uppercase bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-orbitron">
                      {language === 'id' ? 'RODA BERHADIAH' : 'LUCKY SPIN WHEEL'}
                    </h2>
                  </div>

                  {/* Free Spin Timer / Ticket Counter */}
                  <div className="bg-gradient-to-br from-[#1b082e] to-[#0a0314] border border-fuchsia-500/20 rounded-3xl p-4 shadow-xl flex justify-between items-center">
                    <div>
                      <span className="text-[8.5px] font-black tracking-widest text-fuchsia-400 block uppercase mb-1">{language === 'id' ? 'TIKET PUTARAN' : 'AVAILABLE SPINS'}</span>
                      <div className="text-xl font-black text-white font-orbitron flex items-center gap-1.5 leading-none">
                        🎟️ {spinTickets} <span className="text-[9.5px] text-slate-500 font-sans font-extrabold uppercase">Tickets</span>
                      </div>
                    </div>
                    <div className="bg-black/55 border border-white/5 rounded-2xl px-3.5 py-2.5 text-right">
                      <span className="text-[7.5px] text-slate-500 font-bold block uppercase mb-0.5">{language === 'id' ? 'TIKET GRATIS BERIKUTNYA' : 'NEXT FREE SPIN'}</span>
                      <span className="text-[11px] font-mono font-black text-amber-400 animate-pulse">02:45:12</span>
                    </div>
                  </div>

                  {/* Physical Rotating Wheel Canvas Area */}
                  <div className="bg-[#0b0519] border border-purple-500/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Glowing outer ring */}
                    <div className="relative w-56 h-56 rounded-full border-4 border-yellow-500 bg-[#120735] shadow-[0_0_25px_rgba(234,179,8,0.45)] flex items-center justify-center overflow-hidden mb-6 z-10"
                      style={{ 
                        transform: `rotate(${spinRotation}deg)`,
                        transition: isSpinning ? 'transform 3.6s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none'
                      }}
                    >
                      {/* Outer Ring Circle details */}
                      <div className="absolute inset-0 border-8 border-purple-900/40 pointer-events-none z-20" />
                      
                      {/* segments */}
                      {SPIN_ITEMS.map((item, idx) => {
                        const angle = idx * 45;
                        return (
                          <div 
                            key={idx}
                            className="absolute inset-0 origin-center"
                            style={{ transform: `rotate(${angle}deg)` }}
                          >
                            {/* Line separator */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-1/2 bg-yellow-500/25 origin-bottom z-10" />
                            
                            {/* Segment text label rotating to fit segment triangle */}
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-center"
                              style={{ 
                                transform: 'rotate(22.5deg)',
                                color: item.type === 'zonk' ? '#94a3b8' : item.type === 'boost' ? '#38bdf8' : '#facc15'
                              }}
                            >
                              <div>{item.label}</div>
                              <div className="text-[6px] opacity-40 leading-none mt-0.5">{item.type === 'zonk' ? '❌' : '💰'}</div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Golden Spinner Center Pin Hub */}
                      <div className="absolute w-12 h-12 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border-2 border-white/90 z-30 shadow-2xl flex items-center justify-center font-black text-black text-[9px] tracking-wide uppercase leading-none">
                        GGM
                      </div>
                    </div>

                    {/* Wheel pointer at the top */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 z-30 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                    {/* SPIN TRIGGER BUTTON */}
                    <button
                      onClick={() => {
                        if (isSpinning) return;
                        if (spinTickets <= 0) {
                          triggerModal(
                            language === 'id'
                              ? '❌ TIKET HABIS\n\nTiket Lucky Spin Anda sudah habis. Silakan tunggu hitung mundur atau selesaikan misi harian untuk mendapatkan lebih banyak tiket spin gratis!'
                              : '❌ OUT OF TICKETS\n\nYour Lucky Spin tickets have run out. Please wait for the countdown or complete missions to get more free spin tickets!',
                            'warning'
                          );
                          return;
                        }

                        const randomIndex = Math.floor(Math.random() * SPIN_ITEMS.length);
                        const degreePerSegment = 360 / SPIN_ITEMS.length;
                        const extraSpins = 6;
                        const targetRotation = spinRotation + (extraSpins * 360) + (360 - (randomIndex * degreePerSegment)) - (spinRotation % 360);

                        setIsSpinning(true);
                        setSpinRotation(targetRotation);
                        setSpinPrizeIndex(randomIndex);
                        setSpinTickets(prev => prev - 1);
                        setSpinCount(prev => prev + 1);

                        setTimeout(() => {
                          setIsSpinning(false);
                          const prize = SPIN_ITEMS[randomIndex];
                          
                          const newHistoryItem = {
                            id: Date.now().toString(),
                            prize: prize.label,
                            date: Date.now(),
                            success: prize.type !== 'zonk'
                          };
                          setLuckySpinHistory(prev => [newHistoryItem, ...prev]);

                          if (prize.type === 'cash') {
                            const newTx: Transaction = {
                              id: 'SPN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                              type: 'reward',
                              amount: prize.value,
                              date: Date.now(),
                              description: language === 'id' ? `Hadiah Lucky Spin Wheel` : `Lucky Spin Wheel Prize`,
                            };
                            
                            updateState(prev => ({
                              ...prev,
                              mainBalance: prev.mainBalance + prize.value,
                              totalEarned: prev.totalEarned + prize.value,
                              transactions: [newTx, ...prev.transactions],
                            }), true);

                            triggerModal(
                              language === 'id'
                                ? `🎉 SELAMAT!\n\nAnda memenangkan Saldo sebesar Rp ${prize.value.toLocaleString('id-ID')} dari Lucky Spin Wheel!\n\nHadiah telah ditambahkan ke Saldo Utama Anda.`
                                : `🎉 CONGRATULATIONS!\n\nYou won a Balance of Rp ${prize.value.toLocaleString('id-ID')} from the Lucky Spin Wheel!\n\nThe prize has been added to your Main Balance.`,
                              'success'
                            );
                          } else if (prize.type === 'boost') {
                            setBoostTimeLeft(300);
                            setShowBoosterRipple(true);
                            triggerModal(
                              language === 'id'
                                ? `⚡ BOOSTER AKTIF!\n\nAnda memenangkan Booster Kecepatan Tambang ${prize.value}x selama 5 menit!\n\nKecepatan penambangan kontrak Anda meningkat secara masif!`
                                : `⚡ BOOSTER ACTIVE!\n\nYou won a ${prize.value}x Mining Speed Booster for 5 minutes!\n\nYour mining speed has increased massively!`,
                              'success'
                            );
                          } else {
                            triggerModal(
                              language === 'id'
                                ? `😢 ZONK!\n\nSayang sekali, putaran Anda mendarat di Zonk. Jangan menyerah, silakan coba lagi!`
                                : `😢 ZONK!\n\nBad luck! Your spin landed on Zonk. Don't give up, try again!`,
                              'info'
                            );
                          }
                        }, 3600);
                      }}
                      disabled={isSpinning || spinTickets <= 0}
                      className={`w-full max-w-[200px] py-3.5 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-lg ${isSpinning ? 'bg-purple-950 border border-white/5 text-slate-500 cursor-not-allowed' : spinTickets === 0 ? 'bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-500 text-black hover:brightness-110 active:scale-95 cursor-pointer shadow-yellow-500/20'}`}
                    >
                      {isSpinning ? (language === 'id' ? 'MEMUTAR...' : 'SPINNING...') : spinTickets === 0 ? (language === 'id' ? 'TIKET HABIS' : 'OUT OF TICKETS') : (language === 'id' ? 'PUTAR SEKARANG' : 'SPIN NOW')}
                    </button>
                  </div>

                  {/* Possible Prizes Table list */}
                  <div className="bg-[#0b0519] border border-white/5 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'id' ? 'Daftar Hadiah Tersedia' : 'Available Prizes & Odds'}</div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-2 rounded-xl border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{language === 'id' ? 'Rp 50.000 Tunai' : 'Rp 50,000 Cash'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-2 rounded-xl border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                        <span>{language === 'id' ? 'Boost Tambang 10x' : '10x Mine Boost'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-2 rounded-xl border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{language === 'id' ? 'Rp 25.000 Tunai' : 'Rp 25,000 Cash'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-2 rounded-xl border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                        <span>{language === 'id' ? 'Boost Tambang 5x' : '5x Mine Boost'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Spin Result History */}
                  <div className="bg-[#0b0519] border border-white/5 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Riwayat Putaran Anda' : 'Your Spin History'}</div>
                    
                    <div className="space-y-2">
                      {luckySpinHistory.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.01] border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🎟️</span>
                            <span className="text-[10px] font-black text-white">{language === 'id' ? 'Putaran Berhasil' : 'Successful Spin'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black ${item.success ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {item.prize}
                            </span>
                            <span className="text-[8px] text-slate-505 font-mono">
                              {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ⚡ LIVE MINING VIEW */}
              {currentTab === 'livemining' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-purple-500/15 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-xs font-black tracking-widest text-white uppercase bg-gradient-to-r from-yellow-400 via-gold-primary to-yellow-600 bg-clip-text text-transparent font-orbitron">
                      {language === 'id' ? 'LIVE MINING TERMINAL' : 'LIVE MINING TERMINAL'}
                    </h2>
                  </div>

                  {/* LIVE GOLD SPOT MARKET CHART & GLOBAL REAL-TIME FEED */}
                  <GoldMarketChart language={language} />

                  {/* LIVE MINING CONTAINER */}
                  <div id="liveMiningContainer" className="bg-[#0b051a] border border-purple-500/10 rounded-3xl p-5 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Cpu className={`w-3.5 h-3.5 ${state.activeContracts > 0 ? 'text-emerald-400 animate-spin' : 'text-rose-500'}`} />
                          {state.activeContracts > 0 ? t.miningSystemActive : t.miningSystemInactive}
                        </div>
                        <div className="text-lg font-black text-gradient-gold font-orbitron mt-1">
                          {state.goldProduction.toFixed(4)} oz
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{t.goldProdToday}</div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase flex items-center gap-1.5 ${
                        state.activeContracts > 0
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${state.activeContracts > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                        {state.activeContracts > 0 ? 'RUNNING' : 'INACTIVE'}
                      </div>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-4 flex justify-between text-center">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-0.5">{t.efficiency}</span>
                        <span className="text-xs font-black text-white">{state.activeContracts > 0 ? '100%' : '0%'}</span>
                      </div>
                      <div className="w-[1px] bg-white/5" />
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-0.5">{t.fleetActive}</span>
                        <span className="text-xs font-black text-white">{state.activeContracts} Unit</span>
                      </div>
                      <div className="w-[1px] bg-white/5" />
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-0.5">CYCLE STEP</span>
                        <span className="text-xs font-black text-purple-400">{Math.round(state.cyclePercent)}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-900 border border-purple-900/15 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 via-gold-primary to-yellow-300 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        style={{ width: `${state.cyclePercent}%` }}
                      />
                    </div>

                    {/* READY TO HARVEST (PENDING YIELD) WIDGET */}
                    <div 
                      onClick={() => setHarvestModalOpen(true)}
                      className="bg-[#120a26] border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3 relative overflow-hidden cursor-pointer group transition-all duration-300 shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/10"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                      <div className="flex-1 min-w-0 text-left relative z-10">
                        <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-1 tracking-wider">
                          {language === 'id' ? 'Hasil Tambang Siap Panen (Pending Yield)' : 'Ready to Harvest (Pending Yield)'}
                        </span>
                        <div className="text-xl font-black text-emerald-400 font-orbitron flex items-center gap-2">
                          Rp {state.pendingMiningReward.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-wide animate-pulse">
                            {language === 'id' ? 'KLAIM' : 'CLAIM'}
                          </span>
                        </div>
                        {state.activeContracts > 0 && !isCappedLimitMet ? (
                          <p className="text-[9px] text-slate-400 font-bold mt-1 leading-relaxed">
                            +{((state.activeContracts * CONFIG.PRICE_PER_UNIT * CONFIG.DAILY_REWARD_PERCENT) / 86400).toLocaleString('id-ID', { minimumFractionDigits: 4 })} Rp/s dipindahkan ke mining system aktif
                          </p>
                        ) : (
                          <p className="text-[9px] text-slate-500 font-semibold mt-1 leading-relaxed">
                            {language === 'id' ? 'Sistem mining nonaktif (Miliki kontrak aktif untuk memicu)' : 'Mining system inactive (Own active contracts to trigger)'}
                          </p>
                        )}
                      </div>
                      
                      {/* Harvest Hub Interactive Action Icon */}
                      <div className="relative z-10 w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all duration-300">
                        <Coins className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
                      </div>
                    </div>

                    {/* EXC-700 CLOUD EXCAVATOR BOOSTER PANEL */}
                    <div className="bg-black/25 border border-purple-950/40 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3.5 relative overflow-hidden">
                      {/* Central Interactive Gear / Haptic Touch Core */}
                      <div className="relative flex items-center justify-center w-14 h-14 shrink-0 cursor-pointer group" onClick={handleTapBooster}>
                        {/* Hashing Energy Halo */}
                        <div className={`absolute inset-0 rounded-full border border-dashed ${
                          boostTimeLeft > 0 
                            ? 'border-yellow-400 animate-spin' 
                            : boosterCooldownActive 
                              ? 'border-amber-500/40 animate-spin' 
                              : 'border-purple-500/30'
                        } transition-all`} style={{ animationDuration: boostTimeLeft > 0 ? '3s' : boosterCooldownActive ? '30s' : '15s' }} />
                        
                        {/* Haptic Core Button */}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          boostTimeLeft > 0 
                            ? 'bg-gradient-to-tr from-yellow-300 to-yellow-600 text-black shadow-[0_0_12px_rgba(250,204,21,0.55)] scale-105' 
                            : boosterCooldownActive 
                              ? 'bg-amber-950/40 border border-amber-500/20 text-amber-500/60'
                              : 'bg-purple-950/55 border border-purple-500/20 text-gold-primary hover:bg-purple-900/40 group-hover:scale-105'
                        }`}>
                          <Cpu className={`w-4.5 h-4.5 ${boostTimeLeft > 0 ? 'animate-pulse text-black' : ''}`} />
                        </div>

                        {/* Interactive Click/Tap Ripple Effect */}
                        <AnimatePresence>
                          {showBoosterRipple && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0.8 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.45 }}
                              className="absolute w-12 h-12 rounded-full border-2 border-gold-primary pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                            EXC-700 TURBO ACCELERATOR
                          </span>
                          {boostTimeLeft > 0 ? (
                            <span className="text-[8px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">
                              +50% HASH SPEED
                            </span>
                          ) : boosterCooldownActive ? (
                            <span className="text-[8.5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                              COOLDOWN
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                          {language === 'id' ? 'Ketuk roda gigi untuk memicu putaran cepat kompresor hashing 15 detik.' : 'Tap the active core gears to accelerate cloud hashing compressor speeds for 15 seconds.'}
                        </p>
                        
                        {/* Boost Dynamic Progress bar */}
                        {boostTimeLeft > 0 ? (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[8px] text-yellow-400 font-black">
                              <span>ACTIVE HARVEST SPEEDUP</span>
                              <span>{boostTimeLeft} DETIK</span>
                            </div>
                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 transition-all duration-1000 ease-linear" style={{ width: `${(boostTimeLeft / 15) * 100}%` }} />
                            </div>
                          </div>
                        ) : boosterCooldownActive ? (
                          <div className="mt-2">
                            <button
                              onClick={handleTapBooster}
                              className="w-full px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg text-[8.5px] font-black uppercase transition tracking-wider flex items-center justify-between"
                            >
                              <span>{language === 'id' ? 'COOLDOWN AKTIF' : 'COOLDOWN ACTIVE'}</span>
                              <span className="font-mono text-[9px] bg-amber-500/20 px-1.5 rounded font-bold">{boosterCooldownStr}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleTapBooster}
                            className="mt-2 px-2.5 py-1 bg-gold-primary/10 hover:bg-gold-primary/20 border border-gold-primary/20 text-gold-primary rounded-lg text-[8.5px] font-black uppercase transition tracking-wider"
                          >
                            {language === 'id' ? 'AKTIFKAN TURBO BOOST' : 'ENGAGE TURBO BOOST'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Operational Mines banner */}
                    <div className="bg-black/20 border border-purple-950/20 rounded-2xl p-3.5">
                      <div className="text-[9px] font-extrabold text-gold-primary tracking-widest text-center uppercase mb-2.5">
                        {t.operationalSites}
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[8px] font-bold text-center">
                        {['🇿🇦 S. Africa', '🇬🇭 Ghana', '🇲🇱 Mali', '🇹🇿 Tanzania'].map((site) => (
                          <div key={site} className="py-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-slate-300">
                            {site}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN PANEL VIEW REMOVED FROM NESTED TABS */}

              {/* CONTRACT STORE VIEW */}
              {currentTab === 'contract' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.contractStore}</h2>
                  </div>

                  <div className="bg-gradient-to-tr from-[#251b10] to-[#120a26] border border-gold-primary/30 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                    <div className="text-left">
                      <div className="text-[10px] font-extrabold text-gold-primary uppercase tracking-widest mb-1">
                        {t.availableBalance}
                      </div>
                      <div className="text-xl font-black text-white font-orbitron">
                        Rp {state.mainBalance.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentTab('deposit')}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-gold-primary text-black font-extrabold rounded-xl text-xs transition cursor-pointer hover:brightness-110"
                    >
                      + TOP UP
                    </button>
                  </div>

                  {/* Stock Contract Specs Product Card - Positioned at the top as requested */}
                  <div className="bg-gradient-to-b from-[#140b28] via-[#0d071d] to-[#07030e] border border-gold-primary/25 rounded-3xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl" />
                    
                    <div className="border-b border-white/5 pb-4 mb-4 text-left">
                      <div className="text-sm font-black text-gradient-gold uppercase tracking-widest mb-1.5 font-orbitron flex items-center gap-1.5">
                        <Coins className="w-4.5 h-4.5 text-yellow-400" />
                        {t.stockContract}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {t.contractDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="bg-black/30 border border-gold-primary/20 rounded-2xl p-4 text-center flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black tracking-wider text-gold-primary block mb-3">1 STOCK UNIT</span>
                        <div className="relative w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 ring-2 ring-gold-primary/10">
                          <Ticket className="w-6 h-6 text-purple-400 animate-pulse" />
                          <Coins className="w-3.5 h-3.5 text-gold-primary absolute bottom-0 right-0" />
                        </div>
                        <span className="text-[9px] text-slate-400 block mb-1">{t.price}</span>
                        <div className="text-lg font-black text-white">Rp {CONFIG.PRICE_PER_UNIT.toLocaleString('id-ID')}</div>
                        <span className="text-[8px] text-slate-400 uppercase font-bold">{t.perUnit}</span>
                      </div>

                      <div className="bg-black/25 border border-purple-500/15 rounded-2xl p-4 text-left">
                        <div className="text-center bg-purple-950/20 rounded-xl py-2 mb-3 border border-purple-500/10">
                          <span className="text-[8px] text-gold-primary font-bold block mb-0.5">CAPPING UNIT</span>
                          <span className="text-lg font-black text-purple-300">{(CONFIG.CAPPING_PERCENT * 100).toFixed(0)}%</span>
                          <div className="text-[9px] text-slate-400 font-bold mt-1">
                            {t.maxEarnings} = Rp {(CONFIG.PRICE_PER_UNIT * CONFIG.CAPPING_PERCENT).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <ul className="text-[9px] font-semibold text-slate-300 space-y-1.5 list-disc pl-3 text-left">
                          <li>Daily Yield <strong className="text-emerald-400">{(CONFIG.DAILY_REWARD_PERCENT * 100).toFixed(0)}% (Rp {(CONFIG.PRICE_PER_UNIT * CONFIG.DAILY_REWARD_PERCENT).toLocaleString('id-ID')})</strong></li>
                          <li>Contract terminates at {(CONFIG.CAPPING_PERCENT * 100).toFixed(0)}% ceiling</li>
                          <li>Frictionless instant automated daily mining harvesting</li>
                        </ul>
                      </div>
                    </div>

                    {/* Quantity selectors & buy button */}
                    <div className="mt-5 pt-4 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-2xl p-3">
                        <span className="text-xs font-black text-white tracking-wide">{t.qty}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustContractQty(-1)}
                            className="w-8 h-8 rounded-xl bg-purple-900/20 border border-purple-500/25 flex items-center justify-center text-white hover:bg-purple-900/40 transition cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-extrabold text-white w-6 text-center">{contractQty}</span>
                          <button
                            onClick={() => adjustContractQty(1)}
                            className="w-8 h-8 rounded-xl bg-purple-900/20 border border-purple-500/25 flex items-center justify-center text-white hover:bg-purple-900/40 transition cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-semibold py-1">
                        <span className="text-slate-400">{t.totalPayment}</span>
                        <span className="text-lg font-black text-white">
                          Rp {(contractQty * CONFIG.PRICE_PER_UNIT).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        onClick={handlePurchaseContract}
                        className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/35 flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 cursor-pointer"
                      >
                        <ShoppingCart className="w-4.5 h-4.5" />
                        {t.buyNow}
                      </button>
                    </div>
                  </div>

                  {/* PORTFOLIO PANEL - Moved to Contract Page and beautifully redesigned */}
                  <div className="bg-gradient-to-b from-[#110724] to-[#0a0414] border border-gold-primary/20 rounded-3xl p-5 shadow-[0_0_25px_rgba(234,179,8,0.06)]">
                    <div className="text-xs font-black bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 bg-clip-text text-transparent tracking-widest mb-4 uppercase text-left flex items-center gap-2 font-orbitron border-b border-white/5 pb-2">
                      <Briefcase className="w-4.5 h-4.5 text-yellow-400" />
                      {t.portfolio}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">{t.portfolioValue}</span>
                        <div className="text-sm font-black text-gradient-gold">Rp {totalPortfolioValue.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">{t.dailyReward} ({(CONFIG.DAILY_REWARD_PERCENT * 100).toFixed(0)}%)</span>
                        <div className="text-sm font-black text-emerald-400">Rp {dailyYield.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">{t.maxEarnings} ({(CONFIG.CAPPING_PERCENT * 100).toFixed(0)}%)</span>
                        <div className="text-sm font-black text-amber-500">Rp {maxPossibleEarnings.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">
                          {language === 'id' ? 'TOTAL KONTRAK' : 'TOTAL CONTRACTS'}
                        </span>
                        <div className="text-sm font-black text-emerald-400">{state.activeContracts} Unit</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">
                          {language === 'id' ? 'PROFIT HARI INI' : "TODAY'S PROFIT"}
                        </span>
                        <div className="text-sm font-black text-emerald-400">Rp {(state.todayProfit || 0).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:border-gold-primary/10 transition duration-300">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">
                          {language === 'id' ? 'TOTAL PROFIT' : 'TOTAL PROFIT'}
                        </span>
                        <div className="text-sm font-black text-yellow-500">Rp {(state.totalProfit || 0).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NETWORK VIEW */}
              {currentTab === 'network' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-purple-500/10 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-xs font-black tracking-widest text-white uppercase bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 bg-clip-text text-transparent font-orbitron">{t.network}</h2>
                  </div>

                  {/* High-Tech Grid Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-b from-[#110724] to-[#0a0414] border border-purple-500/15 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl -mr-4 -mt-4 group-hover:bg-purple-500/10 transition-all duration-300" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.totalMember}</span>
                      </div>
                      <div className="text-lg font-black text-white pl-0.5">
                        {totalDownlinesCount} <span className="text-[9px] text-slate-500 font-bold uppercase">{language === 'id' ? 'Mitra' : 'Members'}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#110724] to-[#0a0414] border border-purple-500/15 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl -mr-4 -mt-4 group-hover:bg-emerald-500/10 transition-all duration-300" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.activeHolder}</span>
                      </div>
                      <div className="text-lg font-black text-emerald-400 pl-0.5">
                        {activeDownlinesCount} <span className="text-[9px] text-slate-500 font-bold uppercase">{language === 'id' ? 'Aktif' : 'Active'}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#110724] to-[#0a0414] border border-purple-500/15 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl -mr-4 -mt-4 group-hover:bg-cyan-500/10 transition-all duration-300" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.totalContracts}</span>
                      </div>
                      <div className="text-lg font-black text-white pl-0.5">
                        {totalDownlineContracts} <span className="text-[9px] text-slate-500 font-bold uppercase">Unit</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-b from-[#110724] to-[#0a0414] border border-purple-500/15 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl -mr-4 -mt-4 group-hover:bg-yellow-500/10 transition-all duration-300" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <Award className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.teamVolume}</span>
                      </div>
                      <div className="text-base font-black text-gold-primary pl-0.5 truncate">
                        Rp {teamVolumeValue.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Structure Panel */}
                  <div className="bg-gradient-to-b from-[#0f0620] to-[#080312] border border-purple-500/15 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                      <Network className="w-4 h-4 text-purple-400" />
                      {t.downlineStructure}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/45 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                          <div className="flex flex-col">
                            <span className="text-slate-100 font-extrabold text-xs">Level 1 (Direct)</span>
                            <span className="text-[9px] text-slate-400 font-bold">{language === 'id' ? 'Komisi Referral 10%' : '10% Referral Commission'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400">{l1Count} {language === 'id' ? 'Mitra' : 'Partners'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/45 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                          <div className="flex flex-col">
                            <span className="text-slate-100 font-extrabold text-xs">Level 2 (Indirect)</span>
                            <span className="text-[9px] text-slate-400 font-bold">{language === 'id' ? 'Komisi Referral 3%' : '3% Referral Commission'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-400">{l2Count} {language === 'id' ? 'Mitra' : 'Partners'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/45 border border-purple-500/10 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.5)]" />
                          <div className="flex flex-col">
                            <span className="text-slate-100 font-extrabold text-xs">Level 3 (Community)</span>
                            <span className="text-[9px] text-slate-400 font-bold">{language === 'id' ? 'Komisi Referral 2%' : '2% Referral Commission'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-fuchsia-400">{l3Count} {language === 'id' ? 'Mitra' : 'Partners'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Referral Commissions Split */}
                  <div className="bg-gradient-to-b from-[#0f0620] to-[#080312] border border-purple-500/15 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase border-b border-white/5 pb-2 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      {t.referralCommission}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-semibold">
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-lg font-black text-emerald-400">10%</div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-1">LEVEL 1</span>
                        <div className="text-[10px] font-bold text-white truncate">Rp {(state.referralEarned * 0.65).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="text-lg font-black text-amber-400">3%</div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-1">LEVEL 2</span>
                        <div className="text-[10px] font-bold text-white truncate">Rp {(state.referralEarned * 0.25).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10">
                        <div className="text-lg font-black text-fuchsia-400">2%</div>
                        <span className="text-[8px] text-slate-400 font-bold block mb-1">LEVEL 3</span>
                        <div className="text-[10px] font-bold text-white truncate">Rp {(state.referralEarned * 0.1).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>

                    <div className="bg-purple-950/25 border border-purple-500/15 rounded-2xl p-4 text-center mt-4">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.totalCommission}</span>
                      <div className="text-xl font-black bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 bg-clip-text text-transparent font-orbitron mt-1">
                        Rp {state.referralEarned.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* LEADERBOARD PREVIEW CARD */}
                  <div className="bg-gradient-to-b from-[#0f0620] to-[#080312] border border-purple-500/15 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4.5 h-4.5 text-yellow-400" />
                        {language === 'id' ? 'Peringkat Penambang' : 'Mining Leaderboard'}
                      </div>
                      <button
                        onClick={() => setCurrentTab('leaderboard')}
                        className="text-[9.5px] text-yellow-400 hover:text-white font-extrabold transition uppercase tracking-wider active:scale-95 cursor-pointer"
                      >
                        {language === 'id' ? 'Lihat Semua ➔' : 'View All ➔'}
                      </button>
                    </div>

                    <div className="divide-y divide-white/5 space-y-1.5">
                      {leaderboardData.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500 font-medium">
                          {language === 'id' ? 'Belum ada data leaderboard' : 'No leaderboard data available yet'}
                        </div>
                      ) : (
                        leaderboardData.slice(0, 3).map((entry, index) => {
                          const rank = index + 1;
                          const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
                          const goldVal = entry.goldAllTime;

                          return (
                            <div 
                              key={entry.username} 
                              onClick={() => setCurrentTab('leaderboard')}
                              className="flex items-center justify-between py-2 hover:bg-white/5 px-1.5 rounded-xl transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{medal}</span>
                                <span className="text-xs font-bold text-slate-100">{entry.username}</span>
                                {entry.vipLevel > 0 && (
                                  <span className="text-[7.5px] bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 px-1 py-0.5 rounded leading-none font-bold">
                                    VIP {entry.vipLevel}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-gold-primary font-mono">{goldVal.toFixed(4)} GLD</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DEDICATED GLOBAL LEADERBOARD VIEW */}
              {currentTab === 'leaderboard' && (
                <Leaderboard
                  accounts={accounts}
                  state={state}
                  currentAccount={currentAccount}
                  language={language}
                  setCurrentTab={setCurrentTab}
                />
              )}

              {/* REFERRAL VIEW */}
              {currentTab === 'referral' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.referral}</h2>
                  </div>

                  {/* Code and Link widgets with high-fidelity styling and full copy/share logic */}
                  <div className="bg-gradient-to-br from-[#0f0620] to-[#080312] border border-purple-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="relative">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-gold-primary uppercase tracking-wider">
                          {language === 'id' ? 'Kode Referral Anda' : 'Your Referral Code'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black/40 border border-purple-900/30 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-100 flex items-center justify-between">
                          <span>{currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase())}</span>
                          <button
                            onClick={handleCopyCode}
                            className="text-gold-primary hover:text-yellow-300 transition text-xs font-extrabold flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            {copiedCode ? (
                              <span className="text-emerald-400 font-bold">Copied ✓</span>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#120824] border border-purple-500/15 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest block">
                            {language === 'id' ? 'Tautan Referral Resmi' : 'Official Referral Link'}
                          </span>
                        </div>
                        
                        <button
                          onClick={handleCopyLink}
                          className={`absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-90 flex items-center gap-1 ${
                            copiedLink 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-gradient-to-r from-yellow-400 via-gold-primary to-yellow-600 text-black shadow-md hover:brightness-110'
                          }`}
                        >
                          <span className="font-bold text-xs">📋</span>
                          <span>{copiedLink ? (language === 'id' ? 'Copied ✓' : 'Copied ✓') : (language === 'id' ? 'Copy' : 'Copy')}</span>
                        </button>
                      </div>

                      <div className="mt-4 pt-1">
                        <div className="w-full bg-black/50 border border-purple-950/40 rounded-xl px-3 py-2.5 text-[10px] font-mono text-slate-300 break-all select-all leading-relaxed pr-16 shadow-inner">
                          {`${window.location.origin}/register?ref=${currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase())}`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const refCodeStr = currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase());
                        const shareUrl = `${window.location.origin}/register?ref=${refCodeStr}`;
                        const shareText = language === 'id' 
                          ? `Bergabunglah dengan sistem penambangan PT GrockGold menggunakan kode ${refCodeStr} dan hasilkan yield harian hingga 4%! ${shareUrl}`
                          : `Join the PT GrockGold mining system with code ${refCodeStr} and earn up to 4% daily contract yield! ${shareUrl}`;
                        
                        setSharedReferral(true);
                        if (navigator.share) {
                          navigator.share({
                            title: 'GrockGold Mining',
                            text: shareText,
                            url: shareUrl,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(shareText);
                          triggerModal(language === 'id' ? '✅ Teks berbagi disalin ke clipboard!' : '✅ Share text copied to clipboard!', 'success');
                        }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg hover:brightness-110 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'id' ? 'BAGIKAN REFERRAL' : 'SHARE REFERRAL'}</span>
                    </button>
                  </div>

                  <div className="bg-[#0e061c] border border-purple-500/10 rounded-3xl p-5 shadow-xl">
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase">
                      {t.stats}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-extrabold mb-4">
                      <div className="p-3 bg-black/35 rounded-2xl border border-white/5">
                        <div className="text-emerald-400 text-base">{l1Count}</div>
                        <span className="text-[8px] text-slate-400 block mt-1">L1</span>
                      </div>
                      <div className="p-3 bg-black/35 rounded-2xl border border-white/5">
                        <div className="text-amber-400 text-base">{l2Count}</div>
                        <span className="text-[8px] text-slate-400 block mt-1">L2</span>
                      </div>
                      <div className="p-3 bg-black/35 rounded-2xl border border-white/5">
                        <div className="text-fuchsia-400 text-base">{l3Count}</div>
                        <span className="text-[8px] text-slate-400 block mt-1">L3</span>
                      </div>
                    </div>

                    <div className="bg-purple-950/20 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">TOTAL DOWNLINES</span>
                      <span className="text-base font-black text-white block mt-0.5">{totalDownlinesCount} {language === 'id' ? 'Pengguna' : 'Users'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* WALLET VIEW */}
              {currentTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.wallet}</h2>
                  </div>

                  {/* Split balances card */}
                  <div className="bg-gradient-to-br from-[#120a26] to-[#040108] border border-gold-primary/30 rounded-3xl p-5 shadow-2xl relative">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider block mb-1.5 uppercase">
                      {t.totalBalance}
                    </span>
                    <div className="text-3xl font-black text-gradient-gold font-orbitron mb-5">
                      Rp {(state.mainBalance + totalEarned).toLocaleString('id-ID')}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">{t.mainBalance}</span>
                        <div className="text-sm font-black text-white">
                          Rp {state.mainBalance.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">{t.rewardBalance}</span>
                        <div className="text-sm font-black text-gold-primary">
                          Rp {totalEarned.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={() => setCurrentTab('deposit')}
                      className="py-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-extrabold transition flex flex-col items-center gap-1.5 shadow-md"
                    >
                      <ArrowDown className="w-4 h-4" />
                      {t.deposit}
                    </button>
                    <button
                      onClick={triggerWithdrawFlow}
                      className="py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-extrabold transition flex flex-col items-center gap-1.5 shadow-md"
                    >
                      <ArrowUp className="w-4 h-4" />
                      {t.withdraw}
                    </button>
                    <button
                      onClick={handleClaimYield}
                      className="py-3 bg-gradient-to-br from-yellow-300 to-gold-primary text-black rounded-2xl text-[10px] font-black transition flex flex-col items-center gap-1.5 shadow-lg shadow-gold-primary/10"
                    >
                      <Coins className="w-4 h-4" />
                      KLAIM REWARD
                    </button>
                  </div>

                  {/* Earnings detail */}
                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl">
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase">
                      {t.earningsDetail}
                    </div>

                    <div className="space-y-3 font-semibold text-xs text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">📊 {t.totalEarned}</span>
                        <span className="text-white font-extrabold">Rp {totalEarned.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">⛏️ Mining Profit</span>
                        <span className="text-emerald-400 font-extrabold">Rp {miningProfit.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">👥 Referral Reward</span>
                        <span className="text-amber-400 font-extrabold">Rp {referralReward.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">🔄 Rebate Reward</span>
                        <span className="text-fuchsia-400 font-extrabold">Rp {rebateReward.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">🎁 Bonus</span>
                        <span className="text-blue-400 font-extrabold">Rp {bonusReward.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* TRANSACTION HISTORY */}
                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl">
                    <div className="text-xs font-black text-gold-primary tracking-widest mb-4 uppercase flex items-center gap-1.5">
                      <History className="w-4.5 h-4.5" />
                      {t.txHistory}
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {state.transactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 font-bold text-xs space-y-1">
                          <div>{t.emptyTx}</div>
                        </div>
                      ) : (
                        state.transactions.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-none">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                tx.type === 'deposit'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : tx.type === 'withdraw'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-gold-primary/10 text-gold-primary'
                              }`}>
                                {tx.type === 'deposit' ? <ArrowDown className="w-4 h-4" /> : tx.type === 'withdraw' ? <ArrowUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block leading-tight">{tx.description}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  {new Date(tx.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            <span className={`text-xs font-black ${
                              tx.type === 'deposit' || tx.type === 'reward' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* REWARDS VIEW */}
              {currentTab === 'reward' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.rewards}</h2>
                  </div>

                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl space-y-3">
                    <div className="text-xs font-black text-gold-primary uppercase tracking-wider mb-2">
                      All Earned Yield Categories
                    </div>

                    <div className="border-l-4 border-emerald-400 bg-emerald-500/5 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-emerald-400 font-bold block">DAILY MINING Harvester (4%)</span>
                        <span className="text-slate-200 text-xs font-bold">PT GrockGold Daily Fleet Distribution</span>
                      </div>
                      <span className="text-emerald-400 font-black text-sm">Rp {miningProfit.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="border-l-4 border-amber-400 bg-amber-500/5 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-amber-400 font-bold block">REFERRAL DIRECT INCENTIVES</span>
                        <span className="text-slate-200 text-xs font-bold">Active Downline Level Rates</span>
                      </div>
                      <span className="text-amber-400 font-black text-sm">Rp {referralReward.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="border-l-4 border-fuchsia-400 bg-fuchsia-500/5 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-fuchsia-400 font-bold block">REBATE LEVEL HARVEST</span>
                        <span className="text-slate-200 text-xs font-bold">Network Sales Performance Share</span>
                      </div>
                      <span className="text-fuchsia-400 font-black text-sm">Rp {rebateReward.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="border-l-4 border-blue-400 bg-blue-500/5 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-blue-400 font-bold block">WELCOME BONUS</span>
                        <span className="text-slate-200 text-xs font-bold">Registration Member Incentives</span>
                      </div>
                      <span className="text-blue-400 font-black text-sm">Rp {bonusReward.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="bg-gold-primary/10 border border-gold-primary/20 rounded-2xl p-4 text-center mt-5">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">TOTAL REWARD REVENUES</span>
                      <span className="text-2xl font-black text-gradient-gold block mt-1 font-orbitron">
                        Rp {totalEarned.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* LEGAL & CERTIFICATE VIEW */}
              {currentTab === 'legal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.legal}</h2>
                  </div>

                  <div className="bg-[#0e061c] border border-gold-primary/25 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <FileBadge className="w-5 h-5 text-gold-primary" />
                      <span className="text-xs font-black text-slate-200 uppercase tracking-wider">{t.certificate}</span>
                    </div>

                    <div className="bg-black/35 border border-white/5 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Contract Code</span>
                        <span className="text-xs font-mono font-bold text-white">#GGM-A001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Assigned To</span>
                        <span className="text-xs font-bold text-white uppercase">{state.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Status</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                          {state.activeContracts > 0 ? 'VALID & ACTIVE' : 'NO ACTIVE CONTRACTS'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Contracts Owned</span>
                        <span className="text-xs font-bold text-white">{state.activeContracts} Unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Issued Date</span>
                        <span className="text-xs font-mono text-slate-300">
                          {new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerModal(`📄 Official Stock Certificate Of PT GrockGold Mining.<br><br>Issuer: PT GrockGold Corporate Registry<br>Registered Holder: ${state.username}<br>Fleet Node Assignment: Randgold West Africa Area.<br>Approved & Audited.`, 'success')}
                      className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD PDF CERTIFICATE
                    </button>
                  </div>

                  {/* Company credentials */}
                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl">
                    <div className="text-xs font-black text-gold-primary uppercase tracking-wider mb-3">
                      Corporate Credentials & Licenses
                    </div>
                    <div className="space-y-2 text-xs font-semibold text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">{t.company}</span>
                        <span className="text-white text-right">PT GrockGold Mining Ltd.</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">{t.license}</span>
                        <span className="text-white">12345/MINING/2026-REG</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">{t.regulated}</span>
                        <span className="text-white text-right">Ministry of Energy & Minerals Registry</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DEPOSIT SALDO VIEW */}
              {currentTab === 'deposit' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.deposit}</h2>
                  </div>

                  <div className="bg-[#0e061c] border border-gold-primary/15 rounded-3xl p-5 shadow-xl space-y-5">
                    <div>
                      <label className="text-xs font-black text-gold-primary block mb-3 uppercase">
                        {t.nominalDeposit}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-base font-extrabold text-slate-400">Rp</span>
                        <input
                          type="text"
                          value={depositValue}
                          onChange={(e) => formatDepositAmount(e.target.value)}
                          className="w-full bg-black/45 border border-purple-900/30 rounded-2xl pl-12 pr-4 py-4 text-xl font-bold font-mono focus:border-gold-primary outline-none transition text-white text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[100000, 250000, 1000000, 2500000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleQuickDeposit(amount)}
                          className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-extrabold text-slate-300 transition"
                        >
                          Rp {amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}J` : `${amount / 1000}K`}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={executeDeposit}
                      className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-primary/10 hover:brightness-110 flex items-center justify-center gap-2"
                    >
                      <ArrowDown className="w-4.5 h-4.5" />
                      {t.processDeposit}
                    </button>
                  </div>

                  {/* PAYMENT CHANNELS & DETAILS */}
                  <div className="bg-gradient-to-br from-[#0f0620] to-[#080312] border border-purple-500/15 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                      <Wallet className="w-4 h-4 text-gold-primary" />
                      <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest">
                        {language === 'id' ? 'REKENING & METODE TRANSFER RESMI' : 'OFFICIAL PAYMENT METHODS'}
                      </span>
                    </div>

                    {/* Bank Transfer BCA Option */}
                    <div className="p-4 bg-black/45 border border-purple-950/40 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black bg-blue-600/25 text-blue-400 px-2 py-0.5 rounded-md uppercase">
                          {globalConfig?.bankName || 'BCA'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {language === 'id' ? 'Transfer Bank' : 'Bank Transfer'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px]">{language === 'id' ? 'Nomor Rekening:' : 'Account Number:'}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white text-xs font-mono font-black">{globalConfig?.bankNumber || '8402-1920-22'}</span>
                            <button
                              onClick={handleCopyBankNumber}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-extrabold text-gold-primary transition active:scale-90"
                            >
                              {copiedBank ? 'Copied ✓' : 'COPY'}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px]">{language === 'id' ? 'Atas Nama:' : 'Account Holder:'}</span>
                          <span className="text-white text-xs font-bold uppercase">{globalConfig?.bankHolder || 'PT GROCKGOLD INDONESIA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* USDT Crypto Option */}
                    <div className="p-4 bg-black/45 border border-purple-950/40 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black bg-emerald-600/25 text-emerald-400 px-2 py-0.5 rounded-md uppercase">
                          USDT (TRC-20)
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {language === 'id' ? 'Kripto Instan' : 'Crypto Instant'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-400 text-[10px]">{language === 'id' ? 'Alamat Dompet USDT:' : 'USDT Wallet Address:'}</span>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-2.5 py-1.5 justify-between">
                            <span className="text-white text-[10px] font-mono font-bold break-all select-all flex-1 pr-2">
                              {globalConfig?.usdtAddress || 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a'}
                            </span>
                            <button
                              onClick={handleCopyUSDTAddress}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-extrabold text-gold-primary transition shrink-0 active:scale-90"
                            >
                              {copiedUSDT ? 'Copied ✓' : 'COPY'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step Instructions */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-[10px] text-amber-200/80 leading-relaxed space-y-1.5">
                      <div className="font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                        {language === 'id' ? '⚠️ PETUNJUK TRANSFER & KONFIRMASI:' : '⚠️ TRANSFER & CONFIRMATION INSTRUCTIONS:'}
                      </div>
                      <p>{language === 'id' ? '1. Silakan lakukan transfer dana terlebih dahulu ke rekening bank BCA atau dompet USDT di atas.' : '1. Please transfer the funds first to the BCA Bank account or USDT wallet above.'}</p>
                      <p>{language === 'id' ? '2. Isi nominal yang ditransfer pada form "NOMINAL DEPOSIT" di atas (Min Rp 100.000).' : '2. Fill the transferred amount in the "NOMINAL DEPOSIT" field above (Min Rp 100,000).'}</p>
                      <p>{language === 'id' ? '3. Tekan tombol "PROSES DEPOSIT" di atas untuk mengirimkan konfirmasi bukti transfer.' : '3. Press the "PROCESS DEPOSIT" button above to submit your transfer confirmation.'}</p>
                      <p>{language === 'id' ? '4. Tim Admin akan memproses dan mengaktifkan saldo Anda dalam waktu 1-10 menit setelah verifikasi.' : '4. Admin Team will verify and activate your balance within 1-10 minutes.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE VIEW */}
              {currentTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">{t.profile}</h2>
                  </div>

                  {/* Profile Avatar Card */}
                  <div className="bg-[#0e061c] border border-gold-primary/15 rounded-3xl p-5 shadow-xl text-center">
                    <div className="relative w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-tr from-purple-900/50 to-gold-primary/30 border border-gold-primary/30 flex items-center justify-center overflow-hidden shadow-lg group">
                      {state.profileImage ? (
                        <img src={state.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-gold-primary" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-250">
                        <Camera className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                      </label>
                    </div>

                    <div className="text-lg font-black text-white uppercase">{currentAccount ? currentAccount.fullName : state.username}</div>
                    {state.username.toLowerCase() !== 'admin' && (
                      <div className="text-xs text-purple-300 font-mono mt-0.5">ID: {currentAccount ? currentAccount.referralCode : 'GGM-0001'}</div>
                    )}
                  </div>

                  {/* Referral Box Section */}
                  {state.username.toLowerCase() !== 'admin' && (
                    <div className="bg-gradient-to-br from-[#0f0620] to-[#080312] border border-purple-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black text-gold-primary uppercase tracking-wider">
                            {language === 'id' ? 'Kode Referral Anda' : 'Your Referral Code'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-black/40 border border-purple-900/30 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-100 flex items-center justify-between">
                            <span>{currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase())}</span>
                            <button
                              onClick={handleCopyCode}
                              className="text-gold-primary hover:text-yellow-300 transition text-xs font-extrabold flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              {copiedCode ? (
                                <span className="text-emerald-400 font-bold">Copied ✓</span>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>COPY</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#120824] border border-purple-500/15 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest block">
                              {language === 'id' ? 'Tautan Referral Resmi' : 'Official Referral Link'}
                            </span>
                          </div>
                          
                          <button
                            onClick={handleCopyLink}
                            className={`absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-90 flex items-center gap-1 ${
                              copiedLink 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-gradient-to-r from-yellow-400 via-gold-primary to-yellow-600 text-black shadow-md hover:brightness-110'
                            }`}
                          >
                            <span className="font-bold text-xs">📋</span>
                            <span>{copiedLink ? (language === 'id' ? 'Copied ✓' : 'Copied ✓') : (language === 'id' ? 'Copy' : 'Copy')}</span>
                          </button>
                        </div>

                        <div className="mt-4 pt-1">
                          <div className="w-full bg-black/50 border border-purple-950/40 rounded-xl px-3 py-2.5 text-[10px] font-mono text-slate-300 break-all select-all leading-relaxed pr-16 shadow-inner">
                            {`${window.location.origin}/register?ref=${currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase())}`}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const refCodeStr = currentAccount?.referralCode || ('GGM-' + state.username.toUpperCase());
                          const shareUrl = `${window.location.origin}/register?ref=${refCodeStr}`;
                          const shareText = language === 'id' 
                            ? `Bergabunglah dengan sistem penambangan PT GrockGold menggunakan kode ${refCodeStr} dan hasilkan yield harian hingga 4%! ${shareUrl}`
                            : `Join the PT GrockGold mining system with code ${refCodeStr} and earn up to 4% daily contract yield! ${shareUrl}`;
                          
                          setSharedReferral(true);
                          if (navigator.share) {
                            navigator.share({
                              title: 'GrockGold Mining',
                              text: shareText,
                              url: shareUrl,
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(shareText);
                            triggerModal(language === 'id' ? '✅ Teks berbagi disalin ke clipboard!' : '✅ Share text copied to clipboard!', 'success');
                          }
                        }}
                        className="w-full py-4 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg hover:brightness-110 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'id' ? 'BAGIKAN REFERRAL' : 'SHARE REFERRAL'}</span>
                      </button>
                    </div>
                  )}

                  {/* Accordion / Tab Options */}
                  <div className="space-y-3">
                    {/* DATA AKUN SECTION */}
                    <div className="bg-[#0e061c] border border-white/5 rounded-2xl p-4 shadow-lg">
                      <div className="text-xs font-black text-gold-primary uppercase tracking-wider mb-3.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-gold-primary" />
                        {t.profileDataTitle}
                      </div>
                      
                      <div className="space-y-2.5 text-xs font-semibold text-slate-300">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-500">{language === 'id' ? 'Nama Lengkap' : 'Full Name'}</span>
                          <span className="text-white font-bold">{currentAccount ? currentAccount.fullName : 'Kenala Wijaya'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                          <span className="text-slate-500">Username</span>
                          <span className="text-white">{currentAccount ? currentAccount.username : 'kenala'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                          <span className="text-slate-500">Email</span>
                          <span className="text-white">{currentAccount ? currentAccount.email : 'kenala@grockgold.com'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                          <span className="text-slate-500">{language === 'id' ? 'No. Handphone' : 'Phone Number'}</span>
                          <span className="text-white">{currentAccount ? currentAccount.phone : '+6281234567890'}</span>
                        </div>
                        {state.username.toLowerCase() !== 'admin' && (
                          <>
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-slate-500">Uplink Sponsor</span>
                              <span className="text-amber-400 font-bold uppercase">{currentAccount?.invitedBy ? currentAccount.invitedBy : 'SYSTEM'}</span>
                            </div>
                            <div className="flex justify-between py-1 font-mono">
                              <span className="text-slate-500">Referral Code</span>
                              <span className="text-gold-primary font-bold">{currentAccount ? currentAccount.referralCode : 'GGM-0001'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CHANGE PASSWORD SECTION */}
                    <div className="bg-[#0e061c] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5">
                      <div className="text-xs font-black text-gold-primary uppercase tracking-wider flex items-center gap-2">
                        <Unlock className="w-4 h-4 text-gold-primary" />
                        {t.changePasswordTitle}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                            {t.oldPassword}
                          </label>
                          <input
                            type="password"
                            value={profileOldPassword}
                            onChange={(e) => setProfileOldPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3 py-2 text-xs font-semibold text-white transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                            {t.newPassword}
                          </label>
                          <input
                            type="password"
                            value={profileNewPassword}
                            onChange={(e) => setProfileNewPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3 py-2 text-xs font-semibold text-white transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                            {t.confirmNewPassword}
                          </label>
                          <input
                            type="password"
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full bg-black/40 border border-purple-900/40 focus:border-gold-primary/60 outline-none rounded-xl px-3 py-2 text-xs font-semibold text-white transition"
                          />
                        </div>

                        <button
                          onClick={handleChangePassword}
                          className="w-full py-2.5 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-[10px] tracking-wider uppercase transition shadow-md hover:brightness-110 active:scale-98"
                        >
                          {t.updatePassword}
                        </button>
                      </div>
                    </div>

                    {/* SETTINGS SECTION */}
                    <div className="bg-[#0e061c] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5">
                      <div className="text-xs font-black text-gold-primary uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gold-primary" />
                        {t.settingsTitle}
                      </div>

                      <div className="space-y-3 text-xs font-bold text-white">
                        {/* Auto Reinvest Toggle */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
                          <div className="flex flex-col text-left">
                            <span className="text-xs">Auto Reinvest (Rp {(CONFIG.PRICE_PER_UNIT / 1000).toLocaleString('id-ID')}k)</span>
                            <span className="text-[8px] text-slate-400 font-medium">Beli kontrak otomatis dari hasil tambang</span>
                          </div>
                          <button
                            onClick={() => handleToggleAutoReinvest(!currentAccount?.settings?.autoReinvest)}
                            className={`w-10 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
                              currentAccount?.settings?.autoReinvest ? 'bg-gold-primary' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`bg-black w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                                currentAccount?.settings?.autoReinvest ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
                          <div className="flex flex-col text-left">
                            <span className="text-xs">{language === 'id' ? 'Notifikasi Real-time' : 'Real-time Notifications'}</span>
                            <span className="text-[8px] text-slate-400 font-medium">Terima peringatan aktivitas armada</span>
                          </div>
                          <button
                            onClick={() => handleToggleNotifications(!currentAccount?.settings?.notificationsEnabled)}
                            className={`w-10 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
                              currentAccount?.settings?.notificationsEnabled ? 'bg-gold-primary' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`bg-black w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                                currentAccount?.settings?.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Language Selection */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
                          <div className="flex flex-col text-left">
                            <span className="text-xs">{language === 'id' ? 'Bahasa Utama' : 'Primary Language'}</span>
                            <span className="text-[8px] text-slate-400 font-medium">Setel bahasa antarmuka terminal</span>
                          </div>
                          <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 bg-purple-950/40 border border-purple-500/20 text-gold-primary rounded-lg text-[10px] font-extrabold uppercase hover:bg-purple-900/30 transition"
                          >
                            {language === 'id' ? '🇲🇨 INDONESIA' : '🇬🇧 ENGLISH'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 bg-rose-950/15 border border-rose-500/25 text-rose-400 font-extrabold rounded-2xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 hover:bg-rose-950/35"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      {t.logout}
                    </button>
                  </div>
                </div>
              )}

              {/* TRANSACTION HISTORY VIEW */}
              {currentTab === 'transactions' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">
                      {language === 'id' ? 'Riwayat Transaksi' : 'Transaction History'}
                    </h2>
                  </div>

                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex gap-2">
                      {['all', 'deposit', 'withdraw', 'reward'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setTxFilter(filter)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                            txFilter === filter
                              ? 'bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black shadow-md shadow-gold-primary/10'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                          }`}
                        >
                          {filter === 'all' ? (language === 'id' ? 'Semua' : 'All') : filter}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {state.transactions.filter(t => txFilter === 'all' || t.type === txFilter).length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                          {t.emptyTx}
                        </div>
                      ) : (
                        state.transactions
                          .filter(t => txFilter === 'all' || t.type === txFilter)
                          .map((tx) => (
                            <div key={tx.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${
                                  tx.type === 'deposit' || tx.type === 'reward'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}>
                                  {tx.type === 'deposit' ? (
                                    <ArrowDown className="w-4 h-4" />
                                  ) : tx.type === 'reward' ? (
                                    <Gift className="w-4 h-4" />
                                  ) : (
                                    <ArrowUp className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-extrabold text-white uppercase block leading-tight">
                                    {tx.type}
                                  </span>
                                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block mt-0.5">
                                    {new Date(tx.timestamp).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-xs font-black font-mono ${
                                tx.type === 'deposit' || tx.type === 'reward' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SYSTEM NOTIFICATIONS VIEW */}
              {currentTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">
                      {language === 'id' ? 'Notifikasi Sistem' : 'System Notifications'}
                    </h2>
                  </div>

                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-xs font-bold text-gold-primary uppercase tracking-wider">
                        {language === 'id' ? 'Pemberitahuan Terbaru' : 'Recent Bulletins'}
                      </span>
                      <span className="text-[9px] bg-gold-primary/10 border border-gold-primary/30 text-gold-primary px-2 py-0.5 rounded font-black font-mono uppercase">
                        {language === 'id' ? 'Aktif' : 'Live'}
                      </span>
                    </div>

                    <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                      {[
                        {
                          id: 1,
                          title: language === 'id' ? 'Sistem Cloud Penambangan Stabil' : 'Cloud Mining Fleets Stabilized',
                          desc: language === 'id' ? 'Semua unit ekskavator di Randgold West Africa beroperasi dengan efisiensi puncak 98.4%.' : 'All excavator fleets in Randgold West Africa are operating at peak efficiency of 98.4%.',
                          time: '14 Jul 2026, 10:24',
                          type: 'success'
                        },
                        {
                          id: 2,
                          title: language === 'id' ? 'Kemitraan Emas Randgold Resources' : 'Randgold Resources Partnership Active',
                          desc: language === 'id' ? 'GrockGold Mining mengesahkan audit sertifikat kepemilikan kuartal ini untuk keandalan penarikan.' : 'GrockGold Mining verified this quarter’s certificate audit to ensure flawless and secure liquidity withdrawals.',
                          time: '13 Jul 2026, 08:12',
                          type: 'info'
                        },
                        {
                          id: 3,
                          title: language === 'id' ? 'Keamanan Enkripsi Lapis Dua Berjalan' : 'Two-Factor Secure Tunnel Enforced',
                          desc: language === 'id' ? 'Akses sistem diamankan penuh secara real-time. Hubungi admin untuk keluhan kode OTP.' : 'Terminal access is fully encrypted in real-time. Contact official admins for any access issues.',
                          time: '12 Jul 2026, 15:45',
                          type: 'info'
                        },
                        {
                          id: 4,
                          title: language === 'id' ? 'Program Welcome Bonus Investor' : 'New Member Welcome Bonus Open',
                          desc: language === 'id' ? 'Dapatkan Rp 1.800.000 dengan mengumpulkan 80 mitra aktif di struktur jaringan penambangan Anda.' : 'Claim Rp 1,800,000 by accumulating 80 active investors with at least 1 Stock Contract in your networks.',
                          time: '10 Jul 2026, 09:00',
                          type: 'warning'
                        }
                      ].map((n) => (
                        <div key={n.id} className="p-4 bg-black/45 border border-white/5 rounded-2xl flex gap-3 text-left">
                          <div className="mt-0.5 shrink-0">
                            <div className={`p-1.5 rounded-lg border ${
                              n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              n.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-purple-500/10 border-purple-500/20 text-cyan-400'
                            }`}>
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-white block leading-tight">{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-relaxed">{n.desc}</span>
                            <span className="text-[8px] font-mono font-bold text-slate-600 uppercase block mt-2">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SETTINGS VIEW */}
              {currentTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">
                      {language === 'id' ? 'Pengaturan' : 'Settings'}
                    </h2>
                  </div>

                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="text-xs font-black text-gold-primary uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                      <Settings className="w-4 h-4 text-gold-primary" />
                      {t.settingsTitle}
                    </div>

                    <div className="space-y-3 text-xs font-bold text-white">
                      {/* Auto Reinvest Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5">
                        <div className="flex flex-col text-left">
                          <span className="text-xs">Auto Reinvest (Rp {(CONFIG.PRICE_PER_UNIT / 1000).toLocaleString('id-ID')}k)</span>
                          <span className="text-[8px] text-slate-400 font-medium">Beli kontrak otomatis dari hasil tambang</span>
                        </div>
                        <button
                          onClick={() => handleToggleAutoReinvest(!currentAccount?.settings?.autoReinvest)}
                          className={`w-10 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
                            currentAccount?.settings?.autoReinvest ? 'bg-gold-primary' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`bg-black w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                              currentAccount?.settings?.autoReinvest ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Notifications Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5">
                        <div className="flex flex-col text-left">
                          <span className="text-xs">{language === 'id' ? 'Notifikasi Real-time' : 'Real-time Notifications'}</span>
                          <span className="text-[8px] text-slate-400 font-medium">Terima peringatan aktivitas armada</span>
                        </div>
                        <button
                          onClick={() => handleToggleNotifications(!currentAccount?.settings?.notificationsEnabled)}
                          className={`w-10 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
                            currentAccount?.settings?.notificationsEnabled ? 'bg-gold-primary' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`bg-black w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                              currentAccount?.settings?.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Language Selection */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5">
                        <div className="flex flex-col text-left">
                          <span className="text-xs">{language === 'id' ? 'Bahasa Utama' : 'Primary Language'}</span>
                          <span className="text-[8px] text-slate-400 font-medium">Setel bahasa antarmuka terminal</span>
                        </div>
                        <button
                          onClick={() => {
                            toggleLanguage();
                            triggerModal(
                              language === 'id'
                                ? '🇬🇧 Language changed to English!'
                                : '🇲🇨 Bahasa diubah ke Bahasa Indonesia!',
                              'success'
                            );
                          }}
                          className="px-3 py-1.5 bg-purple-950/40 border border-purple-500/20 text-gold-primary rounded-lg text-[10px] font-extrabold uppercase hover:bg-purple-900/30 transition"
                        >
                          {language === 'id' ? '🇲🇨 INDONESIA' : '🇬🇧 ENGLISH'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* HELP & SUPPORT VIEW */}
              {currentTab === 'help' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">
                      {language === 'id' ? 'Pusat Bantuan' : 'Help Center'}
                    </h2>
                  </div>

                  <div className="bg-[#0e061c] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="text-xs font-black text-gold-primary uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                      <HelpCircle className="w-4 h-4 text-gold-primary" />
                      {language === 'id' ? 'Pertanyaan Umum (FAQ)' : 'Frequently Asked Questions'}
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {[
                        {
                          q: language === 'id' ? 'Bagaimana cara membeli Kontrak Emas?' : 'How do I purchase Gold Contracts?',
                          a: language === 'id' ? 'Anda dapat menyetor dana Anda di menu Wallet -> Deposit. Setelah itu, buka menu Kontrak, tentukan jumlah unit yang diinginkan, lalu ketuk tombol "Beli Sekarang". Kontrak langsung aktif berproduksi.' : 'First top up your balance via Wallet -> Deposit. Once your balance is loaded, navigate to the Contracts page, input your desired unit quantity, and click "Buy Now".'
                        },
                        {
                          q: language === 'id' ? 'Berapa persentase hasil harian?' : 'What is the daily mining yield rate?',
                          a: language === 'id' ? 'Setiap kontrak aktif memberikan tingkat hasil harian sebesar 4% langsung ke saldo reward Anda sampai mencapai batas capping penambangan 250%.' : 'Each active contract guarantees a premium 4% daily yield credited straight to your Reward Balance, running continuously until reaching 250% capping.'
                        },
                        {
                          q: language === 'id' ? 'Apa yang dimaksud batas Capping 250%?' : 'What is the 250% capping limit?',
                          a: language === 'id' ? 'Capping adalah batas maksimal pendapatan kontrak Anda (2.5 kali modal beli). Jika Anda membeli kontrak senilai Rp 1.000.000, penambangan otomatis berhenti saat total hasil mencapai Rp 2.500.000.' : 'Capping is the maximum lifetime earning capacity of your contract (2.5x principal). For instance, a Rp 1,000,000 contract produces up to Rp 2,500,000 in total mining yields.'
                        },
                        {
                          q: language === 'id' ? 'Bagaimana sistem komisi MLM / Network?' : 'How does the network MLM system work?',
                          a: language === 'id' ? 'Sistem kami menggunakan struktur bertingkat: Komisi Sponsor Utama (10%), Rebate Level 1 (5%), dan Level 2 (2%). Komisi langsung masuk ke saldo tunai dan meningkatkan progress capping Anda.' : 'We operate a multi-level referral hierarchy: Direct Sponsor incentives (10%), Generation Level 1 rebates (5%), and Level 2 rebates (2%). Commissions directly load to your balance.'
                        }
                      ].map((faq, i) => (
                        <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-2xl text-left space-y-1.5">
                          <span className="text-xs font-black text-gold-primary block">Q: {faq.q}</span>
                          <span className="text-[10px] text-slate-300 font-medium block leading-relaxed">A: {faq.a}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => triggerModal('💬 Layanan Pelanggan GROCKGOLD Telegram Support:<br><b>@GrockGold_Support_Bot</b><br><br>Email: support@grockgold.com<br>Waktu Respons: 24/7 Live.', 'info')}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gold-primary font-bold rounded-2xl text-xs uppercase transition flex items-center justify-center gap-2"
                      >
                        HUBUNGI CUSTOMER SERVICE
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ABOUT US VIEW */}
              {currentTab === 'about' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <ChevronLeft className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition" onClick={() => setCurrentTab('home')} />
                    <h2 className="text-sm font-black tracking-widest text-white uppercase">
                      {language === 'id' ? 'Tentang Kami' : 'About Us'}
                    </h2>
                  </div>

                  <div className="bg-[#0e061c] border border-gold-primary/25 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex justify-center mb-1">
                      <span className="text-lg font-black tracking-widest bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 bg-clip-text text-transparent font-orbitron">
                        GROCKGOLD
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-semibold leading-relaxed text-center whitespace-pre-line border-b border-white/5 pb-4">
                      {language === 'id' ? (
                        'PT GrockGold Mining Ltd adalah perusahaan penambangan dan simulasi portofolio komersial berskala internasional yang terafiliasi resmi dengan Randgold Resources West Africa.\n\nKami mengintegrasikan teknologi cloud hashing penambangan canggih untuk memberikan jaminan aksesibilitas portofolio berkinerja tinggi bagi seluruh mitra terdaftar.'
                      ) : (
                        'PT GrockGold Mining Ltd is a premium international gold mining operations and simulation platform, officially partnered with Randgold Resources West Africa.\n\nWe build advanced high-throughput cloud hashing solutions that enable transparent, stable, and highly rewarding digital gold mining contract simulation fleets.'
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">{t.company}</span>
                        <span className="text-white text-right">PT GrockGold Mining Ltd.</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">{t.license}</span>
                        <span className="text-white">12345/MINING/2026-REG</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">{t.regulated}</span>
                        <span className="text-white text-right">Ministry of Energy & Minerals Registry</span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerModal(`📄 Official License & Certifications Of PT GrockGold Mining.<br><br>Issuer: Ministry of Energy & Minerals Registry<br>Registered Entity: PT GrockGold Mining Ltd.<br>Verification Hash: #SHA256-GGM998162816B<br>Status: LICENSED & COMPLIANT`, 'success')}
                      className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD LEGAL DOCUMENT
                    </button>
                  </div>
                </motion.div>
              )}

            </div>

            {/* 5. APP NAV BOTTOM BAR */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[425px] bg-[#0c071d]/95 backdrop-blur-md border-t border-gold-primary/20 z-[99998] py-2 px-1 flex justify-around shadow-2xl">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'contract', label: language === 'id' ? 'Kontrak' : 'Contracts', icon: Ticket },
                { id: 'livemining', label: 'Live Mining', icon: Cpu },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'profile', label: language === 'id' ? 'Profil' : 'Profile', icon: User },
              ].map((nav) => {
                const Icon = nav.icon;
                const isActive = currentTab === nav.id;
                return (
                  <button
                    key={nav.id}
                    onClick={() => setCurrentTab(nav.id)}
                    className="flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 relative group"
                  >
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                      <Icon className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
                        isActive
                          ? 'text-gold-primary filter drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                    </div>
                    <span className={`text-[9px] font-black tracking-wide leading-none transition-colors duration-200 ${
                      isActive ? 'text-gold-primary' : 'text-slate-500'
                    }`}>
                      {nav.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicatorDot"
                        className="absolute bottom-0 w-1 h-1 rounded-full bg-gold-primary shadow-[0_0_8px_rgba(212,175,55,0.9)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* CUSTOM WITHDRAWAL FORM MODAL */}
        <AnimatePresence>
          {withdrawModalOpen && (
            <div className="fixed inset-0 z-[199999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setWithdrawModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="relative w-full max-w-sm bg-[#110724] border border-gold-primary/30 rounded-3xl p-6 text-left shadow-2xl z-10 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">
                    <ArrowUp className="w-5 h-5 text-rose-500" />
                    {language === 'id' ? 'Form Penarikan Saldo' : 'Withdrawal Form'}
                  </h3>
                  <button onClick={() => setWithdrawModalOpen(false)} className="text-slate-400 hover:text-white transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-bold">
                  {/* Bank Select */}
                  <div>
                    <label className="text-gold-primary text-[10px] block mb-1.5 uppercase">Pilih Bank Tujuan</label>
                    <select
                      value={withdrawBank}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      className="w-full bg-black/40 border border-purple-900/30 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-gold-primary"
                    >
                      {['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'DANA', 'OVO', 'Gopay'].map((b) => (
                        <option key={b} value={b} className="bg-[#110724] text-white font-semibold">
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-gold-primary text-[10px] block mb-1.5 uppercase">Nomor Rekening / No. E-Wallet</label>
                    <input
                      type="text"
                      placeholder="Masukkan No Rekening..."
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-black/40 border border-purple-900/30 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-gold-primary font-mono"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-gold-primary text-[10px] block mb-1.5 uppercase flex justify-between">
                      <span>Nominal Penarikan (Rp)</span>
                      <span className="text-slate-400 font-semibold text-[9px]">Saldo: Rp {state.mainBalance.toLocaleString('id-ID')}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-black">Rp</span>
                      <input
                        type="text"
                        placeholder="Min Rp 100.000"
                        value={withdrawAmount}
                        onChange={(e) => formatWithdrawAmount(e.target.value)}
                        className="w-full bg-black/40 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-gold-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setWithdrawModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeWithdrawal}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs transition shadow-lg shadow-gold-primary/25"
                  >
                    Tarik Saldo
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CUSTOM TRANSFER FORM MODAL */}
        <AnimatePresence>
          {transferModalOpen && (
            <div className="fixed inset-0 z-[199999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setTransferModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="relative w-full max-w-sm bg-[#110724] border border-gold-primary/30 rounded-3xl p-6 text-left shadow-2xl z-10 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-blue-400 animate-pulse" />
                    {language === 'id' ? 'Form Transfer Saldo' : 'Transfer Balance Form'}
                  </h3>
                  <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-white transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-bold">
                  {/* Recipient User ID */}
                  <div>
                    <label className="text-gold-primary text-[10px] block mb-1.5 uppercase">ID atau Username Penerima</label>
                    <input
                      type="text"
                      placeholder="Contoh: GGM-USER1024"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      className="w-full bg-black/40 border border-purple-900/30 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-gold-primary font-mono uppercase"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-gold-primary text-[10px] block mb-1.5 uppercase flex justify-between">
                      <span>Nominal Transfer (Rp)</span>
                      <span className="text-slate-400 font-semibold text-[9px]">Saldo: Rp {state.mainBalance.toLocaleString('id-ID')}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-black">Rp</span>
                      <input
                        type="text"
                        placeholder="Min Rp 10.000"
                        value={transferAmount}
                        onChange={(e) => formatTransferAmount(e.target.value)}
                        className="w-full bg-black/40 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-gold-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setTransferModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeTransfer}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-300 via-gold-primary to-yellow-600 text-black font-extrabold rounded-xl text-xs transition shadow-lg shadow-gold-primary/25"
                  >
                    Kirim Transfer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CUSTOM HARVEST MODAL */}
        <AnimatePresence>
          {harvestModalOpen && (
            <div className="fixed inset-0 z-[199999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHarvestModalOpen(false)}
                className="fixed inset-0 bg-black/85 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="relative w-full max-w-sm bg-[#120a26] border border-emerald-500/35 rounded-3xl p-6 text-left shadow-2xl z-10 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
                    {language === 'id' ? 'Klaim Reward Harian' : 'Claim Daily Reward'}
                  </h3>
                  <button onClick={() => setHarvestModalOpen(false)} className="text-slate-400 hover:text-white transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 py-2">
                  {state.activeContracts === 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-2">
                      <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                      <p className="text-xs font-bold text-rose-400">
                        No active contract. Purchase a contract to start earning rewards.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-black/40 border border-emerald-500/15 rounded-2xl p-4 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1 tracking-wider">
                          {language === 'id' ? 'Nilai Kontrak Aktif' : 'Active Contract Value'}
                        </span>
                        <div className="text-2xl font-black text-gradient-gold font-orbitron">
                          Rp {totalPortfolioValue.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                          {language === 'id' ? 'Daily Reward (4%):' : 'Daily Reward (4%):'} Rp {dailyYield.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-slate-400 block uppercase mb-0.5">
                            {language === 'id' ? 'Profit Hari Ini' : "Today's Profit"}
                          </span>
                          <span className="text-emerald-400 font-mono">Rp {(state.todayProfit || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-slate-400 block uppercase mb-0.5">
                            {language === 'id' ? 'Total Profit' : 'Total Profit'}
                          </span>
                          <span className="text-yellow-500 font-mono">Rp {(state.totalProfit || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {claimCooldownText !== '' && (
                        <p className="text-[9.5px] text-amber-400 font-bold text-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                          {language === 'id' 
                            ? "Klaim berhasil hari ini. Kembali lagi setelah hitung mundur selesai."
                            : "You have already claimed today's reward. Please come back after the countdown ends."}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setHarvestModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition"
                  >
                    {language === 'id' ? 'Kembali' : 'Back'}
                  </button>
                  <button
                    onClick={() => {
                      handleClaimYield();
                      if (claimCooldownText === '' && state.activeContracts > 0) {
                        setHarvestModalOpen(false);
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
                      state.activeContracts === 0
                        ? 'bg-slate-950 border border-white/5 text-slate-500 cursor-not-allowed'
                        : claimCooldownText !== ''
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 cursor-pointer'
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-extrabold hover:brightness-110 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {claimCooldownText !== '' ? (
                      <>
                        <ClockIcon className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{claimCooldownText}</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4 text-black" />
                        <span>{language === 'id' ? 'Klaim' : 'Claim'}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* WELCOME BONUS ACHIEVEMENTS SCHEMA MODAL */}
        <AnimatePresence>
          {showBonusSchemaModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#130b2c] border border-[#2a1754]/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowBonusSchemaModal(false)}
                  className="absolute top-4.5 right-4.5 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Title */}
                <h3 className="text-[#f59e0b] text-base font-black tracking-wide uppercase mb-6 mt-1">
                  SKEMA PENCAPAIAN BONUS
                </h3>

                {/* Divider */}
                <div className="w-full h-[1.5px] bg-[#2a1754]/40 mb-4" />

                {/* List of achievements */}
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#211540]/60">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#b5179e]" />
                      <span className="text-sm font-extrabold text-white">80 Aktif</span>
                    </div>
                    <span className="text-sm font-black text-white font-sans">Get 1.800.000</span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#211540]/60">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#b5179e]" />
                      <span className="text-sm font-extrabold text-white">200 Aktif</span>
                    </div>
                    <span className="text-sm font-black text-white font-sans">Get 3.000.000</span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#211540]/60">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#b5179e]" />
                      <span className="text-sm font-extrabold text-white">500 Aktif</span>
                    </div>
                    <span className="text-sm font-black text-white font-sans">Get 5.000.000</span>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#b5179e]" />
                      <span className="text-sm font-extrabold text-white">1000 Aktif</span>
                    </div>
                    <span className="text-sm font-black text-[#f59e0b] font-sans">Get 10.000.000</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* LUCKY SPIN MODAL */}
        <AnimatePresence>
          {luckySpinModalOpen && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 15 }}
                className="w-full max-w-sm bg-[#0e0722] border border-[#3c1d70] rounded-3xl p-5 shadow-2xl relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => !isSpinning && setLuckySpinModalOpen(false)}
                  disabled={isSpinning}
                  className="absolute top-4.5 right-4.5 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed z-30 animate-none"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-5 mt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1.5">
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isSpinning ? '1s' : '4s' }} />
                    LUCKY SPIN WHEEL
                  </div>
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {language === 'id' ? 'Putar & Menang Saldo' : 'Spin & Win Gold Balance'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] mx-auto leading-relaxed">
                    {language === 'id' ? 'Dapatkan saldo utama gratis atau mining booster kecepatan penambangan!' : 'Get free main balance or mining boosters to speed up earnings!'}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-purple-500/15 mb-6" />

                {/* The Rotating Wheel Container */}
                <div className="flex flex-col items-center justify-center mb-6 relative">
                  {/* Outer Glowing Border Ring */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-[#7209b7] via-[#da70d6] to-[#f8961e] rounded-full blur-sm opacity-50 animate-pulse" />

                  {/* Pointer at the Top */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2.5 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 z-30 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                  {/* Physical Wheel Circular Div */}
                  <div 
                    className="relative w-48 h-48 rounded-full border-4 border-yellow-500 bg-[#120735] shadow-[0_0_20px_rgba(234,179,8,0.35)] overflow-hidden flex items-center justify-center z-10"
                    style={{ 
                      transform: `rotate(${spinRotation}deg)`,
                      transition: isSpinning ? 'transform 3.6s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none'
                    }}
                  >
                    {/* Render Segments */}
                    {SPIN_ITEMS.map((item, idx) => {
                      const angle = idx * 45;
                      return (
                        <div 
                          key={idx}
                          className="absolute inset-0 origin-center"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          {/* Segment Colored Triangle / Slice */}
                          <div 
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[41px] border-l-transparent border-r-[41px] border-r-transparent border-t-[96px]"
                            style={{ borderTopColor: item.color }}
                          />
                          {/* Segment Text Label */}
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 -rotate-90 origin-top text-center w-24">
                            <span className="text-[8px] font-black tracking-tighter text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] block uppercase leading-none">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Golden Center Pin / Hub */}
                    <div className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-2 border-white/60 z-20 shadow-md shadow-black flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spin Button */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className={`w-full py-3 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 ${
                    isSpinning
                      ? 'bg-purple-950/40 text-purple-400 border border-purple-500/10 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:brightness-110 active:scale-95 shadow-lg shadow-yellow-500/20 font-black cursor-pointer'
                  }`}
                >
                  <Compass className={`w-4 h-4 ${isSpinning ? 'animate-spin text-purple-400' : 'text-black'}`} />
                  {isSpinning 
                    ? (language === 'id' ? 'MEMUTAR...' : 'SPINNING...') 
                    : (language === 'id' ? 'PUTAR SEKARANG' : 'SPIN NOW')}
                </button>

                {/* Prize Table Info */}
                <div className="mt-4 bg-[#080315] border border-purple-500/10 rounded-xl p-3">
                  <span className="text-[8px] font-black text-slate-500 tracking-wider block mb-1.5 uppercase text-center">
                    {language === 'id' ? 'DAFTAR HADIAH UTAMA' : 'MAIN REWARDS LIST'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-1.5 rounded-lg border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#f8961e]" />
                      <span>{language === 'id' ? 'Rp 50.000 Tunai' : 'Rp 50,000 Cash'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-1.5 rounded-lg border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#f8961e]" />
                      <span>{language === 'id' ? 'Rp 25.000 Tunai' : 'Rp 25,000 Cash'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-1.5 rounded-lg border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#f8961e]" />
                      <span>{language === 'id' ? 'Boost Tambang 10x' : '10x Mine Boost'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/[0.01] p-1.5 rounded-lg border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#f8961e]" />
                      <span>{language === 'id' ? 'Boost Tambang 5x' : '5x Mine Boost'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MISSION MODAL */}
        <AnimatePresence>
          {missionModalOpen && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 15 }}
                className="w-full max-w-sm bg-[#070b15] border border-cyan-900/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => setMissionModalOpen(false)}
                  className="absolute top-4.5 right-4.5 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/5 z-30"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-5 mt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5">
                    <Target className="w-3.5 h-3.5" />
                    ACHIEVEMENT MISSIONS
                  </div>
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {language === 'id' ? 'Misi Harian Berhadiah' : 'Rewarded Achievement Tasks'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] mx-auto leading-relaxed">
                    {language === 'id' ? 'Selesaikan tugas-tugas di bawah ini untuk mendapatkan saldo tunai tambahan!' : 'Complete the following tasks to earn extra cash rewards instantly!'}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-cyan-500/15 mb-4" />

                {/* Missions List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {[
                    {
                      id: 'm1',
                      title: language === 'id' ? 'Aktifkan Kontrak Pertama' : 'Activate First Contract',
                      desc: language === 'id' ? 'Beli minimal 1 unit kontrak penambangan emas' : 'Purchase at least 1 unit of gold mining contract',
                      reward: 50000,
                      progressCur: state.activeContracts > 0 ? 1 : 0,
                      progressMax: 1,
                      isCompleted: state.activeContracts > 0,
                    },
                    {
                      id: 'm2',
                      title: language === 'id' ? 'Undang Downline Pertama' : 'Invite First Downline',
                      desc: language === 'id' ? 'Miliki minimal 1 partner/holder aktif di tim' : 'Have at least 1 partner/active holder in your team',
                      reward: 100000,
                      progressCur: networkActiveCount >= 1 ? 1 : 0,
                      progressMax: 1,
                      isCompleted: networkActiveCount >= 1,
                    },
                    {
                      id: 'm3',
                      title: language === 'id' ? 'Klaim Welcome Bonus' : 'Claim Welcome Bonus',
                      desc: language === 'id' ? 'Berhasil klaim bonus pendaftaran Rp 1.8M' : 'Successfully claim the registration bonus of Rp 1.8M',
                      reward: 250000,
                      progressCur: state.welcomeBonusClaimed ? 1 : 0,
                      progressMax: 1,
                      isCompleted: state.welcomeBonusClaimed,
                    },
                    {
                      id: 'm4',
                      title: language === 'id' ? 'Cairkan Hasil Tambang' : 'Withdraw Earnings',
                      desc: language === 'id' ? 'Lakukan penarikan saldo pertama kali ke rekening' : 'Make your very first balance withdrawal to bank account',
                      reward: 10000,
                      progressCur: state.totalProfit > 0 ? 1 : 0,
                      progressMax: 1,
                      isCompleted: state.totalProfit > 0,
                    },
                  ].map((mission) => {
                    const isClaimed = claimedMissions.includes(mission.id);
                    return (
                      <div 
                        key={mission.id} 
                        className="p-3 rounded-2xl bg-[#0d1527] border border-cyan-900/20 flex flex-col gap-2 transition duration-300 hover:border-cyan-500/20"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-white leading-tight">
                              {mission.title}
                            </h4>
                            <p className="text-[8px] text-slate-400 mt-0.5 leading-normal">
                              {mission.desc}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-slate-500 block uppercase">REWARD</span>
                            <span className="text-[10px] font-black text-emerald-400">Rp {mission.reward.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Progress Bar & Buttons */}
                        <div className="flex items-center justify-between gap-4 mt-1">
                          <div className="flex-1">
                            <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-bold mb-1 uppercase">
                              <span>Progress</span>
                              <span>{mission.progressCur} / {mission.progressMax}</span>
                            </div>
                            <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${(mission.progressCur / mission.progressMax) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            {isClaimed ? (
                              <button 
                                disabled 
                                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 text-[8px] font-bold cursor-default"
                              >
                                CLAIMED
                              </button>
                            ) : mission.isCompleted ? (
                              <button 
                                onClick={() => handleClaimMission(mission.id, mission.reward, mission.title)}
                                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-500 text-black text-[8px] font-extrabold hover:scale-105 active:scale-95 transition cursor-pointer shadow-md shadow-emerald-500/10"
                              >
                                CLAIM
                              </button>
                            ) : (
                              <button 
                                disabled 
                                className="px-2.5 py-1.5 rounded-lg bg-[#141d2d] border border-white/5 text-slate-500 text-[8px] font-bold cursor-not-allowed"
                              >
                                LOCK
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Previously Completed Missions Section */}
                <div className="mt-4 pt-3.5 border-t border-cyan-500/15">
                  <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {language === 'id' ? 'RIWAYAT MISI SELESAI' : 'COMPLETED MISSIONS HISTORY'}
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {claimedMissionsHistory.map((item) => (
                      <div key={item.id} className="p-2 rounded-xl bg-[#080d19]/80 border border-emerald-500/10 flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <div className="text-[9.5px] font-extrabold text-slate-200 truncate">{item.title}</div>
                          <div className="text-[7px] text-slate-500 font-bold font-mono mt-0.5">
                            {new Date(item.timestamp).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-black text-emerald-400 font-mono">+Rp {item.reward.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                    {claimedMissionsHistory.length === 0 && (
                      <div className="text-[8.5px] text-slate-500 text-center py-3 italic">
                        {language === 'id' ? 'Belum ada misi yang diselesaikan.' : 'No missions completed yet.'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        </div>
      )}

      {/* CUSTOM GLOBAL DIALOG COMPONENT */}
      <Modal
        isOpen={modalOpen}
        message={modalMessage}
        type={modalType}
        showConfirm={modalShowConfirm}
        onConfirm={modalOnConfirm}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// Simple internal helper icon to bypass legacy styles safely
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
