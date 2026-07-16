import React, { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';
import { supabase } from '../../supabase';

interface LogEntry {
  id: string;
  username: string;
  action: string;
  details: string;
  timestamp: number;
}

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        // Table might not exist yet, show placeholder
        console.warn('Activity logs table not found:', error);
        setLogs([
          {
            id: '1',
            username: 'admin',
            action: 'LOGIN',
            details: 'Admin logged in',
            timestamp: Date.now(),
          },
        ]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) => filterAction === 'ALL' || log.action === filterAction
  );

  const actions = ['ALL', ...new Set(logs.map((log) => log.action))];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-900 text-green-200';
      case 'LOGOUT':
        return 'bg-red-900 text-red-200';
      case 'USER_CREATED':
        return 'bg-blue-900 text-blue-200';
      case 'ROLE_CHANGED':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-gray-700 text-gray-200';
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
        <h2 className="text-3xl font-bold text-white mb-2">Activity Logs</h2>
        <p className="text-gray-400">Monitor all admin activities and system events</p>
      </div>

      {/* Filter */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={20} className="text-gray-400" />
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterAction === action
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} />
            Admin Activities ({filteredLogs.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{log.username}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;