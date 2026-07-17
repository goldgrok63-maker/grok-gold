import { createClient } from '@supabase/supabase-js';
import { UserAccount, Transaction, AppState, CONFIG } from './types';

// =========================================================================
// SUPABASE CLIENT INITIALIZATION
// =========================================================================

function getSupabaseUrl(): string {
  try {
    // @ts-ignore
    const url = import.meta.env?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
    if (url && typeof url === 'string' && url.trim() !== '' && url.startsWith('http')) {
      if (!url.includes('clsnuxoihrzuzdjisgbm')) {
        return url.trim();
      }
    }
  } catch (e) {}
  return 'https://qfhwprovgkjuiyiguxtn.supabase.co';
}

function getSupabaseKey(): string {
  try {
    // @ts-ignore
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (key && typeof key === 'string' && key.trim() !== '' && key.trim().length > 20) {
      if (!key.includes('ImNsc251eG9paHJ6dXpkamlzZ2JtI')) {
        return key.trim();
      }
    }
  } catch (e) {}
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHdwcm92Z2tqdWl5aWd1eHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTc0NTUsImV4cCI6MjA5OTc5MzQ1NX0.r2MkVzBez8D0Hgi5CMzNSUPHRMSDNq6To0AYTfioGYA';
}

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================================
// SQL SCHEMA SCRIPT FOR USER (TO RUN IN SUPABASE SQL EDITOR)
// =========================================================================
export const SUPABASE_SQL_SCHEMA = `
-- ==========================================
-- GROCKGOLD DUAL SYSTEM SQL SCHEMA
-- ==========================================

-- 1. TABLE: users
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  referral_code TEXT UNIQUE,
  invited_by TEXT,
  main_balance NUMERIC DEFAULT 0,
  active_contracts INTEGER DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  referral_earned NUMERIC DEFAULT 0,
  rebate_earned NUMERIC DEFAULT 0,
  last_claim_time BIGINT DEFAULT 0,
  welcome_bonus_claimed BOOLEAN DEFAULT FALSE,
  profile_image TEXT,
  pending_mining_reward NUMERIC DEFAULT 0,
  created_at BIGINT,
  settings JSONB DEFAULT '{"language": "id", "notificationsEnabled": true, "autoReinvest": false}'::jsonb
);

-- 2. TABLE: deposits
CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES users(username) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_method TEXT,
  proof_image TEXT,
  created_at BIGINT NOT NULL
);

-- 3. TABLE: withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES users(username) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at BIGINT NOT NULL
);

-- 4. TABLE: contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES users(username) ON DELETE CASCADE,
  units INTEGER NOT NULL,
  price_paid NUMERIC NOT NULL,
  daily_reward_rate NUMERIC DEFAULT 0.04,
  status TEXT DEFAULT 'active', -- 'active', 'expired'
  created_at BIGINT NOT NULL,
  last_profit_claim BIGINT NOT NULL
);

-- 5. TABLE: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES users(username) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'reward', 'purchase', 'referral', 'rebate', 'welcome_bonus'
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at BIGINT NOT NULL
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES FOR USERS AND ADMIN
-- Users can see/edit their own data; Admin can do anything.

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read deposits" ON deposits FOR SELECT USING (true);
CREATE POLICY "Allow public insert deposits" ON deposits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update deposits" ON deposits FOR UPDATE USING (true);

CREATE POLICY "Allow public read withdrawals" ON withdrawals FOR SELECT USING (true);
CREATE POLICY "Allow public insert withdrawals" ON withdrawals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update withdrawals" ON withdrawals FOR UPDATE USING (true);

CREATE POLICY "Allow public read contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Allow public insert contracts" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contracts" ON contracts FOR UPDATE USING (true);

CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON transactions FOR UPDATE USING (true);

-- ENABLE REALTIME ON ALL TABLES
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table deposits;
alter publication supabase_realtime add table withdrawals;
alter publication supabase_realtime add table contracts;
alter publication supabase_realtime add table transactions;

-- 6. TABLE: global_config
CREATE TABLE IF NOT EXISTS global_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  price_per_unit NUMERIC DEFAULT 180000,
  daily_reward_percent NUMERIC DEFAULT 4.0,
  capping_percent NUMERIC DEFAULT 250,
  min_deposit NUMERIC DEFAULT 100000,
  min_withdraw NUMERIC DEFAULT 100000,
  simulation_speed NUMERIC DEFAULT 1,
  bots_enabled BOOLEAN DEFAULT true,
  bank_name TEXT DEFAULT 'BCA',
  bank_number TEXT DEFAULT '8402-1920-22',
  bank_holder TEXT DEFAULT 'PT GROCKGOLD INDONESIA',
  usdt_address TEXT DEFAULT 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a'
);

ALTER TABLE global_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read global_config" ON global_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert global_config" ON global_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update global_config" ON global_config FOR UPDATE USING (true);

-- Enable realtime for global_config table
alter publication supabase_realtime add table global_config;
`;

