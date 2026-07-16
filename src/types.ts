export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'reward';
  amount: number;
  date: number; // timestamp
  description: string;
}

export interface Holder {
  id: string;
  name: string;
  contracts: number;
  joinDate: number;
}

export interface ReferralData {
  code: string;
  link: string;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  totalCommission: number;
}

export interface UserAccount {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  referralCode: string; // User's personal invite code
  invitedBy: string | null; // Referrer's username
  createdAt: number;
  state: AppState;
  settings: {
    language: 'id' | 'en';
    notificationsEnabled: boolean;
    autoReinvest: boolean;
  };
}

export interface AppState {
  mainBalance: number;
  activeContracts: number;
  totalEarned: number;
  referralEarned: number;
  rebateEarned: number;
  lastClaimTime: number;
  welcomeBonusClaimed: boolean;
  isLoggedIn: boolean;
  username: string;
  holders: Holder[];
  goldProduction: number;
  cyclePercent: number;
  hasPurchased: boolean;
  profileImage: string | null;
  transactions: Transaction[];
  pendingMiningReward: number; // Added for real-time mining yield accumulation
  lastBoostTime?: number; // Last activation timestamp of the Turbo Booster
  todayProfit?: number; // Today's claimed profit
  totalProfit?: number; // Total claimed profit
  goldProductionDaily?: number; // Added for daily tracking
  goldProductionWeekly?: number; // Added for weekly tracking
  goldProductionMonthly?: number; // Added for monthly tracking
  lastGoldUpdateTime?: number; // Last time gold stats were updated
}

export const CONFIG = {
  PRICE_PER_UNIT: 180000,
  DAILY_REWARD_PERCENT: 0.04,
  CAPPING_PERCENT: 2.5,
  REFERRAL_LEVELS: [10, 3, 2], // 10% L1, 3% L2, 2% L3
  WELCOME_BONUS_AMOUNT: 1800000,
  REQUIRED_HOLDERS: 80,
  MIN_CONTRACT_PER_HOLDER: 1,
  CLAIM_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MIN_DEPOSIT: 100000,
  MIN_WITHDRAW: 100000,
};
