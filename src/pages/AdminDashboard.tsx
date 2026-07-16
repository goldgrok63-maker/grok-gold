import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Wallet, Activity } from 'lucide-react';
import { supabase } from '../supabase';
import { UserAccount } from '../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    adminCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from('grockgold_accounts_v5')
          .select('*');

        if (usersError) throw usersError;

        const mappedUsers = users?.map((u: any) => ({
          fullName: u.full_name || '',
          username: u.username,
          email: u.email || '',
          phone: u.phone || '',
          password: u.password || '',
          referralCode: u.referral_code || '',
          invitedBy: u.invited_by || null,
          createdAt: Number(u.created_at) || Date.now(),
          role: u.role || 'user',
          state: u.state,
          settings: u.settings || {},
        })) || [];

        // Calculate stats
        const totalBalance = mappedUsers.reduce((sum, u) => sum + (u.state?.mainBalance || 0), 0);
        const adminCount = mappedUsers.filter(u => u.role === 'admin').length;

        setStats({
          totalUsers: mappedUsers.length,
          totalBalance,
          totalTransactions: mappedUsers.reduce((sum, u) => sum + (u.state?.transactions?.length || 0), 0),
          adminCount,
        });

        // Get recent users (last 5)
        setRecentUsers(mappedUsers.slice(-5).reverse());
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Welcome to the admin control panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-600"
        />
        <StatCard
          icon={Wallet}
          label="Total Balance"
          value={`Rp ${(stats.totalBalance / 1000000).toFixed(2)}M`}
          color="bg-green-600"
        />
        <StatCard
          icon={Activity}
          label="Total Transactions"
          value={stats.totalTransactions}
          color="bg-purple-600"
        />
        <StatCard
          icon={Users}
          label="Admin Users"
          value={stats.adminCount}
          color="bg-yellow-600"
        />
      </div>

      {/* Recent Users */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} />
            Recent Users
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentUsers.map((user) => (
                <tr key={user.username} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    Rp {(user.state?.mainBalance / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
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

export default AdminDashboard;