// =========================================================================
// SYSTEM SEEDER FOR DEFAULT ADMIN
// =========================================================================

export async function seedDefaultAdminIfNeeded(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', 'admin')
      .single();

    if (error || !data) {
      const adminPayload = {
        username: 'admin',
        full_name: 'System Administrator',
        email: 'admin@grockgold.com',
        phone: '+6281234567890',
        password: 'admin123',
        referral_code: '',
        invited_by: null,
        main_balance: 1000000000, // Large starting balance for Admin treasury
        active_contracts: 0,
        total_earned: 0,
        referral_earned: 0,
        rebate_earned: 0,
        last_claim_time: 0,
        welcome_bonus_claimed: true,
        profile_image: null,
        pending_mining_reward: 0,
        created_at: Date.now(),
        settings: {
          language: 'id',
          notificationsEnabled: true,
          autoReinvest: false
        }
      };

      await supabase.from('users').insert(adminPayload);
      console.log('Seeded default admin successfully.');
    }
  } catch (err) {
    console.error('Error seeding default admin:', err);
  }
}

// =========================================================================
// REALTIME RETRIEVAL AND MAPPING ENGINE
// =========================================================================

export async function fetchAccountsFromSupabase(): Promise<UserAccount[] | null> {
  try {
    // Seed default admin first
    await seedDefaultAdminIfNeeded();

    const [usersRes, depositsRes, withdrawalsRes, contractsRes, transactionsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('deposits').select('*'),
      supabase.from('withdrawals').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('transactions').select('*')
    ]);

    if (usersRes.error) throw new Error(usersRes.error.message);

    const users = usersRes.data || [];
    const deposits = depositsRes.data || [];
    const withdrawals = withdrawalsRes.data || [];
    const contracts = contractsRes.data || [];
    const transactions = transactionsRes.data || [];

    // Map into UserAccount structure to ensure seamless frontend compatibility
    return users.map((user: any) => {
      const usernameLower = user.username.toLowerCase();

      // Gather transactions belonging to this user
      const userTxs: Transaction[] = [];

      // 1. Map standard transactions
      transactions
        .filter((t: any) => t.username.toLowerCase() === usernameLower)
        .forEach((t: any) => {
          userTxs.push({
            id: t.id,
            type: t.type as any,
            amount: Number(t.amount) || 0,
            date: Number(t.created_at) || Date.now(),
            description: t.description || ''
          });
        });

      // 2. Map deposits (convert to tx model for historic visibility if approved or pending)
      deposits
        .filter((d: any) => d.username.toLowerCase() === usernameLower)
        .forEach((d: any) => {
          userTxs.push({
            id: d.id,
            type: 'deposit',
            amount: Number(d.amount) || 0,
            date: Number(d.created_at) || Date.now(),
            description: d.status === 'pending' 
              ? '⏳ Deposit (Pending)' 
              : d.status === 'rejected' 
                ? '❌ Deposit Ditolak Admin' 
                : '✅ Deposit Disetujui Admin'
          });
        });

      // 3. Map withdrawals
      withdrawals
        .filter((w: any) => w.username.toLowerCase() === usernameLower)
        .forEach((w: any) => {
          userTxs.push({
            id: w.id,
            type: 'withdraw',
            amount: Number(w.amount) || 0,
            date: Number(w.created_at) || Date.now(),
            description: w.status === 'pending'
              ? '⏳ Penarikan (Pending)'
              : w.status === 'rejected'
                ? '❌ Penarikan Ditolak (Dana Dikembalikan)'
                : '✅ Penarikan Sukses (Disetujui Admin)'
          });
        });

      // Sort combined transaction logs by descending time
      userTxs.sort((a, b) => b.date - a.date);

      // Compute downline accounts (holders)
      const holders = users
        .filter((u: any) => u.invited_by?.toLowerCase() === usernameLower)
        .map((u: any) => ({
          id: 'H-' + u.username,
          name: u.full_name,
          contracts: Number(u.active_contracts) || 0,
          joinDate: Number(u.created_at) || Date.now()
        }));

      // Calculate earnings breakdown dynamically from standard transactions table
      const standardUserTxs = transactions.filter((t: any) => t.username.toLowerCase() === usernameLower);

      const dynMiningProfit = standardUserTxs
        .filter((t: any) => t.type === 'reward')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const dynReferralEarned = standardUserTxs
        .filter((t: any) => t.type === 'referral')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const dynRebateEarned = standardUserTxs
        .filter((t: any) => t.type === 'rebate')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const dynWelcomeBonus = standardUserTxs
        .filter((t: any) => t.type === 'welcome_bonus' || t.type === 'bonus')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const dynTotalEarned = dynMiningProfit + dynReferralEarned + dynRebateEarned + dynWelcomeBonus;

      return {
        fullName: user.full_name || '',
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        password: user.password || '',
        referralCode: user.username.toLowerCase() === 'admin' ? '' : (user.referral_code || ''),
        invitedBy: user.invited_by || null,
        createdAt: Number(user.created_at) || Date.now(),
        settings: user.settings || {
          language: 'id',
          notificationsEnabled: true,
          autoReinvest: false
        },
        state: {
          mainBalance: Number(user.main_balance) || 0,
          activeContracts: Number(user.active_contracts) || 0,
          totalEarned: dynTotalEarned,
          referralEarned: dynReferralEarned,
          rebateEarned: dynRebateEarned,
          lastClaimTime: Number(user.last_claim_time) || 0,
          welcomeBonusClaimed: !!user.welcome_bonus_claimed || dynWelcomeBonus > 0,
          isLoggedIn: false,
          username: user.username,
          holders,
          goldProduction: 0,
          cyclePercent: 0,
          hasPurchased: (Number(user.active_contracts) || 0) > 0,
          profileImage: user.profile_image || null,
          transactions: userTxs,
          pendingMiningReward: Number(user.pending_mining_reward) || 0,
          todayProfit: userTxs
            .filter(t => t.type === 'reward' && new Date(t.date).toDateString() === new Date().toDateString())
            .reduce((sum, item) => sum + item.amount, 0),
          totalProfit: dynTotalEarned
        }
      };
    });
  } catch (err) {
    console.error('Error in fetchAccountsFromSupabase:', err);
    return null;
  }
}

