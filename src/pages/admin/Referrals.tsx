import React, { useState, useEffect } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { supabase } from '../../supabase';
import { UserAccount } from '../../types';

export const Referrals: React.FC = () => {
  const [referralData, setReferralData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReferralEarnings, setTotalReferralEarnings] = useState(0);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('grockgold_accounts_v5')
        .select('*');

      if (error) throw error;

      const referralList = users
        ?.map((u: any) => ({
          username: u.username,
          referralCode: u.referral_code,
          referralEarned: u.state?.referralEarned || 0,
          invitedBy: u.invited_by,
          createdAt: u.created_at,
        }))
        .filter((u) => u.referralEarned > 0 || u.invitedBy) || [];

      const total = referralList.reduce((sum, u) => sum + u.referralEarned, 0);
      setReferralData(referralList);
      setTotalReferralEarnings(total);
    } catch (err) {
      console.error('Error fetching referrals:', err);
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
        <h2 className="text-3xl font-bold text-white mb-2">Referral System</h2>
        <p className="text-gray-400">Monitor referral activities and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-900 rounded-lg p-6 border border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm mb-1">Total Referral Earnings</p>
              <p className="text-2xl font-bold text-white">Rp {(totalReferralEarnings / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-600">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-blue-900 rounded-lg p-6 border border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm mb-1">Active Referrers</p>
              <p className="text-2xl font-bold text-white">
                {referralData.filter((r) => r.referralEarned > 0).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-600">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Referral Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Referral Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Invited By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {referralData.map((ref) => (
                <tr key={ref.username} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{ref.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-mono">{ref.referralCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{ref.invitedBy || '-'}</td>
                  <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                    Rp {(ref.referralEarned / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(ref.createdAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Referrals;