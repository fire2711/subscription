import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  auth_provider: string;
  reminder_default_days: number;
  currency_preference: string;
  subscription_tier: 'free' | 'pro';
};

type AuthState = {
  session: Session | null;
  isGuest: boolean;
  profile: Profile | null;
  loading: boolean;
  isPro: boolean;
  reminderDays: number;
  currency: string;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  setPro: (v: boolean) => Promise<void>; // MOCKED paywall
  updatePrefs: (p: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthState | null>(null);

const GUEST_KEY = 'subtracker.is_guest';
const GUEST_PREFS_KEY = 'subtracker.guest_prefs';

const DEFAULT_PROFILE: Profile = {
  id: 'guest',
  email: null,
  auth_provider: 'guest',
  reminder_default_days: 3,
  currency_preference: 'USD',
  subscription_tier: 'free',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGuestPrefs = useCallback(async () => {
    const raw = await AsyncStorage.getItem(GUEST_PREFS_KEY);
    if (raw) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
        return;
      } catch {}
    }
    setProfile(DEFAULT_PROFILE);
  }, []);

  const loadProfile = useCallback(async (userId: string, email: string | null) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setProfile(data as Profile);
    } else {
      // Upsert profile if missing (defensive; trigger normally handles it).
      const seed: Profile = { ...DEFAULT_PROFILE, id: userId, email, auth_provider: 'email' };
      await supabase.from('profiles').upsert(seed);
      setProfile(seed);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const guest = await AsyncStorage.getItem(GUEST_KEY);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        await loadProfile(data.session.user.id, data.session.user.email ?? null);
      } else if (guest === '1') {
        setIsGuest(true);
        await loadGuestPrefs();
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        setIsGuest(false);
        await AsyncStorage.removeItem(GUEST_KEY);
        await loadProfile(s.user.id, s.user.email ?? null);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile, loadGuestPrefs]);

  const signInEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUpEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    setProfile(null);
  };

  const continueAsGuest = async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setIsGuest(true);
    await loadGuestPrefs();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? { error: error.message } : {};
  };

  const setPro = async (v: boolean) => {
    const tier = v ? 'pro' : 'free';
    if (session && profile) {
      await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', session.user.id);
      setProfile({ ...profile, subscription_tier: tier });
    } else if (profile) {
      const next = { ...profile, subscription_tier: tier as 'free' | 'pro' };
      setProfile(next);
      await AsyncStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(next));
    }
  };

  const updatePrefs = async (p: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...p };
    setProfile(next);
    if (session) {
      await supabase.from('profiles').update(p).eq('id', session.user.id);
    } else {
      await AsyncStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(next));
    }
  };

  const deleteAccount = async () => {
    if (!session) return { error: 'Not signed in' };
    // Client-side cannot delete auth.users without service key; delete profile + data instead.
    await supabase.from('renewal_history').delete().eq('user_id', session.user.id);
    await supabase.from('subscriptions').delete().eq('user_id', session.user.id);
    await supabase.from('profiles').delete().eq('id', session.user.id);
    await supabase.auth.signOut();
    return {};
  };

  const isPro = profile?.subscription_tier === 'pro';

  return (
    <AuthContext.Provider
      value={{
        session,
        isGuest,
        profile,
        loading,
        isPro,
        reminderDays: profile?.reminder_default_days ?? 3,
        currency: profile?.currency_preference ?? 'USD',
        signInEmail,
        signUpEmail,
        signOut,
        continueAsGuest,
        resetPassword,
        setPro,
        updatePrefs,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