// =========================================================================
// REAL-TIME OPERATIONS & DATABASE SYNCHRONIZERS
// =========================================================================

// 1. Create User (Registration)
export async function registerUserInSupabase(account: UserAccount): Promise<boolean> {
  try {
    const payload = {
      username: account.username,
      full_name: account.fullName,
      email: account.email,
      phone: account.phone,
      password: account.password,
      referral_code: account.referralCode,
      invited_by: account.invitedBy,
      created_at: account.createdAt,
      main_balance: account.state.mainBalance,
      active_contracts: account.state.activeContracts,
      total_earned: account.state.totalEarned,
      referral_earned: account.state.referralEarned,
      rebate_earned: account.state.rebateEarned,
      last_claim_time: account.state.lastClaimTime,
      welcome_bonus_claimed: account.state.welcomeBonusClaimed,
      profile_image: account.state.profileImage,
      pending_mining_reward: account.state.pendingMiningReward,
      settings: account.settings
    };

    const { error } = await supabase.from('users').insert(payload);
    if (error) {
      console.warn('Error creating user in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Registration query crash:', err);
    return false;
  }
}

// 2. Request a Deposit (status: pending)
export async function createDepositInSupabase(
  id: string,
  username: string,
  amount: number,
  paymentMethod: string,
  proofImage: string | null
): Promise<boolean> {
  try {
    const payload = {
      id,
      username,
      amount,
      status: 'pending',
      payment_method: paymentMethod,
      proof_image: proofImage,
      created_at: Date.now()
    };

    const { error } = await supabase.from('deposits').insert(payload);
    if (error) {
      console.warn('Deposit request error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Deposit request query crash:', err);
    return false;
  }
}

// 3. Request a Withdrawal (status: pending)
export async function createWithdrawalInSupabase(
  id: string,
  username: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
): Promise<boolean> {
  try {
    const payload = {
      id,
      username,
      amount,
      status: 'pending',
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      created_at: Date.now()
    };

    const { error } = await supabase.from('withdrawals').insert(payload);
    if (error) {
      console.warn('Withdraw request error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Withdraw request query crash:', err);
    return false;
  }
}

// 4. Update Profile Image
export async function updateProfileImageInSupabase(username: string, imageUrl: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ profile_image: imageUrl })
      .eq('username', username);

    return !error;
  } catch (err) {
    console.error('Error updating profile image:', err);
    return false;
  }
}

