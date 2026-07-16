import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Shield } from 'lucide-react';
import { supabase } from '../../supabase';
import { UserAccount } from '../../types';

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grockgold_accounts_v5')
        .select('*');

      if (error) throw error;

      const mappedUsers = data?.map((u: any) => ({
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

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (username: string) => {
    try {
      const { error } = await supabase
        .from('grockgold_accounts_v5')
        .update({ role: 'admin' })
        .eq('username', username);

      if (error) throw error;
      fetchUsers();
      alert('User promoted to admin');
    } catch (err) {
      console.error('Error promoting user:', err);
      alert('Failed to promote user');
    }
  };

  const handleDemoteToUser = async (username: string) => {
    try {
      const { error } = await supabase
        .from('grockgold_accounts_v5')
        .update({ role: 'user' })
        .eq('username', username);

      if (error) throw error;
      fetchUsers();
      alert('User demoted to regular user');
    } catch (err) {
      console.error('Error demoting user:', err);
      alert('Failed to demote user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-3xl font-bold text-white mb-2">Manage Users</h2>
        <p className="text-gray-400">View and manage all user accounts</p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} />
            All Users ({filteredUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.username} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{user.fullName}</td>
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
                  <td className="px-6 py-4 text-sm space-x-2">
                    {user.role === 'user' ? (
                      <button
                        onClick={() => handlePromoteToAdmin(user.username)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield size={16} />
                        <span className="hidden sm:inline text-xs">Admin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDemoteToUser(user.username)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Demote to User"
                      >
                        <Shield size={16} />
                        <span className="hidden sm:inline text-xs">User</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      title="View Details"
                    >
                      <Edit2 size={16} />
                    </button>
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

export default ManageUsers;