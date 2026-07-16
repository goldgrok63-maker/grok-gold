import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserAccount } from '../types';
import { supabase } from '../supabase';

interface AuthContextType {
  currentUser: UserAccount | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: 'admin' | 'user' | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const storedUsername = localStorage.getItem('currentUsername');
        
        if (storedUsername) {
          // Fetch user data from Supabase
          const { data, error } = await supabase
            .from('grockgold_accounts_v5')
            .select('*')
            .eq('username', storedUsername)
            .single();

          if (error) {
            console.warn('Failed to fetch user from Supabase:', error);
            localStorage.removeItem('currentUsername');
            setCurrentUser(null);
            setIsAuthenticated(false);
          } else if (data) {
            const user: UserAccount = {
              fullName: data.full_name || '',
              username: data.username,
              email: data.email || '',
              phone: data.phone || '',
              password: data.password || '',
              referralCode: data.referral_code || '',
              invitedBy: data.invited_by || null,
              createdAt: Number(data.created_at) || Date.now(),
              role: data.role || 'user', // Read role from database
              state: data.state,
              settings: data.settings || {
                language: 'id',
                notificationsEnabled: true,
                autoReinvest: false,
              }
            };
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('grockgold_accounts_v5')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        throw new Error('User not found');
      }

      // Simple password check (in production, use proper hashing)
      if (data.password !== password) {
        throw new Error('Invalid password');
      }

      const user: UserAccount = {
        fullName: data.full_name || '',
        username: data.username,
        email: data.email || '',
        phone: data.phone || '',
        password: data.password || '',
        referralCode: data.referral_code || '',
        invitedBy: data.invited_by || null,
        createdAt: Number(data.created_at) || Date.now(),
        role: data.role || 'user', // Read role from database
        state: data.state,
        settings: data.settings || {
          language: 'id',
          notificationsEnabled: true,
          autoReinvest: false,
        }
      };

      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUsername', username);

      // Log admin activity if user is admin
      if (user.role === 'admin') {
        await logAdminActivity(username, 'LOGIN', 'Admin logged in');
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.role === 'admin') {
        await logAdminActivity(currentUser.username, 'LOGOUT', 'Admin logged out');
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUsername');
  };

  const checkAuth = async () => {
    const storedUsername = localStorage.getItem('currentUsername');
    if (storedUsername && !isAuthenticated) {
      const { data } = await supabase
        .from('grockgold_accounts_v5')
        .select('*')
        .eq('username', storedUsername)
        .single();

      if (data) {
        const user: UserAccount = {
          fullName: data.full_name || '',
          username: data.username,
          email: data.email || '',
          phone: data.phone || '',
          password: data.password || '',
          referralCode: data.referral_code || '',
          invitedBy: data.invited_by || null,
          createdAt: Number(data.created_at) || Date.now(),
          role: data.role || 'user',
          state: data.state,
          settings: data.settings || {
            language: 'id',
            notificationsEnabled: true,
            autoReinvest: false,
          }
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    }
  };

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAuthenticated,
    userRole: currentUser?.role || null,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper function to log admin activities
async function logAdminActivity(username: string, action: string, details: string) {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        username,
        action,
        details,
        timestamp: Date.now(),
      });

    if (error) {
      console.warn('Failed to log admin activity:', error);
    }
  } catch (err) {
    console.error('Error logging admin activity:', err);
  }
}