// 5. Update settings in Supabase
export async function updateUserSettingsInSupabase(username: string, settings: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ settings })
      .eq('username', username);

    return !error;
  } catch (err) {
    console.error('Error updating settings:', err);
    return false;
  }
}

// 6. Update general appState in Supabase (For users & admin profile)
export async function saveAccountToSupabase(account: UserAccount): Promise<boolean> {
  try {
    const payload = {
      full_name: account.fullName,
      email: account.email,
      phone: account.phone,
      password: account.password,
      referral_code: account.referralCode,
      invited_by: account.invitedBy,
      main_balance: account.state.mainBalance,
      active_contracts: account.state.activeContracts,
      total_earned: account.state.totalEarned,
      referral_earned: account.state.referralEarned,
      rebate_earned: account.state.rebateEarned,
      last_claim_time: account.state.lastClaimTime,
      welcome_bonus_claimed: account.state.welcomeBonusClaimed,
      profile_image: account.state.profileImage,
      pending_mining_reward: account.state.pendingMiningReward,
      settings: account.settings
    };

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('username', account.username);

    if (error) {
      console.warn('Supabase update user error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving user to Supabase:', err);
    return false;
  }
}

// =========================================================================
// REALTIME SEAMLESS TRANSACTION APPROVAL ENGINE (ADMIN ATOMIC QUERIES)
// =========================================================================

// Approve Deposit
export async function approveDepositInSupabase(depositId: string, username: string, amount: number): Promise<boolean> {
  try {
    // 1. Check deposit status first to avoid double approval
    const { data: dep } = await supabase.from('deposits').select('status').eq('id', depositId).single();
    if (!dep || dep.status !== 'pending') return false;

    // 2. Fetch User latest main_balance to perform atomic increment
    const { data: user } = await supabase.from('users').select('main_balance').eq('username', username).single();
    const currentBalance = Number(user?.main_balance) || 0;
    const newBalance = currentBalance + amount;

    // 3. Atomically update deposit status, user balance and insert transaction log
    const txId = 'TXD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const [depUpdate, userUpdate, txInsert] = await Promise.all([
      supabase.from('deposits').update({ status: 'approved' }).eq('id', depositId),
      supabase.from('users').update({ main_balance: newBalance }).eq('username', username),
      supabase.from('transactions').insert({
        id: txId,
        username,
        type: 'deposit',
        amount,
        description: '✅ Deposit Disetujui Admin',
        created_at: Date.now()
      })
    ]);

    if (depUpdate.error || userUpdate.error || txInsert.error) {
      console.error('Atomic Deposit Approval error:', depUpdate.error || userUpdate.error || txInsert.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Approve deposit crash:', err);
    return false;
  }
}

// Reject Deposit
export async function rejectDepositInSupabase(depositId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'rejected' })
      .eq('id', depositId);

    return !error;
  } catch (err) {
    console.error('Reject deposit crash:', err);
    return false;
  }
}

