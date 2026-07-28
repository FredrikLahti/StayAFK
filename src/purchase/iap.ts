import { Platform } from 'react-native';
import * as ExpoIap from 'expo-iap';
import type { Purchase } from 'expo-iap';

// PLACEHOLDER product id - replace once a real App Store Connect / Google
// Play Console listing exists for the one-time "full access" unlock.
export const UNLOCK_PRODUCT_ID = 'com.stayafk.fullaccess';

// PLACEHOLDER price shown before the real store price loads (or if the
// store query fails) - $19.99 per the Stage 4 brief, trivial to change
// later from the store console; this constant is display-only and never
// used to actually charge anyone.
export const PLACEHOLDER_PRICE_DISPLAY = '$19.99';

// expo-iap only lists ios/android/tvos in its module config - there is no
// web implementation, so every call here is guarded and safe to invoke
// from a screen that also has to render in this project's web preview.
const IAP_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

export function isIapSupportedOnThisPlatform(): boolean {
  return IAP_SUPPORTED;
}

export async function initPurchaseConnection(): Promise<boolean> {
  if (!IAP_SUPPORTED) return false;
  try {
    await ExpoIap.initConnection();
    return true;
  } catch (error) {
    console.warn('IAP connection unavailable', error);
    return false;
  }
}

export async function endPurchaseConnection(): Promise<void> {
  if (!IAP_SUPPORTED) return;
  try {
    await ExpoIap.endConnection();
  } catch {
    // Nothing to clean up if the connection never opened.
  }
}

export async function fetchUnlockProductDisplayPrice(): Promise<string | null> {
  if (!IAP_SUPPORTED) return null;
  try {
    const products = await ExpoIap.fetchProducts({ skus: [UNLOCK_PRODUCT_ID], type: 'in-app' });
    const product = Array.isArray(products) ? products[0] : null;
    return (product as { displayPrice?: string } | null)?.displayPrice ?? null;
  } catch (error) {
    console.warn('Failed to fetch unlock product', error);
    return null;
  }
}

export function subscribeToPurchaseUpdates(
  onPurchased: (purchase: Purchase) => void,
  onError: (error: unknown) => void
): { remove: () => void } {
  if (!IAP_SUPPORTED) return { remove() {} };

  const updateSub = ExpoIap.purchaseUpdatedListener(async (purchase) => {
    try {
      await ExpoIap.finishTransaction({ purchase, isConsumable: false });
      onPurchased(purchase);
    } catch (error) {
      onError(error);
    }
  });
  const errorSub = ExpoIap.purchaseErrorListener((error) => onError(error));

  return {
    remove() {
      updateSub.remove();
      errorSub.remove();
    },
  };
}

export async function requestUnlockPurchase(): Promise<void> {
  if (!IAP_SUPPORTED) {
    throw new Error('In-app purchases require a native iOS/Android build - not available in this preview.');
  }
  await ExpoIap.requestPurchase({
    request: { apple: { sku: UNLOCK_PRODUCT_ID }, google: { skus: [UNLOCK_PRODUCT_ID] } },
    type: 'in-app',
  });
}

export async function restoreUnlockPurchase(): Promise<boolean> {
  if (!IAP_SUPPORTED) return false;
  try {
    await ExpoIap.restorePurchases();
    const purchases = await ExpoIap.getAvailablePurchases();
    return Array.isArray(purchases) && purchases.some((p) => p.productId === UNLOCK_PRODUCT_ID);
  } catch (error) {
    console.warn('Restore purchases failed', error);
    return false;
  }
}
