# SubTracker - Subscription Tracker & Renewal Reminder

## One-Line
A mobile app to track all recurring subscriptions in one place, see total spending, and get reminded before renewals to cancel unwanted ones.

## Stack
- **Frontend**: React Native + Expo Router (SDK 54)
- **Backend/Auth/DB**: Supabase (Postgres + Auth + RLS)
- **Local storage (guest mode)**: AsyncStorage
- **Notifications**: expo-notifications (local scheduled)
- **Payments**: MOCKED paywall (RevenueCat requires real builds)

## Design
- Dark-first, "iOS-Native Clean" personality
- Palette: Deep slate (#09090B) + emerald (#10B981)
- Bottom tabs: Home, Insights (Pro), Settings
- FAB "+" for adding subscriptions

## Core Flows
1. Splash → session check → Onboarding (3 slides) or Auth
2. Auth: email/password sign-up + login, Google OAuth via id_token, Guest mode
3. Add first subscription: preset grid (Netflix, Spotify, Disney+, Notion, Adobe, ChatGPT+, etc.) or custom
4. Home dashboard: sticky total spend (monthly/yearly toggle) + list sorted by nearest renewal
5. Subscription detail with renewal history
6. Add/Edit form (name, cost, currency, billing cycle, next renewal, category, notes)
7. Insights: pie chart by category + 6-month line chart (Pro-locked with blurred preview)
8. Settings: account, reminder default (1/3/7 days), currency, notifications, Pro upgrade
9. Paywall triggered at 6th subscription or Insights tap for free tier

## Data
- Supabase tables: `profiles`, `subscriptions`, `renewal_history` with RLS
- Guest data: AsyncStorage, migrated on sign-up

## Notifications
- Local scheduled: renewal_date - reminder_window (default 3 days, per-sub override for Pro)
- Copy: "[Name] renews in X day(s) for [Cost] — cancel now if you don't need it"

## Monetization (MOCKED)
- Free: 5 subs, default reminder only, no Insights
- Pro: unlimited + custom reminders + Insights + history ($2.99/mo, $19.99/yr)

## Out of scope v1
- Bank linking, in-app cancel flows, family accounts, web app, localization, widgets