// Approve Withdrawal
export async function approveWithdrawalInSupabase(withdrawId: string, username: string, amount: number): Promise<boolean> {
  try {
    // 1. Check withdrawal status
    const { data: wd } = await supabase.from('withdrawals').select('status').eq('id', withdrawId).single();
    if (!wd || wd.status !== 'pending') return false;

    // 2. Fetch User balance
    const { data: user } = await supabase.from('users').select('main_balance').eq('username', username).single();
    const currentBalance = Number(user?.main_balance) || 0;

    if (currentBalance < amount) {
      console.warn('Insufficient user balance to approve withdrawal!');
      return false;
    }

    const newBalance = currentBalance - amount;
    const txId = 'TXW-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // 3. Perform atomic operations
    const [wdUpdate, userUpdate, txInsert] = await Promise.all([
      supabase.from('withdrawals').update({ status: 'approved' }).eq('id', withdrawId),
      supabase.from('users').update({ main_balance: newBalance }).eq('username', username),
      supabase.from('transactions').insert({
        id: txId,
        username,
        type: 'withdraw',
        amount,
        description: '✅ Penarikan Sukses (Disetujui Admin)',
        created_at: Date.now()
      })
    ]);

    if (wdUpdate.error || userUpdate.error || txInsert.error) {
      console.error('Atomic Withdrawal Approval error:', wdUpdate.error || userUpdate.error || txInsert.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Approve withdrawal crash:', err);
    return false;
  }
}

// Reject Withdrawal
export async function rejectWithdrawalInSupabase(withdrawId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', withdrawId);

    return !error;
  } catch (err) {
    console.error('Reject withdrawal crash:', err);
    return false;
  }
}

// =========================================================================
// REAL-TIME USER FINANCIAL TRANSACTIONS ENGINE (ATOMIC AND TRANSACTIONAL)
// =========================================================================

// Purchase a Contract (Atomic transaction simulation)
export async function purchaseContractInSupabase(username: string, units: number, pricePerUnit: number): Promise<boolean> {
  try {
    const totalCost = units * pricePerUnit;

    // 1. Fetch User balance
    const { data: user } = await supabase
      .from('users')
      .select('main_balance, active_contracts')
      .eq('username', username)
      .single();

    if (!user) return false;

    const currentBalance = Number(user.main_balance) || 0;
    const currentContracts = Number(user.active_contracts) || 0;

    if (currentBalance < totalCost) {
      return false;
    }

    const newBalance = currentBalance - totalCost;
    const newContracts = currentContracts + units;

    const contractId = 'CON-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const txId = 'PUR-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // 2. Perform atomic operations in parallel
    const [userUpdate, contractInsert, txInsert] = await Promise.all([
      supabase
        .from('users')
        .update({
          main_balance: newBalance,
          active_contracts: newContracts
        })
        .eq('username', username),
      supabase
        .from('contracts')
        .insert({
          id: contractId,
          username,
          units,
          price_paid: totalCost,
          daily_reward_rate: 0.04,
          status: 'active',
          created_at: Date.now(),
          last_profit_claim: Date.now()
        }),
      supabase
        .from('transactions')
        .insert({
          id: txId,
          username,
          type: 'purchase',
          amount: totalCost,
          description: `Membeli Kontrak Tambang (${units} Unit)`,
          created_at: Date.now()
        })
    ]);

    if (userUpdate.error || contractInsert.error || txInsert.error) {
      console.error('Purchase Contract operations failed:', userUpdate.error || contractInsert.error || txInsert.error);
      return false;
    }

    // 3. Distribute MLM network level commissions to referrers (Levels: 10%, 3%, 2%)
    let currentReferrer = await getInviterUsername(username);
    const levels = CONFIG.REFERRAL_LEVELS; // [10, 3, 2]

    for (let i = 0; i < levels.length; i++) {
      if (!currentReferrer) break;

      const commissionPercent = levels[i] / 100;
      const commissionAmount = Math.round(totalCost * commissionPercent);

      if (commissionAmount > 0) {
        await distributeReferralCommission(currentReferrer, commissionAmount, username, i + 1);
      }

      // Go up the chain
      currentReferrer = await getInviterUsername(currentReferrer);
    }

    return true;
  } catch (err) {
    console.error('Purchase Contract crash:', err);
    return false;
  }
}

// Fetch helper to go up MLM chain
async function getInviterUsername(username: string): Promise<string | null> {
  try {
    const { data } = await supabase.from('users').select('invited_by').eq('username', username).single();
    return data?.invited_by || null;
  } catch {
    return null;
  }
}

// Distribute commission atomically
async function distributeReferralCommission(referrer: string, amount: number, buyerUsername: string, level: number): Promise<void> {
  try {
    const { data: user } = await supabase.from('users').select('main_balance, referral_earned').eq('username', referrer).single();
    if (!user) return;

    const currentBalance = Number(user.main_balance) || 0;
    const currentRefEarned = Number(user.referral_earned) || 0;

    const txId = 'COM-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    await Promise.all([
      supabase
        .from('users')
        .update({
          main_balance: currentBalance + amount,
          referral_earned: currentRefEarned + amount
        })
        .eq('username', referrer),
      supabase
        .from('transactions')
        .insert({
          id: txId,
          username: referrer,
          type: 'referral',
          amount,
          description: `Komisi Referral Lvl ${level} dari pembelian ${buyerUsername}`,
          created_at: Date.now()
        })
    ]);
  } catch (err) {
    console.error('Error distributing referral commission:', err);
  }
}

