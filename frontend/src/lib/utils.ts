import type { BillingCycle } from './constants';

export const daysBetween = (from: Date, to: Date): number => {
  const ms = new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export const daysUntil = (dateStr: string): number => {
  return daysBetween(new Date(), new Date(dateStr));
};

// Normalize a subscription's cost to monthly equivalent.
export const toMonthly = (cost: number, cycle: BillingCycle, customDays?: number | null): number => {
  switch (cycle) {
    case 'weekly': return cost * (52 / 12);
    case 'monthly': return cost;
    case 'quarterly': return cost / 3;
    case 'yearly': return cost / 12;
    case 'custom_days':
      if (!customDays || customDays <= 0) return cost;
      return cost * (30.44 / customDays);
  }
};

export const toYearly = (cost: number, cycle: BillingCycle, customDays?: number | null): number => {
  return toMonthly(cost, cycle, customDays) * 12;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const cycleLabel = (cycle: BillingCycle, customDays?: number | null): string => {
  switch (cycle) {
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    case 'custom_days': return `Every ${customDays ?? '?'} days`;
  }
};

export const advanceRenewalDate = (dateStr: string, cycle: BillingCycle, customDays?: number | null): string => {
  const d = new Date(dateStr);
  switch (cycle) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    case 'custom_days': d.setDate(d.getDate() + (customDays || 30)); break;
  }
  return d.toISOString().slice(0, 10);
};

export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
