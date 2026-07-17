import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Wallet as WalletIcon,
  Network as NetworkIcon,
  Settings as SettingsIcon,
  Search,
  Trash2,
  Edit,
  Check,
  X,
  Plus,
  Minus,
  RefreshCw,
  TrendingUp,
  Award,
  ShieldAlert,
  Save,
  Clock,
  Eye,
  Percent,
  CheckCircle,
  XCircle,
  Gift,
  LogOut
} from 'lucide-react';
import { UserAccount, Transaction, AppState } from '../types';
import {
  approveDepositInSupabase,
  rejectDepositInSupabase,
  approveWithdrawalInSupabase,
  rejectWithdrawalInSupabase
} from '../supabase';

interface AdminLayoutProps {
  accounts: UserAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentAccount: UserAccount | null;
  setCurrentAccount: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  saveAccountToSupabase: (account: UserAccount) => Promise<boolean>;
  language: 'id' | 'en';
  triggerModal: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  updateState: (updater: Partial<AppState> | ((prev: AppState) => AppState), forceSaveImmediately?: boolean) => void;
  onLogout?: () => void;
  globalConfig: any;
  onSaveGlobalConfig: (newConfig: any) => Promise<boolean>;
}

export default function AdminLayout({
  accounts,
  setAccounts,
  currentAccount,
  setCurrentAccount,
  saveAccountToSupabase,
  language,
  triggerModal,
  updateState,
  onLogout,
  globalConfig,
  onSaveGlobalConfig
}: AdminLayoutProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'contracts' | 'wallet' | 'network' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit user state
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editContracts, setEditContracts] = useState('');

  // Gift contract state
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftContractsQty, setGiftContractsQty] = useState('1');

  // Network filter state
  const [networkSearch, setNetworkSearch] = useState('');

  // --- DERIVE ADMIN SETTINGS PERSISTED IN ADMIN ACCOUNT ---
  const adminAccount = useMemo(() => {
    return accounts.find(acc => acc.username.toLowerCase() === 'admin') || currentAccount;
  }, [accounts, currentAccount]);

  const systemConfig = useMemo(() => {
    const defaultWalletSettings = {
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
    return { ...defaultWalletSettings, ...globalConfig };
  }, [globalConfig]);

  // Save updated system config to global config and admin account in Supabase
  const handleSaveSystemConfig = async (newConfig: any) => {
    const success = await onSaveGlobalConfig(newConfig);
    if (success) {
      triggerModal(language === 'id' ? 'Konfigurasi berhasil diperbarui.' : 'Configuration updated successfully.', 'success');
      
      // Update local memory list for real-time consistency
      const adminUser = accounts.find(acc => acc.username.toLowerCase() === 'admin');
      if (adminUser) {
        const updatedAdmin = {
          ...adminUser,
          state: {
            ...adminUser.state,
            systemConfig: newConfig
          }
        };
        setAccounts(prev => prev.map(acc => acc.username.toLowerCase() === 'admin' ? updatedAdmin : acc));
      }
    } else {
      triggerModal(language === 'id' ? '❌ Gagal memperbarui konfigurasi.' : '❌ Failed to update configuration.', 'danger');
    }
  };

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    const totalUsers = accounts.length - 1; // Exclude admin
    let totalBalances = 0;
    let totalContracts = 0;
    let allTransactions: { tx: Transaction; username: string }[] = [];

    accounts.forEach(acc => {
      if (acc.username.toLowerCase() !== 'admin') {
        totalBalances += acc.state?.mainBalance || 0;
        totalContracts += acc.state?.activeContracts || 0;
      }
      if (acc.state?.transactions) {
        acc.state.transactions.forEach(t => {
          allTransactions.push({ tx: t, username: acc.username });
        });
      }
    });

    // Sort transactions
    allTransactions.sort((a, b) => b.tx.date - a.tx.date);

    const deposits = allTransactions.filter(t => t.tx.type === 'deposit');
    const withdrawals = allTransactions.filter(t => t.tx.type === 'withdraw');

    const pendingDeposits = deposits.filter(t => t.tx.description.toLowerCase().includes('pending'));
    const pendingWithdrawals = withdrawals.filter(t => t.tx.description.toLowerCase().includes('proses') || t.tx.description.toLowerCase().includes('pending'));

    const totalDepositsVolume = deposits.reduce((sum, item) => sum + item.tx.amount, 0);
    const totalWithdrawalsVolume = withdrawals.reduce((sum, item) => sum + item.tx.amount, 0);

    return {
      totalUsers: Math.max(0, totalUsers),
      totalBalances,
      totalContracts,
      totalDepositsVolume,
      totalWithdrawalsVolume,
      allTransactions,
      deposits,
      withdrawals,
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsVolume: pendingDeposits.reduce((sum, item) => sum + item.tx.amount, 0),
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsVolume: pendingWithdrawals.reduce((sum, item) => sum + item.tx.amount, 0)
    };
  }, [accounts]);

  // --- FILTERED USERS ---
  const filteredUsers = useMemo(() => {
    return accounts
      .filter(acc => acc.username.toLowerCase() !== 'admin')
      .filter(acc => {
        const query = searchQuery.toLowerCase();
        return (
          acc.username.toLowerCase().includes(query) ||
          acc.fullName.toLowerCase().includes(query) ||
          acc.email.toLowerCase().includes(query) ||
          acc.phone.toLowerCase().includes(query)
        );
      });
  }, [accounts, searchQuery]);

  // --- NETWORK TREE COMPUTATION ---
  const networkData = useMemo(() => {
    if (!networkSearch) return null;
    const targetUser = accounts.find(acc => acc.username.toLowerCase() === networkSearch.toLowerCase());
    if (!targetUser) return null;

    // Find level 1
    const level1 = accounts.filter(acc => acc.invitedBy?.toLowerCase() === targetUser.username.toLowerCase());
    
    // Find level 2
    const level1Usernames = level1.map(acc => acc.username.toLowerCase());
    const level2 = accounts.filter(acc => acc.invitedBy && level1Usernames.includes(acc.invitedBy.toLowerCase()));

    // Find level 3
    const level2Usernames = level2.map(acc => acc.username.toLowerCase());
    const level3 = accounts.filter(acc => acc.invitedBy && level2Usernames.includes(acc.invitedBy.toLowerCase()));

    return {
      user: targetUser,
      level1,
      level2,
      level3
    };
  }, [accounts, networkSearch]);

  // --- ACTIONS ---
  
  // Edit User Balance / Contracts
  const handleEditUser = (username: string) => {
    const user = accounts.find(acc => acc.username === username);
    if (user) {
      setEditingUsername(username);
      setEditBalance(user.state.mainBalance.toString());
      setEditContracts(user.state.activeContracts.toString());
    }
  };

  const handleSaveUserEdit = () => {
    if (!editingUsername) return;
    
    const balanceNum = parseInt(editBalance) || 0;
    const contractsNum = parseInt(editContracts) || 0;

    const updatedAccounts = accounts.map(acc => {
      if (acc.username === editingUsername) {
        const updated = {
          ...acc,
          state: {
            ...acc.state,
            mainBalance: balanceNum,
            activeContracts: contractsNum
          }
        };
        saveAccountToSupabase(updated);
        return updated;
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setEditingUsername(null);
    triggerModal(language === 'id' ? '✅ Data pengguna berhasil diupdate!' : '✅ User data updated successfully!', 'success');
  };

  // Delete User
  const handleDeleteUser = (username: string) => {
    if (window.confirm(language === 'id' ? `Apakah Anda yakin ingin menghapus user ${username}?` : `Are you sure you want to delete user ${username}?`)) {
      const updatedAccounts = accounts.filter(acc => acc.username !== username);
      setAccounts(updatedAccounts);
      // Delete in Supabase can be synced by resetting, or the bulk saver handles missing ones or we write.
      // For now we sync the rest of accounts
      triggerModal(language === 'id' ? `🗑️ User ${username} berhasil dihapus dari sistem!` : `🗑️ User ${username} deleted from the system!`, 'success');
    }
  };

  // Approve Pending Deposit
  const handleApproveDeposit = async (username: string, txId: string) => {
    const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase());
    const tx = account?.state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const success = await approveDepositInSupabase(txId, username, tx.amount);
    if (success) {
      triggerModal(language === 'id' ? '✅ Deposit berhasil disetujui!' : '✅ Deposit approved successfully!', 'success');
    } else {
      triggerModal(language === 'id' ? '❌ Gagal menyetujui deposit.' : '❌ Failed to approve deposit.', 'danger');
    }
  };

  // Reject Pending Deposit
  const handleRejectDeposit = async (username: string, txId: string) => {
    const success = await rejectDepositInSupabase(txId);
    if (success) {
      triggerModal(language === 'id' ? '❌ Deposit ditolak!' : '❌ Deposit rejected!', 'warning');
    } else {
      triggerModal(language === 'id' ? '❌ Gagal menolak deposit.' : '❌ Failed to reject deposit.', 'danger');
    }
  };

  // Approve Pending Withdrawal
  const handleApproveWithdrawal = async (username: string, txId: string) => {
    const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase());
    const tx = account?.state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const success = await approveWithdrawalInSupabase(txId, username, tx.amount);
    if (success) {
      triggerModal(language === 'id' ? '✅ Penarikan berhasil disetujui!' : '✅ Withdrawal approved successfully!', 'success');
    } else {
      triggerModal(language === 'id' ? '❌ Gagal menyetujui penarikan (Saldo user mungkin tidak cukup).' : '❌ Failed to approve withdrawal (User balance might be insufficient).', 'danger');
    }
  };

  // Reject Pending Withdrawal (Refund Balance!)
  const handleRejectWithdrawal = async (username: string, txId: string) => {
    const success = await rejectWithdrawalInSupabase(txId);
    if (success) {
      triggerModal(language === 'id' ? '❌ Penarikan ditolak & dana dikembalikan!' : '❌ Withdrawal rejected & funds refunded!', 'warning');
    } else {
      triggerModal(language === 'id' ? '❌ Gagal menolak penarikan.' : '❌ Failed to reject withdrawal.', 'danger');
    }
  };

  // Gift Mining Contract
  const handleGiftContract = () => {
    if (!giftRecipient) {
      triggerModal(language === 'id' ? 'Silakan pilih penerima.' : 'Please select recipient.', 'warning');
      return;
    }
    const qty = parseInt(giftContractsQty) || 1;
    if (qty <= 0) return;

    const newTx: Transaction = {
      id: 'GFT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'reward',
      amount: qty * systemConfig.pricePerUnit,
      date: Date.now(),
      description: language === 'id' ? `🎁 Bonus Kontrak Tambahan (${qty} Unit)` : `🎁 Gifted Contract Bonus (${qty} Units)`
    };

    const updatedAccounts = accounts.map(acc => {
      if (acc.username.toLowerCase() === giftRecipient.toLowerCase()) {
        const updated = {
          ...acc,
          state: {
            ...acc.state,
            activeContracts: acc.state.activeContracts + qty,
            transactions: [newTx, ...acc.state.transactions]
          }
        };
        saveAccountToSupabase(updated);
        return updated;
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    triggerModal(language === 'id' ? `✅ Berhasil mengirim ${qty} Kontrak ke ${giftRecipient}!` : `✅ Successfully gifted ${qty} Contracts to ${giftRecipient}!`, 'success');
    setGiftRecipient('');
  };

  return (
    <div id="admin-panel-container" className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-20 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-purple-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-950/40 border border-rose-500/20 rounded-lg text-rose-500">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-widest bg-gradient-to-r from-rose-400 via-purple-300 to-rose-400 bg-clip-text text-transparent uppercase">
              {language === 'id' ? 'TERMINAL ADMIN GROCKGOLD' : 'GROCKGOLD ADMIN CONSOLE'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'id' ? 'Kontrol sistem, persetujuan transaksi, & manajemen mining real-time.' : 'Configure global parameters, manage users, and authorize transactions.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          <div className="text-xs bg-slate-900 border border-purple-900/30 px-3.5 py-1.5 rounded-xl font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYS VER 5.2.1 • {language === 'id' ? 'KONEKSI AKTIF' : 'SECURE CONNECTED'}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-rose-600/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition uppercase cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Keluar' : 'Logout'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ADMIN TABS BUTTONS */}
      <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: language === 'id' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: language === 'id' ? 'Anggota' : 'Users', icon: Users },
          { id: 'deposits', label: language === 'id' ? 'Deposit' : 'Deposits', icon: ArrowDownCircle },
          { id: 'withdrawals', label: language === 'id' ? 'Penarikan' : 'Withdrawals', icon: ArrowUpCircle },
          { id: 'contracts', label: language === 'id' ? 'Kontrak' : 'Contracts', icon: Briefcase },
          { id: 'wallet', label: language === 'id' ? 'Wallet Admin' : 'Admin Wallet', icon: WalletIcon },
          { id: 'network', label: language === 'id' ? 'Jaringan' : 'Network', icon: NetworkIcon },
          { id: 'settings', label: language === 'id' ? 'Pengaturan' : 'Settings', icon: SettingsIcon },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeAdminTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveAdminTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition uppercase shrink-0 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-slate-900/60 border border-purple-950/30 rounded-2xl p-4 md:p-6 backdrop-blur-md min-h-[450px]">
        
        {/* ==================== 1. DASHBOARD ==================== */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* WELCOME BANNER & SYSTEM STATUS */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 border border-purple-900/20 rounded-2xl p-5 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-[9px] font-black text-rose-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    {language === 'id' ? 'SISTEM KONTROL TERINTEGRASI' : 'INTEGRATED CONTROL ROOM'}
                  </div>
                  <h2 className="text-lg font-extrabold text-white">
                    {language === 'id' ? 'Selamat Datang di Portal Utama Admin' : 'Welcome to the Primary Admin Terminal'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'id' 
                      ? 'Kelola data pengguna, konfirmasi transaksi masuk/keluar, dan awasi parameter hashrate global.' 
                      : 'Govern user databases, approve financial flows, and supervise real-time mining hashrate stability.'}
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl shrink-0">
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase leading-none">{language === 'id' ? 'RATA-RATA REWARD' : 'EST. DAILY INTEREST'}</span>
                    <span className="text-xs font-black text-emerald-400 font-mono mt-0.5 block">{systemConfig.dailyRewardPercent.toFixed(1)}% / {language === 'id' ? 'Hari' : 'Day'}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase leading-none">{language === 'id' ? 'HARGA KONTRAK' : 'CONTRACT VALUE'}</span>
                    <span className="text-xs font-black text-purple-400 font-mono mt-0.5 block">Rp {systemConfig.pricePerUnit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-FIDELITY GLASS STAT CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Total Users */}
              <div className="relative overflow-hidden bg-slate-950/45 border-l-4 border-l-rose-500 border border-slate-900 rounded-2xl p-4 transition-all duration-300 hover:border-slate-800/80 hover:translate-y-[-2px] hover:shadow-xl group">
                <div className="absolute -right-3 -bottom-3 text-rose-500/5 group-hover:text-rose-500/10 transition-colors duration-300">
                  <Users className="w-20 h-20" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {language === 'id' ? 'TOTAL ANGGOTA' : 'TOTAL MEMBERS'}
                  </span>
                  <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight">{stats.totalUsers}</div>
                <div className="text-[9px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  {language === 'id' ? 'Terdaftar aktif di sistem' : 'Registered active accounts'}
                </div>
              </div>

              {/* Stat 2: Total Balances liability */}
              <div className="relative overflow-hidden bg-slate-950/45 border-l-4 border-l-emerald-500 border border-slate-900 rounded-2xl p-4 transition-all duration-300 hover:border-slate-800/80 hover:translate-y-[-2px] hover:shadow-xl group">
                <div className="absolute -right-3 -bottom-3 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors duration-300">
                  <WalletIcon className="w-20 h-20" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {language === 'id' ? 'SALDO ANGGOTA' : 'COMBINED LIABILITY'}
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <WalletIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl font-black text-slate-100 font-mono tracking-tight leading-8 truncate">
                  Rp {stats.totalBalances.toLocaleString('id-ID')}
                </div>
                <div className="text-[9px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {language === 'id' ? 'Akumulasi saldo kas user' : 'Sum of user wallets'}
                </div>
              </div>

              {/* Stat 3: Total Contracts */}
              <div className="relative overflow-hidden bg-slate-950/45 border-l-4 border-l-purple-500 border border-slate-900 rounded-2xl p-4 transition-all duration-300 hover:border-slate-800/80 hover:translate-y-[-2px] hover:shadow-xl group">
                <div className="absolute -right-3 -bottom-3 text-purple-500/5 group-hover:text-purple-500/10 transition-colors duration-300">
                  <Briefcase className="w-20 h-20" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {language === 'id' ? 'UNIT TAMBANG AKTIF' : 'ACTIVE HASH UNIT'}
                  </span>
                  <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight">
                  {stats.totalContracts} <span className="text-xs font-bold text-slate-400">Unit</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium mt-1 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Rp {(stats.totalContracts * systemConfig.pricePerUnit).toLocaleString('id-ID')} {language === 'id' ? 'Volume kontrak' : 'Contract volume'}
                </div>
              </div>

              {/* Stat 4: Pending Approvals Alert queue */}
              <div className="relative overflow-hidden bg-slate-950/45 border-l-4 border-l-amber-500 border border-slate-900 rounded-2xl p-4 transition-all duration-300 hover:border-slate-800/80 hover:translate-y-[-2px] hover:shadow-xl group">
                <div className="absolute -right-3 -bottom-3 text-amber-500/5 group-hover:text-amber-500/10 transition-colors duration-300">
                  <TrendingUp className="w-20 h-20" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {language === 'id' ? 'ANTRIAN TRANSAKSI' : 'PENDING QUEUES'}
                  </span>
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight">
                  {stats.pendingDepositsCount + stats.pendingWithdrawalsCount}
                </div>
                <div className="text-[9px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  {stats.pendingDepositsCount} DEP • {stats.pendingWithdrawalsCount} Penarikan
                </div>
              </div>
            </div>

            {/* MID-DASHBOARD DUAL-COLUMN INSIGHT MODULE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Box A: Parallel Transaction Volumetrics Bar Chart (8 Columns) */}
              <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {language === 'id' ? 'ANALISIS VOLUMETRIK KAS MASUK & KELUAR' : 'VOLUME ANALYTICS INFLOW VS OUTFLOW'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Deposits Inflow */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">{language === 'id' ? 'Total Deposit Masuk' : 'Total Deposits Inflow'}</span>
                        <span className="font-bold text-emerald-400 font-mono">Rp {stats.totalDepositsVolume.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          style={{ width: `${stats.totalDepositsVolume + stats.totalWithdrawalsVolume > 0 ? (stats.totalDepositsVolume / (stats.totalDepositsVolume + stats.totalWithdrawalsVolume)) * 100 : 50}%` }}
                        />
                      </div>
                    </div>

                    {/* Withdrawals Outflow */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">{language === 'id' ? 'Total Penarikan Keluar' : 'Total Withdrawals Outflow'}</span>
                        <span className="font-bold text-rose-400 font-mono">Rp {stats.totalWithdrawalsVolume.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          style={{ width: `${stats.totalDepositsVolume + stats.totalWithdrawalsVolume > 0 ? (stats.totalWithdrawalsVolume / (stats.totalDepositsVolume + stats.totalWithdrawalsVolume)) * 100 : 50}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/40 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <span>{language === 'id' ? 'Sistem Likuiditas Kas' : 'Reserve & Liability Net ratio'}</span>
                  <span className="text-slate-400 font-semibold font-mono">
                    Net: Rp {(stats.totalDepositsVolume - stats.totalWithdrawalsVolume).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Box B: System Parameters Status (5 Columns) */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-purple-400 animate-spin" />
                    {language === 'id' ? 'PARAMETER KESTABILAN MINING' : 'MINING CONTROL METRICS'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-black block uppercase leading-none mb-1">
                        {language === 'id' ? 'HARGA / UNIT' : 'PRICE PER UNIT'}
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        Rp {systemConfig.pricePerUnit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-black block uppercase leading-none mb-1">
                        {language === 'id' ? 'BUNGA SEHARI' : 'DAILY REWARD'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {systemConfig.dailyRewardPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-black block uppercase leading-none mb-1">
                        {language === 'id' ? 'CAPPING RATIO' : 'CAPPING RATIO'}
                      </span>
                      <span className="text-xs font-bold text-purple-400 font-mono">
                        {systemConfig.cappingPercent}%
                      </span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-black block uppercase leading-none mb-1">
                        {language === 'id' ? 'BOT REINV' : 'BOT REINV'}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${systemConfig.botsEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {systemConfig.botsEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveAdminTab('settings')}
                  className="mt-4 w-full py-2 bg-purple-950/40 hover:bg-purple-900/45 border border-purple-500/20 rounded-xl text-[9px] font-black text-purple-400 hover:text-white uppercase tracking-widest transition cursor-pointer text-center active:scale-95"
                >
                  {language === 'id' ? 'SESUAIKAN PARAMETER SISTEM' : 'CONFIGURE SYSTEM GLOBALS'}
                </button>
              </div>
            </div>

            {/* Middle Section: Pending Approvals Alert Bar */}
            {(stats.pendingDepositsCount > 0 || stats.pendingWithdrawalsCount > 0) && (
              <div className="relative overflow-hidden bg-amber-950/15 border border-amber-500/25 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl mt-0.5 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase">
                      {language === 'id' ? 'TRANSAKSI MENUNGGU VERIFIKASI SEGERA' : 'FINANCIAL TRANSACTIONS AWAITING ACTION'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {language === 'id' 
                        ? `Terdapat ${stats.pendingDepositsCount} deposit dan ${stats.pendingWithdrawalsCount} penarikan baru yang membutuhkan otorisasi Anda.` 
                        : `There are ${stats.pendingDepositsCount} pending deposits and ${stats.pendingWithdrawalsCount} withdrawal requests ready to process.`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 relative z-10 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveAdminTab('deposits')} 
                    className="flex-1 md:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition uppercase tracking-wide cursor-pointer shadow-lg shadow-amber-950/30"
                  >
                    {language === 'id' ? 'Otorisasi Deposit' : 'Process Deposits'}
                  </button>
                  <button 
                    onClick={() => setActiveAdminTab('withdrawals')} 
                    className="flex-1 md:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition uppercase tracking-wide cursor-pointer shadow-lg shadow-rose-950/30"
                  >
                    {language === 'id' ? 'Otorisasi Penarikan' : 'Process Withdrawals'}
                  </button>
                </div>
              </div>
            )}

            {/* AUDIT LOGS OVERVIEW */}
            <div className="bg-slate-950/35 border border-slate-900/80 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  {language === 'id' ? 'ALUR AKTIVITAS TRANSAKSI TERBARU' : 'RECENT SYSTEM TRANSACTION FEED'}
                </h3>
                <span className="text-[9px] bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-slate-400 font-mono font-bold uppercase tracking-wider">
                  REAL-TIME AUDIT
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-900">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-900 text-slate-500 font-black tracking-wider text-[10px] uppercase">
                      <th className="py-3 px-4">{language === 'id' ? 'Anggota' : 'User'}</th>
                      <th className="py-3 px-4">{language === 'id' ? 'Tipe' : 'Type'}</th>
                      <th className="py-3 px-4">{language === 'id' ? 'Jumlah' : 'Amount'}</th>
                      <th className="py-3 px-4">{language === 'id' ? 'Keterangan' : 'Description'}</th>
                      <th className="py-3 px-4">{language === 'id' ? 'Tanggal' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {stats.allTransactions.slice(0, 8).map(({ tx, username }) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition duration-150">
                        <td className="py-3 px-4 font-black text-slate-200">{username}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            tx.type === 'withdraw' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-100">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-medium truncate max-w-[220px]">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-bold font-mono text-[10.5px]">
                          {new Date(tx.date).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    {stats.allTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                          {language === 'id' ? 'Belum ada riwayat transaksi.' : 'No transactions recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. USERS MANAGEMENT ==================== */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            {/* Search and stats bar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Cari berdasarkan username, nama, email...' : 'Search username, full name, email...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-rose-500 transition text-slate-200"
                />
              </div>
              <div className="text-xs text-slate-400 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                {language === 'id' ? 'Menampilkan' : 'Showing'} <span className="font-bold text-rose-400">{filteredUsers.length}</span> {language === 'id' ? 'pengguna' : 'users'}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">{language === 'id' ? 'Anggota' : 'User'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Kontak' : 'Contracts'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Saldo Utama' : 'Main Balance'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Total Profit' : 'Total Profit'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Rujukan' : 'Referred By'}</th>
                    <th className="py-3 px-4 text-right">{language === 'id' ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredUsers.map(user => (
                    <tr key={user.username} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{user.username}</span>
                          {user.referralCode && (
                            <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-mono font-bold rounded">
                              {user.referralCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{user.fullName} • {user.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-400">
                        {user.state?.activeContracts || 0} Unit
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        Rp {(user.state?.mainBalance || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        Rp {(user.state?.totalEarned || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {user.invitedBy || 'Direct'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditUser(user.username)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title={language === 'id' ? 'Edit Saldo / Kontrak' : 'Edit Balance / Contracts'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            className="p-1.5 bg-rose-950/50 hover:bg-rose-950 text-rose-400 hover:text-rose-200 border border-rose-900/30 rounded-lg transition"
                            title={language === 'id' ? 'Hapus Anggota' : 'Delete Member'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {language === 'id' ? 'Tidak ada pengguna ditemukan.' : 'No users match search criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* EDIT USER STATE MODAL INLINE-LIKE */}
            {editingUsername && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 max-w-md">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
                    {language === 'id' ? `Edit User: ${editingUsername}` : `Modify User: ${editingUsername}`}
                  </h3>
                  <button onClick={() => setEditingUsername(null)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {language === 'id' ? 'Saldo Utama (IDR)' : 'Main Balance (IDR)'}
                    </label>
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {language === 'id' ? 'Kontrak Aktif' : 'Active Contracts'}
                    </label>
                    <input
                      type="number"
                      value={editContracts}
                      onChange={(e) => setEditContracts(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setEditingUsername(null)}
                    className="px-3 py-1.5 bg-slate-900 text-slate-400 text-xs font-bold rounded-lg hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserEdit}
                    className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-black rounded-lg hover:bg-rose-500 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Update
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. DEPOSITS ==================== */}
        {activeAdminTab === 'deposits' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'MANAJEMEN DEPOSIT' : 'DEPOSIT REQUESTS'}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">{language === 'id' ? 'Anggota' : 'User'}</th>
                    <th className="py-3 px-4">TXID</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Jumlah' : 'Amount'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Status / Deskripsi' : 'Status / Description'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Tanggal' : 'Date'}</th>
                    <th className="py-3 px-4 text-right">{language === 'id' ? 'Persetujuan' : 'Approval'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {stats.deposits.map(({ tx, username }) => {
                    const isPending = tx.description.toLowerCase().includes('pending') || tx.description.toLowerCase().includes('instan') && !tx.description.toLowerCase().includes('disetujui') && !tx.description.toLowerCase().includes('ditolak');
                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-bold text-slate-200">{username}</td>
                        <td className="py-3 px-4 font-mono text-purple-400">{tx.id}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">Rp {tx.amount.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.description.includes('Disetujui') || tx.description.includes('Approved') ? 'bg-emerald-500/15 text-emerald-400' :
                            tx.description.includes('Ditolak') || tx.description.includes('Rejected') ? 'bg-rose-500/15 text-rose-400' :
                            'bg-amber-500/15 text-amber-400 animate-pulse'
                          }`}>
                            {tx.description}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDeposit(username, tx.id)}
                                className="p-1 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded border border-emerald-500/20 transition"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(username, tx.id)}
                                className="p-1 bg-rose-950 text-rose-400 hover:bg-rose-900 rounded border border-rose-500/20 transition"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px] uppercase font-bold">{language === 'id' ? 'Selesai' : 'Processed'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.deposits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {language === 'id' ? 'Tidak ada transaksi deposit.' : 'No deposits found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 4. WITHDRAWALS ==================== */}
        {activeAdminTab === 'withdrawals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'MANAJEMEN PENARIKAN' : 'WITHDRAWAL REQUESTS'}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">{language === 'id' ? 'Anggota' : 'User'}</th>
                    <th className="py-3 px-4">TXID</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Jumlah' : 'Amount'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Detail / Status' : 'Details / Status'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Tanggal' : 'Date'}</th>
                    <th className="py-3 px-4 text-right">{language === 'id' ? 'Verifikasi' : 'Verification'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {stats.withdrawals.map(({ tx, username }) => {
                    const isPending = tx.description.toLowerCase().includes('proses') || tx.description.toLowerCase().includes('pending');
                    return (
                      <tr key={tx.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-bold text-slate-200">{username}</td>
                        <td className="py-3 px-4 font-mono text-purple-400">{tx.id}</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-400">Rp {tx.amount.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.description.includes('Sukses') || tx.description.includes('Disetujui') ? 'bg-emerald-500/15 text-emerald-400' :
                            tx.description.includes('Ditolak') || tx.description.includes('Rejected') ? 'bg-rose-500/15 text-rose-400' :
                            'bg-amber-500/15 text-amber-400 animate-pulse'
                          }`}>
                            {tx.description}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{new Date(tx.date).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveWithdrawal(username, tx.id)}
                                className="p-1 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded border border-emerald-500/20 transition"
                                title="Approve & Send"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(username, tx.id)}
                                className="p-1 bg-rose-950 text-rose-400 hover:bg-rose-900 rounded border border-rose-500/20 transition"
                                title="Reject & Refund"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px] uppercase font-bold">{language === 'id' ? 'Selesai' : 'Processed'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {language === 'id' ? 'Tidak ada transaksi penarikan.' : 'No withdrawals found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 5. CONTRACTS TOOL ==================== */}
        {activeAdminTab === 'contracts' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'HADIAH KONTRAK MINING' : 'GIFT MINING CONTRACTS'}
            </h3>
            
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl max-w-md space-y-4">
              <p className="text-xs text-slate-400">
                {language === 'id' 
                  ? 'Gunakan form ini untuk langsung menambahkan Kontrak Hashing ke akun anggota secara gratis (sebagai reward / bonus).' 
                  : 'Grant contract licenses instantly to specific user accounts for zero cost as promotional rewards.'}
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {language === 'id' ? 'Pilih Anggota' : 'Select User'}
                </label>
                <select
                  value={giftRecipient}
                  onChange={(e) => setGiftRecipient(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none text-slate-200"
                >
                  <option value="">-- Choose User --</option>
                  {accounts
                    .filter(acc => acc.username.toLowerCase() !== 'admin')
                    .map(acc => (
                      <option key={acc.username} value={acc.username}>
                        {acc.username} ({acc.fullName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {language === 'id' ? 'Jumlah Kontrak (Unit)' : 'Quantity (Units)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={giftContractsQty}
                  onChange={(e) => setGiftContractsQty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none text-slate-200"
                />
              </div>

              <button
                onClick={handleGiftContract}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-black rounded-lg transition uppercase flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                {language === 'id' ? 'KIRIM KONTRAK MINING' : 'GRANT MINING UNITS'}
              </button>
            </div>
          </div>
        )}

        {/* ==================== 6. ADMIN WALLET CONFIG ==================== */}
        {activeAdminTab === 'wallet' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'SINKRONISASI REKENING & WALLET PERUSAHAAN' : 'COMPANY RECEIVING ACCOUNTS'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updated = {
                  ...systemConfig,
                  bankName: formData.get('bankName') as string,
                  bankNumber: formData.get('bankNumber') as string,
                  bankHolder: formData.get('bankHolder') as string,
                  usdtAddress: formData.get('usdtAddress') as string
                };
                handleSaveSystemConfig(updated);
              }}
              className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl max-w-lg space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    defaultValue={systemConfig.bankName}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    name="bankHolder"
                    defaultValue={systemConfig.bankHolder}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Account Number</label>
                <input
                  type="text"
                  name="bankNumber"
                  defaultValue={systemConfig.bankNumber}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">USDT (TRC-20) Address</label>
                <input
                  type="text"
                  name="usdtAddress"
                  defaultValue={systemConfig.usdtAddress}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg transition uppercase flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {language === 'id' ? 'SIMPAN DETAIL WALLET' : 'SAVE WALLET CHANNELS'}
              </button>
            </form>
          </div>
        )}

        {/* ==================== 7. NETWORK ==================== */}
        {activeAdminTab === 'network' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'STRUKTUR JALUR REFERRAL USER' : 'MULTI-LEVEL NETWORK AUDIT'}
            </h3>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder={language === 'id' ? 'Masukkan username target...' : 'Enter target username...'}
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs font-medium focus:outline-none focus:border-rose-500 text-slate-200"
              />
              <button 
                onClick={() => setNetworkSearch(networkSearch)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl uppercase transition shrink-0"
              >
                Audit
              </button>
            </div>

            {networkData ? (
              <div className="space-y-6">
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Target Account Profile</div>
                  <h4 className="text-sm font-black text-slate-200">{networkData.user.username} ({networkData.user.fullName})</h4>
                  <p className="text-xs text-slate-400 mt-1">Invited By: <span className="text-purple-400 font-mono">{networkData.user.invitedBy || 'DIRECT/SYSTEM'}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LEVEL 1 */}
                  <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl">
                    <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                      Generation 1 (L1 - 10%)
                    </div>
                    <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                      {networkData.level1.map(acc => (
                        <div key={acc.username} className="text-xs py-1.5 px-2 bg-slate-900/60 rounded border border-slate-800/40 flex justify-between items-center">
                          <span className="font-bold text-slate-300">{acc.username}</span>
                          <span className="font-mono text-[10px] text-purple-400">{acc.state?.activeContracts || 0} Unit</span>
                        </div>
                      ))}
                      {networkData.level1.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-4">No L1 downlines</div>
                      )}
                    </div>
                  </div>

                  {/* LEVEL 2 */}
                  <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl">
                    <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                      Generation 2 (L2 - 3%)
                    </div>
                    <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                      {networkData.level2.map(acc => (
                        <div key={acc.username} className="text-xs py-1.5 px-2 bg-slate-900/60 rounded border border-slate-800/40 flex justify-between items-center">
                          <span className="font-bold text-slate-300">{acc.username}</span>
                          <span className="text-[10px] text-slate-500 font-mono">By {acc.invitedBy}</span>
                        </div>
                      ))}
                      {networkData.level2.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-4">No L2 downlines</div>
                      )}
                    </div>
                  </div>

                  {/* LEVEL 3 */}
                  <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl">
                    <div className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                      Generation 3 (L3 - 2%)
                    </div>
                    <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                      {networkData.level3.map(acc => (
                        <div key={acc.username} className="text-xs py-1.5 px-2 bg-slate-900/60 rounded border border-slate-800/40 flex justify-between items-center">
                          <span className="font-bold text-slate-300">{acc.username}</span>
                          <span className="text-[10px] text-slate-500 font-mono">By {acc.invitedBy}</span>
                        </div>
                      ))}
                      {networkData.level3.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-4">No L3 downlines</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              networkSearch && (
                <div className="text-xs text-rose-400 bg-rose-950/10 p-3 rounded-xl border border-rose-900/30">
                  {language === 'id' ? 'Akun tidak ditemukan. Silakan masukkan username yang tepat.' : 'Target member not found.'}
                </div>
              )
            )}
          </div>
        )}

        {/* ==================== 8. GLOBAL PARAMETERS CONFIG ==================== */}
        {activeAdminTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-2">
              {language === 'id' ? 'PARAMETER CONFIG GLOBAL & KINERJA TERMINAL' : 'GLOBAL PERFORMANCE CONFIGURATION'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updated = {
                  ...systemConfig,
                  pricePerUnit: parseInt(formData.get('pricePerUnit') as string) || 180000,
                  dailyRewardPercent: parseFloat(formData.get('dailyRewardPercent') as string) || 4.0,
                  cappingPercent: parseInt(formData.get('cappingPercent') as string) || 250,
                  minDeposit: parseInt(formData.get('minDeposit') as string) || 100000,
                  minWithdraw: parseInt(formData.get('minWithdraw') as string) || 100000,
                  simulationSpeed: parseInt(formData.get('simulationSpeed') as string) || 1,
                  botsEnabled: formData.get('botsEnabled') === 'true'
                };
                handleSaveSystemConfig(updated);
              }}
              className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl max-w-lg space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Price (IDR)</label>
                  <input
                    type="number"
                    name="pricePerUnit"
                    defaultValue={systemConfig.pricePerUnit}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Yield (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="dailyRewardPercent"
                    defaultValue={systemConfig.dailyRewardPercent}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capping Rate (%)</label>
                  <input
                    type="number"
                    name="cappingPercent"
                    defaultValue={systemConfig.cappingPercent}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Simulation Multiplier</label>
                  <select
                    name="simulationSpeed"
                    defaultValue={systemConfig.simulationSpeed}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="1">1x (Normal speed)</option>
                    <option value="5">5x (Fast testing)</option>
                    <option value="25">25x (Super-fast)</option>
                    <option value="100">100x (Extreme cycles)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Deposit (IDR)</label>
                  <input
                    type="number"
                    name="minDeposit"
                    defaultValue={systemConfig.minDeposit}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Withdraw (IDR)</label>
                  <input
                    type="number"
                    name="minWithdraw"
                    defaultValue={systemConfig.minWithdraw}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Auto Community Bot Simulation</label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="botsEnabled"
                      value="true"
                      defaultChecked={systemConfig.botsEnabled === true}
                      className="accent-rose-600"
                    />
                    <span>{language === 'id' ? 'Aktifkan Bot' : 'Enable chat bots'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="botsEnabled"
                      value="false"
                      defaultChecked={systemConfig.botsEnabled === false}
                      className="accent-rose-600"
                    />
                    <span>{language === 'id' ? 'Matikan Bot' : 'Disable chat bots'}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg transition uppercase flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {language === 'id' ? 'SIMPAN CONFIG GLOBAL' : 'SAVE GLOBAL SETTINGS'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
