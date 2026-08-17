import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

export const PRODUCT_IDS = {
  monthly: 'streamrotate_pro_monthly',
  annual: 'streamrotate_pro_annual',
};

let initialized = false;

export async function initIAP(userId: string) {
  if (!Capacitor.isNativePlatform() || initialized) return;
  const apiKey = Capacitor.getPlatform() === 'android'
    ? import.meta.env.VITE_REVENUECAT_ANDROID_KEY
    : import.meta.env.VITE_REVENUECAT_IOS_KEY;
  if (!apiKey) return; // key not configured for this platform yet
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
  await Purchases.configure({ apiKey, appUserID: userId });
  initialized = true;
}

export type PurchaseResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function purchasePro(
  plan: 'monthly' | 'annual',
  userId?: string,
): Promise<PurchaseResult> {
  try {
    // Make sure the SDK is configured (in case init hasn't finished yet).
    if (!initialized && userId) await initIAP(userId);

    const wantedId = PRODUCT_IDS[plan];
    const offerings = await Purchases.getOfferings();

    // Prefer the "current" offering, but fall back to ANY offering that
    // contains our product — the current offering may not be set in the
    // RevenueCat dashboard, which would otherwise leave `current` null.
    const candidateOfferings = [
      offerings.current,
      ...Object.values(offerings.all || {}),
    ].filter(Boolean) as { availablePackages: any[] }[];

    let pkg: any = null;
    for (const off of candidateOfferings) {
      pkg = off.availablePackages.find(p => p.product?.identifier === wantedId);
      if (pkg) break;
    }

    // Last resort: match by package type if the product id lookup failed.
    if (!pkg) {
      const wantType = plan === 'monthly' ? 'MONTHLY' : 'ANNUAL';
      for (const off of candidateOfferings) {
        pkg = off.availablePackages.find(p => p.packageType === wantType);
        if (pkg) break;
      }
    }

    if (!pkg) {
      return { status: 'error', message: 'Subscription options are unavailable right now. Please try again later.' };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const isActive = customerInfo.entitlements.active['pro'] !== undefined ||
      customerInfo.activeSubscriptions.includes(wantedId);
    return isActive
      ? { status: 'success' }
      : { status: 'error', message: 'Purchase completed but Pro is not active yet. Try Restore Purchases.' };
  } catch (e: any) {
    if (e?.code === '1' || e?.userCancelled || e?.userInfo?.readableErrorCode === 'PurchaseCancelledError') {
      return { status: 'cancelled' };
    }
    return { status: 'error', message: e?.message || 'Purchase failed. Please try again.' };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch {
    return false;
  }
}

export async function getProStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch {
    return false;
  }
}