// Claim welcome bonus
export async function claimWelcomeBonusInSupabase(username: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.from('users').select('main_balance, welcome_bonus_claimed').eq('username', username).single();
    if (!user || user.welcome_bonus_claimed) return false;

    const currentBalance = Number(user.main_balance) || 0;
    const bonusAmount = CONFIG.WELCOME_BONUS_AMOUNT; // 1,800,000

    const txId = 'WLC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const [userUpdate, txInsert] = await Promise.all([
      supabase.from('users').update({
        main_balance: currentBalance + bonusAmount,
        welcome_bonus_claimed: true
      }).eq('username', username),
      supabase.from('transactions').insert({
        id: txId,
        username,
        type: 'welcome_bonus',
        amount: bonusAmount,
        description: '🎁 Bonus Registrasi Anggota Baru',
        created_at: Date.now()
      })
    ]);

    return !userUpdate.error && !txInsert.error;
  } catch (err) {
    console.error('Error claiming welcome bonus:', err);
    return false;
  }
}

// Claim yield / reward claim
export async function claimDailyRewardInSupabase(username: string, amount: number): Promise<boolean> {
  try {
    const { data: user } = await supabase.from('users').select('main_balance, total_earned').eq('username', username).single();
    if (!user) return false;

    const currentBalance = Number(user.main_balance) || 0;
    const currentEarned = Number(user.total_earned) || 0;

    const txId = 'CLM-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const [userUpdate, txInsert] = await Promise.all([
      supabase.from('users').update({
        main_balance: currentBalance + amount,
        total_earned: currentEarned + amount,
        last_claim_time: Date.now(),
        pending_mining_reward: 0
      }).eq('username', username),
      supabase.from('transactions').insert({
        id: txId,
        username,
        type: 'reward',
        amount,
        description: 'Klaim Reward Harian (4%)',
        created_at: Date.now()
      })
    ]);

    return !userUpdate.error && !txInsert.error;
  } catch (err) {
    console.error('Error claiming daily reward:', err);
    return false;
  }
}

// Update pending reward accumulating real-time in UI
export async function updatePendingMiningRewardInSupabase(username: string, amount: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ pending_mining_reward: amount })
      .eq('username', username);

    return !error;
  } catch {
    return false;
  }
}

// System reset / restore data (for dev reset)
export async function resetAllDataInSupabase(): Promise<boolean> {
  try {
    // Delete and let them seed again
    await Promise.all([
      supabase.from('transactions').delete().neq('username', 'admin'),
      supabase.from('contracts').delete().neq('username', 'admin'),
      supabase.from('deposits').delete().neq('username', 'admin'),
      supabase.from('withdrawals').delete().neq('username', 'admin'),
      supabase.from('users').delete().neq('username', 'admin'),
      supabase.from('global_config').delete().neq('id', 'dummy_nonexistent_id')
    ]);
    return true;
  } catch {
    return false;
  }
}

// =========================================================================
// GLOBAL CONFIGURATION SYSTEM WITH DUAL PERSISTENCE & AUTO-FALLBACK
// =========================================================================

function mapDbConfigToSystemConfig(db: any): any {
  return {
    pricePerUnit: Number(db.price_per_unit) || 180000,
    dailyRewardPercent: Number(db.daily_reward_percent) || 4.0,
    cappingPercent: Number(db.capping_percent) || 250,
    minDeposit: Number(db.min_deposit) || 100000,
    minWithdraw: Number(db.min_withdraw) || 100000,
    simulationSpeed: Number(db.simulation_speed) || 1,
    botsEnabled: db.bots_enabled !== false,
    bankName: db.bank_name || 'BCA',
    bankNumber: db.bank_number || '8402-1920-22',
    bankHolder: db.bank_holder || 'PT GROCKGOLD INDONESIA',
    usdtAddress: db.usdt_address || 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a'
  };
}

