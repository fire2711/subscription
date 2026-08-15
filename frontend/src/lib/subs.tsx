import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { BillingCycle, Category, Status } from './constants';
import { advanceRenewalDate, uuid } from './utils';
import { cancelForSubscription, scheduleForSubscription, rescheduleAll } from './notifications';

export type Subscription = {
  id: string;
  user_id?: string;
  name: string;
  icon_key: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  custom_cycle_days: number | null;
  next_renewal_date: string; // YYYY-MM-DD
  category: Category;
  status: Status;
  notes: string | null;
  reminder_days_override: number | null;
  created_at?: string;
  updated_at?: string;
};

export type RenewalHistoryItem = {
  id: string;
  subscription_id: string;
  charged_date: string;
  amount: number;
  currency: string;
};

type Ctx = {
  subs: Subscription[];
  history: RenewalHistoryItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (data: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Subscription>;
  update: (id: string, data: Partial<Subscription>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  historyFor: (id: string) => RenewalHistoryItem[];
};

const SubsContext = createContext<Ctx | null>(null);

const GUEST_SUBS_KEY = 'subtracker.guest_subs';
const GUEST_HISTORY_KEY = 'subtracker.guest_history';
const GUEST_MIGRATED_KEY = 'subtracker.guest_migrated';

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const { session, isGuest, reminderDays } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [history, setHistory] = useState<RenewalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuest = useCallback(async () => {
    const [rawSubs, rawHist] = await Promise.all([
      AsyncStorage.getItem(GUEST_SUBS_KEY),
      AsyncStorage.getItem(GUEST_HISTORY_KEY),
    ]);
    setSubs(rawSubs ? JSON.parse(rawSubs) : []);
    setHistory(rawHist ? JSON.parse(rawHist) : []);
  }, []);

  const persistGuest = useCallback(async (nextSubs: Subscription[], nextHistory?: RenewalHistoryItem[]) => {
    await AsyncStorage.setItem(GUEST_SUBS_KEY, JSON.stringify(nextSubs));
    if (nextHistory) await AsyncStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(nextHistory));
  }, []);

  const loadRemote = useCallback(async (userId: string) => {
    const [{ data: sData }, { data: hData }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', userId).order('next_renewal_date'),
      supabase.from('renewal_history').select('*').eq('user_id', userId).order('charged_date', { ascending: false }),
    ]);
    setSubs((sData as Subscription[]) ?? []);
    setHistory((hData as RenewalHistoryItem[]) ?? []);
  }, []);

  // Auto-advance past renewal dates and log history.
  const catchUpRenewals = useCallback(async (list: Subscription[]): Promise<{ subs: Subscription[]; history: RenewalHistoryItem[]; changed: boolean }> => {
    const today = new Date().toISOString().slice(0, 10);
    const nextHistory: RenewalHistoryItem[] = [];
    let changed = false;
    const nextSubs = list.map(sub => {
      if (sub.status !== 'active') return sub;
      let next = sub.next_renewal_date;
      let guard = 0;
      while (next < today && guard < 24) {
        nextHistory.push({
          id: uuid(),
          subscription_id: sub.id,
          charged_date: next,
          amount: sub.cost,
          currency: sub.currency,
        });
        next = advanceRenewalDate(next, sub.billing_cycle, sub.custom_cycle_days);
        guard++;
      }
      if (next !== sub.next_renewal_date) {
        changed = true;
        return { ...sub, next_renewal_date: next };
      }
      return sub;
    });
    return { subs: nextSubs, history: nextHistory, changed };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (session) {
      await loadRemote(session.user.id);
    } else if (isGuest) {
      await loadGuest();
    } else {
      setSubs([]);
      setHistory([]);
    }
    setLoading(false);
  }, [session, isGuest, loadRemote, loadGuest]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Post-load: catch up renewals + reschedule notifications
  useEffect(() => {
    if (loading) return;
    (async () => {
      if (subs.length === 0) return;
      const result = await catchUpRenewals(subs);
      if (result.changed) {
        setSubs(result.subs);
        setHistory(prev => [...result.history, ...prev]);
        if (session) {
          await Promise.all(result.subs.map(s => supabase.from('subscriptions').update({ next_renewal_date: s.next_renewal_date }).eq('id', s.id)));
          if (result.history.length) {
            await supabase.from('renewal_history').insert(result.history.map(h => ({ ...h, user_id: session.user.id })));
          }
        } else if (isGuest) {
          await persistGuest(result.subs, [...result.history, ...history]);
        }
        await rescheduleAll(result.subs, reminderDays);
      } else {
        await rescheduleAll(subs, reminderDays);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Migrate guest data on sign-up
  useEffect(() => {
    (async () => {
      if (!session) return;
      const already = await AsyncStorage.getItem(GUEST_MIGRATED_KEY);
      if (already === session.user.id) return;
      const raw = await AsyncStorage.getItem(GUEST_SUBS_KEY);
      if (raw) {
        const guestSubs: Subscription[] = JSON.parse(raw);
        if (guestSubs.length > 0) {
          const payload = guestSubs.map(s => ({
            user_id: session.user.id,
            name: s.name,
            icon_key: s.icon_key,
            cost: s.cost,
            currency: s.currency,
            billing_cycle: s.billing_cycle,
            custom_cycle_days: s.custom_cycle_days,
            next_renewal_date: s.next_renewal_date,
            category: s.category,
            status: s.status,
            notes: s.notes,
            reminder_days_override: s.reminder_days_override,
          }));
          await supabase.from('subscriptions').insert(payload);
          await AsyncStorage.removeItem(GUEST_SUBS_KEY);
          await AsyncStorage.removeItem(GUEST_HISTORY_KEY);
          await refresh();
        }
      }
      await AsyncStorage.setItem(GUEST_MIGRATED_KEY, session.user.id);
    })();
  }, [session, refresh]);

  const add: Ctx['add'] = async (data) => {
    if (session) {
      const { data: inserted, error } = await supabase
        .from('subscriptions')
        .insert({ ...data, user_id: session.user.id })
        .select()
        .single();
      if (error) throw error;
      const sub = inserted as Subscription;
      setSubs(prev => [...prev, sub].sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date)));
      await scheduleForSubscription(sub, reminderDays);
      return sub;
    } else {
      const sub: Subscription = { ...data, id: uuid() };
      const next = [...subs, sub].sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date));
      setSubs(next);
      await persistGuest(next);
      await scheduleForSubscription(sub, reminderDays);
      return sub;
    }
  };

  const update: Ctx['update'] = async (id, data) => {
    if (session) {
      const { data: updated, error } = await supabase
        .from('subscriptions').update(data).eq('id', id).select().single();
      if (error) throw error;
      const sub = updated as Subscription;
      setSubs(prev => prev.map(s => (s.id === id ? sub : s)).sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date)));
      await cancelForSubscription(id);
      await scheduleForSubscription(sub, reminderDays);
    } else {
      const next = subs.map(s => (s.id === id ? { ...s, ...data } : s)).sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date));
      setSubs(next);
      await persistGuest(next);
      await cancelForSubscription(id);
      const sub = next.find(s => s.id === id)!;
      await scheduleForSubscription(sub, reminderDays);
    }
  };

  const remove: Ctx['remove'] = async (id) => {
    if (session) {
      await supabase.from('subscriptions').delete().eq('id', id);
    }
    const next = subs.filter(s => s.id !== id);
    setSubs(next);
    if (!session) await persistGuest(next);
    await cancelForSubscription(id);
  };

  const togglePause: Ctx['togglePause'] = async (id) => {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;
    const status: Status = sub.status === 'active' ? 'paused' : 'active';
    await update(id, { status });
  };

  const historyFor = (id: string) => history.filter(h => h.subscription_id === id);

  return (
    <SubsContext.Provider value={{ subs, history, loading, refresh, add, update, remove, togglePause, historyFor }}>
      {children}
    </SubsContext.Provider>
  );
}

export const useSubs = () => {
  const ctx = useContext(SubsContext);
  if (!ctx) throw new Error('useSubs must be used within SubscriptionsProvider');
  return ctx;
};
