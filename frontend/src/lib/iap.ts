import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

export const PRODUCT_IDS = {
  monthly: 'streamrotate_pro_monthly',
  annual: 'streamrotate_pro_annual',
};

let initialized = false;

export async function initIAP(userId: string) {
  if (!Capacitor.isNativePlatform() || initialized) return;
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
  await Purchases.configure({
    apiKey: import.meta.env.VITE_REVENUECAT_IOS_KEY,
    appUserID: userId,
  });
  initialized = true;
}

export async function purchasePro(plan: 'monthly' | 'annual'): Promise<'success' | 'cancelled' | 'error'> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return 'error';

    const pkg = current.availablePackages.find((p: { product: { identifier: string } }) =>
      p.product.identifier === PRODUCT_IDS[plan]
    );
    if (!pkg) return 'error';

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const isActive = customerInfo.activeSubscriptions.includes(PRODUCT_IDS[plan]) ||
      customerInfo.entitlements.active['pro'] !== undefined;
    return isActive ? 'success' : 'error';
  } catch (e: any) {
    if (e?.code === '1' || e?.userCancelled) return 'cancelled';
    return 'error';
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