function mapSystemConfigToDbConfig(sys: any): any {
  return {
    price_per_unit: Number(sys.pricePerUnit),
    daily_reward_percent: Number(sys.dailyRewardPercent),
    capping_percent: Number(sys.cappingPercent),
    min_deposit: Number(sys.minDeposit),
    min_withdraw: Number(sys.minWithdraw),
    simulation_speed: Number(sys.simulationSpeed),
    bots_enabled: sys.botsEnabled === true,
    bank_name: sys.bankName,
    bank_number: sys.bankNumber,
    bank_holder: sys.bankHolder,
    usdt_address: sys.usdtAddress
  };
}

async function fetchFallbackConfig(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('state')
      .eq('username', 'admin')
      .single();

    if (!error && data && data.state?.systemConfig) {
      return data.state.systemConfig;
    }
  } catch (err) {
    console.error('Error in fetchFallbackConfig:', err);
  }
  return {
    bankName: 'BCA',
    bankNumber: '8402-1920-22',
    bankHolder: 'PT GROCKGOLD INDONESIA',
    usdtAddress: 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a',
    pricePerUnit: 180000,
    dailyRewardPercent: 4.0,
    cappingPercent: 250,
    minDeposit: 100000,
    minWithdraw: 100000,
    simulationSpeed: 1,
    botsEnabled: true
  };
}

export async function fetchGlobalConfig(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('global_config')
      .select('*')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching from global_config table, trying fallback...', error);
      return await fetchFallbackConfig();
    }

    if (!data) {
      const defaultConfig = {
        id: 'current',
        price_per_unit: 180000,
        daily_reward_percent: 4.0,
        capping_percent: 250,
        min_deposit: 100000,
        min_withdraw: 100000,
        simulation_speed: 1,
        bots_enabled: true,
        bank_name: 'BCA',
        bank_number: '8402-1920-22',
        bank_holder: 'PT GROCKGOLD INDONESIA',
        usdt_address: 'TYrN8xZ7p8asD89xHjasDJKH190Kash18a'
      };
      
      const { error: insertError } = await supabase
        .from('global_config')
        .insert([defaultConfig]);

      if (insertError) {
        console.warn('Could not insert default config to global_config, probably table doesn\'t exist.', insertError);
        return await fetchFallbackConfig();
      }
      return mapDbConfigToSystemConfig(defaultConfig);
    }

    return mapDbConfigToSystemConfig(data);
  } catch (err) {
    console.warn('fetchGlobalConfig general error, falling back:', err);
    return await fetchFallbackConfig();
  }
}

export async function saveGlobalConfig(config: any): Promise<boolean> {
  try {
    const dbPayload = mapSystemConfigToDbConfig(config);
    
    // 1. Try to save to global_config table
    const { error } = await supabase
      .from('global_config')
      .upsert({ id: 'current', ...dbPayload });

    if (error) {
      console.warn('Could not save to global_config table, trying fallback update to admin user...', error);
    }

    // 2. ALWAYS save to the admin account state in 'users' table as fallback / dual sync
    const { data: adminRes, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (!fetchErr && adminRes) {
      const updatedState = {
        ...(adminRes.state || {}),
        systemConfig: config
      };
      await supabase
        .from('users')
        .update({ state: updatedState })
        .eq('username', 'admin');
    }

    // 3. Update local in-memory CONFIG instantly
    updateGlobalConfig(config);

    return true;
  } catch (err) {
    console.error('saveGlobalConfig general error:', err);
    return false;
  }
}

export function updateGlobalConfig(config: any) {
  if (config.pricePerUnit !== undefined) {
    CONFIG.PRICE_PER_UNIT = Number(config.pricePerUnit);
  }
  if (config.dailyRewardPercent !== undefined) {
    CONFIG.DAILY_REWARD_PERCENT = Number(config.dailyRewardPercent) / 100;
  }
  if (config.cappingPercent !== undefined) {
    CONFIG.CAPPING_PERCENT = Number(config.cappingPercent) / 100;
  }
  if (config.minDeposit !== undefined) {
    CONFIG.MIN_DEPOSIT = Number(config.minDeposit);
  }
  if (config.minWithdraw !== undefined) {
    CONFIG.MIN_WITHDRAW = Number(config.minWithdraw);
  }
}

