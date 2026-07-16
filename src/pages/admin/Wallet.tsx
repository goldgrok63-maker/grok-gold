import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '../../supabase';

export const Wallet: React.FC = () => {
  const [walletStats, setWalletStats] = useState({
    totalBalance: 0,
    totalProfit: 0,
    totalGoldProduction: 0,
    userCount: 0,
  });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('grockgold_accounts_v5')
        .select('*');

      if (error) throw error;

      let totalBalance = 0;
      let totalProfit = 0;
      let totalGoldProduction = 0;

      const walletList = users?.map((u: any) => ({
        username: u.username,
        balance: u.state?.mainBalance || 0,
        profit: u.state?.totalProfit || 0,
        goldProduction: u.state?.goldProduction || 0,
      })) || [];

      walletList.forEach((user) => {
        totalBalance += user.balance;
        totalProfit += user.profit;
        totalGoldProduction += user.goldProduction;
      });

      const sorted = [...walletList].sort((a, b) => b.balance - a.balance);

      setWalletStats({
        totalBalance,
        totalProfit,
        totalGoldProduction,
        userCount: walletList.length,
      });
      setTopUsers(sorted.slice(0, 10));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Wallet Management</h2>
        <p className="text-gray-400">View wallet statistics and user balances</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-white">Rp {(walletStats.totalBalance / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-600">
              <WalletIcon size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Profit</p>
              <p className="text-2xl font-bold text-green-400">Rp {(walletStats.totalProfit / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 rounded-lg bg-green-600">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Gold Production</p>
              <p className="text-2xl font-bold text-yellow-400">{walletStats.totalGoldProduction.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-600">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Users</p>
              <p className="text-2xl font-bold text-white">{walletStats.userCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-600">
              <WalletIcon size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Top 10 Users by Balance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Gold Production</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {topUsers.map((user, index) => (
                <tr key={user.username} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-bold">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-green-400 font-semibold">Rp {(user.balance / 1000000).toFixed(2)}M</td>
                  <td className="px-6 py-4 text-sm text-blue-400">Rp {(user.profit / 1000000).toFixed(2)}M</td>
                  <td className="px-6 py-4 text-sm text-yellow-400">{user.goldProduction.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Wallet;