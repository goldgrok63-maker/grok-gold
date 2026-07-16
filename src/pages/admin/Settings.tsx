import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    siteName: 'Grok Gold Admin',
    maintenanceMode: false,
    depositEnabled: true,
    withdrawEnabled: true,
    referralEnabled: true,
    minDeposit: 100000,
    minWithdraw: 100000,
    dailyRewardPercent: 4,
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Manage system settings and configurations</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
          ✓ Settings saved successfully
        </div>
      )}

      {/* Settings */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <SettingsIcon size={20} />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Feature Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Enable Deposits</label>
              <input
                type="checkbox"
                checked={settings.depositEnabled}
                onChange={(e) => handleChange('depositEnabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Enable Withdraws</label>
              <input
                type="checkbox"
                checked={settings.withdrawEnabled}
                onChange={(e) => handleChange('withdrawEnabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Enable Referrals</label>
              <input
                type="checkbox"
                checked={settings.referralEnabled}
                onChange={(e) => handleChange('referralEnabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
          </div>
        </div>

        {/* Transaction Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Transaction Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Deposit (Rp)</label>
              <input
                type="number"
                value={settings.minDeposit}
                onChange={(e) => handleChange('minDeposit', Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Withdraw (Rp)</label>
              <input
                type="number"
                value={settings.minWithdraw}
                onChange={(e) => handleChange('minWithdraw', Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Daily Reward Percent (%)</label>
              <input
                type="number"
                value={settings.dailyRewardPercent}
                onChange={(e) => handleChange('dailyRewardPercent', Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Admin Information</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><span className="font-medium">Username:</span> {currentUser?.username}</p>
            <p><span className="font-medium">Email:</span> {currentUser?.email}</p>
            <p><span className="font-medium">Role:</span> {currentUser?.role}</p>
            <p><span className="font-medium">Joined:</span> {new Date(currentUser?.createdAt || 0).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-semibold"
      >
        <Save size={20} />
        Save Settings
      </button>
    </div>
  );
};

export default Settings;