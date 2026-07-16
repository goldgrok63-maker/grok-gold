import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '../../supabase';
import { Transaction } from '../../types';

export const Withdraws: React.FC = () => {
  const [withdraws, setWithdraws] = useState<{ username: string; transactions: Transaction[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWithdraws, setTotalWithdraws] = useState(0);

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('grockgold_accounts_v5')
        .select('username, state');

      if (error) throw error;

      let totalAmount = 0;
      const withdrawList = users
        ?.map((u: any) => ({
          username: u.username,
          transactions: (u.state?.transactions || []).filter((t: Transaction) => t.type === 'withdraw'),
        }))
        .filter((u) => u.transactions.length > 0) || [];

      withdrawList.forEach((user) => {
        user.transactions.forEach((t) => {
          totalAmount += t.amount;
        });
      });

      setWithdraws(withdrawList);
      setTotalWithdraws(totalAmount);
    } catch (err) {
      console.error('Error fetching withdraws:', err);
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
        <h2 className="text-3xl font-bold text-white mb-2">Withdraws</h2>
        <p className="text-gray-400">Monitor all withdrawal transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-900 rounded-lg p-6 border border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm mb-1">Total Withdraws</p>
              <p className="text-2xl font-bold text-white">Rp {(totalWithdraws / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 rounded-lg bg-red-600">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-blue-900 rounded-lg p-6 border border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-white">
                {withdraws.reduce((sum, u) => sum + u.transactions.length, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-600">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Withdraws Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">All Withdraws</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {withdraws.map((user) =>
                user.transactions.map((tx) => (
                  <tr key={`${user.username}-${tx.id}`} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-red-400 font-semibold">-Rp {(tx.amount / 1000000).toFixed(2)}M</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{tx.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(tx.date).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Withdraws;