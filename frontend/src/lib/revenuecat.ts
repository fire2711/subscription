import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// The entitlement identifier configured in the RevenueCat dashboard
// (Entitlements -> create "pro" -> attach it to your monthly + yearly products).
export const PRO_ENTITLEMENT_ID = 'pro';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY as string | undefined;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY as string | undefined;

let configured = false;

/** Configure the RevenueCat SDK once. Safe to call multiple times. */
export function configurePurchases() {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

  if (!apiKey) {
    // Expected in Expo Go / web / local dev without keys set. Native IAP
    // requires a real EAS development or production build.
    if (__DEV__) {
      console.warn(
        `[RevenueCat] No API key set for platform "${Platform.OS}". ` +
          'Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY.'
      );
    }
    return;
  }

  Purchases.configure({ apiKey });
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  configured = true;
}

export function isConfigured() {
  return configured;
}

/** Link the current app user to a stable id (e.g. Supabase auth user id). */
export async function loginPurchases(appUserId: string) {
  configurePurchases();
  if (!configured) return;
  try {
    await Purchases.logIn(appUserId);
  } catch (e) {
    console.warn('[RevenueCat] logIn failed', e);
  }
}

/** Reset RevenueCat back to an anonymous user (call on sign out). */
export async function logoutPurchases() {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    // Throws if already anonymous - safe to ignore.
  }
}

export function isProFromCustomerInfo(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements.active[PRO_ENTITLEMENT_ID];
}

/** Fetch the current default offering (paywall plans) from RevenueCat. */
export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  configurePurchases();
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed', e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{
  customerInfo: CustomerInfo | null;
  cancelled: boolean;
  error?: string;
}> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, cancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { customerInfo: null, cancelled: true };
    }
    return { customerInfo: null, cancelled: false, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.warn('[RevenueCat] restorePurchases failed', e);
    return null;
  }
}

/** Subscribe to entitlement changes (renewals, cancellations, refunds, etc). */
export function addCustomerInfoListener(cb: (info: CustomerInfo) => void) {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}
