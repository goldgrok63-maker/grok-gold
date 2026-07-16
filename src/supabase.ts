import { createClient } from '@supabase/supabase-js';
import { UserAccount } from './types';

function getSupabaseUrl(): string {
  try {
    // @ts-ignore
    const url = import.meta.env?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
    if (url && typeof url === 'string' && url.trim() !== '' && url.startsWith('http')) {
      return url.trim();
    }
  } catch (e) {}
  return 'https://qfhwprovgkjuiyiguxtn.supabase.co'

function getSupabaseKey(): string {
  try {
    // @ts-ignore
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (key && typeof key === 'string' && key.trim() !== '' && key.trim().length > 20) {
      return key.trim();
    }
  } catch (e) {}
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc251eG9paHJ6dXpkamlzZ2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwODEyOTksImV4cCI6MjA5OTY1NzI5OX0.aExtivj1uaDyNX7TxmjL1PQ_QK-6ylxVypD4VkyUNtQ';
}

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL Schema for Supabase SQL Editor:
 * 
 * CREATE TABLE IF NOT EXISTS grockgold_accounts_v5 (
 *   username TEXT PRIMARY KEY,
 *   email TEXT,
 *   full_name TEXT,
 *   phone TEXT,
 *   password TEXT,
 *   referral_code TEXT,
 *   invited_by TEXT,
 *   created_at BIGINT,
 *   state JSONB,
 *   settings JSONB,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Enable RLS (Optional, can be disabled for easier prototyping)
 * ALTER TABLE grockgold_accounts_v5 ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow public read/write" ON grockgold_accounts_v5 FOR ALL USING (true);
 */

// Save/update an account in Supabase
export async function saveAccountToSupabase(account: UserAccount): Promise<boolean> {
  try {
    const payload = {
      username: account.username,
      email: account.email,
      full_name: account.fullName,
      phone: account.phone,
      password: account.password,
      referral_code: account.referralCode,
      invited_by: account.invitedBy,
      created_at: account.createdAt,
      state: account.state,
      settings: account.settings,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('grockgold_accounts_v5')
      .upsert(payload, { onConflict: 'username' });

    if (error) {
      console.warn('Supabase upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving account to Supabase:', err);
    return false;
  }
}

// Fetch all accounts from Supabase
export async function fetchAccountsFromSupabase(): Promise<UserAccount[] | null> {
  try {
    const { data, error } = await supabase
      .from('grockgold_accounts_v5')
      .select('*');

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      fullName: row.full_name || '',
      username: row.username,
      email: row.email || '',
      phone: row.phone || '',
      password: row.password || '',
      referralCode: row.referral_code || '',
      invitedBy: row.invited_by || null,
      createdAt: Number(row.created_at) || Date.now(),
      state: row.state,
      settings: row.settings || {
        language: 'id',
        notificationsEnabled: true,
        autoReinvest: false,
      }
    }));
  } catch (err) {
    console.error('Error fetching accounts from Supabase:', err);
    return null;
  }
}

// Save/update multiple accounts in Supabase using bulk upsert
export async function saveAccountsToSupabaseBulk(accounts: UserAccount[]): Promise<boolean> {
  try {
    if (accounts.length === 0) return true;
    
    const payloads = accounts.map(account => ({
      username: account.username,
      email: account.email,
      full_name: account.fullName,
      phone: account.phone,
      password: account.password,
      referral_code: account.referralCode,
      invited_by: account.invitedBy,
      created_at: account.createdAt,
      state: account.state,
      settings: account.settings,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('grockgold_accounts_v5')
      .upsert(payloads, { onConflict: 'username' });

    if (error) {
      console.warn('Supabase bulk upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error bulk saving accounts to Supabase:', err);
    return false;
  }
}

// Helper to batch sync accounts to Supabase using bulk upsert
export async function syncAllAccountsToSupabase(accounts: UserAccount[]): Promise<void> {
  await saveAccountsToSupabaseBulk(accounts);
}
