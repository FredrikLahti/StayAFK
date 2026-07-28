// IAP_SUPPORTED is computed once at module load from Platform.OS and
// Constants.executionEnvironment, so each scenario below mocks those and
// re-requires the module fresh via jest.resetModules().

type Mocks = {
  initConnection: jest.Mock;
  endConnection: jest.Mock;
  fetchProducts: jest.Mock;
  purchaseUpdatedListener: jest.Mock;
  purchaseErrorListener: jest.Mock;
  requestPurchase: jest.Mock;
  restorePurchases: jest.Mock;
  getAvailablePurchases: jest.Mock;
  finishTransaction: jest.Mock;
};

function loadIapModule(platform: 'ios' | 'android' | 'web', executionEnvironment: string) {
  jest.resetModules();

  jest.doMock('react-native', () => ({ Platform: { OS: platform } }));
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: { executionEnvironment },
    ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  }));

  const mocks: Mocks = {
    initConnection: jest.fn().mockResolvedValue(undefined),
    endConnection: jest.fn().mockResolvedValue(undefined),
    fetchProducts: jest.fn().mockResolvedValue([{ displayPrice: '$19.99' }]),
    purchaseUpdatedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    purchaseErrorListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    requestPurchase: jest.fn().mockResolvedValue(undefined),
    restorePurchases: jest.fn().mockResolvedValue(undefined),
    getAvailablePurchases: jest.fn().mockResolvedValue([]),
    finishTransaction: jest.fn().mockResolvedValue(undefined),
  };
  jest.doMock('expo-iap', () => mocks);

  const mod = require('../iap') as typeof import('../iap');
  return { mod, mocks };
}

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('expo-constants');
  jest.dontMock('expo-iap');
  jest.resetModules();
});

describe('expo-iap Expo Go guard', () => {
  it('treats iOS inside Expo Go as unsupported and never touches the native module', async () => {
    const { mod, mocks } = loadIapModule('ios', 'storeClient');

    expect(mod.isIapSupportedOnThisPlatform()).toBe(false);

    expect(await mod.initPurchaseConnection()).toBe(false);
    expect(mocks.initConnection).not.toHaveBeenCalled();

    expect(await mod.fetchUnlockProductDisplayPrice()).toBeNull();
    expect(mocks.fetchProducts).not.toHaveBeenCalled();

    const sub = mod.subscribeToPurchaseUpdates(jest.fn(), jest.fn());
    expect(mocks.purchaseUpdatedListener).not.toHaveBeenCalled();
    expect(mocks.purchaseErrorListener).not.toHaveBeenCalled();
    expect(() => sub.remove()).not.toThrow();

    await expect(mod.requestUnlockPurchase()).rejects.toThrow(/Expo Go/);
    expect(mocks.requestPurchase).not.toHaveBeenCalled();

    expect(await mod.restoreUnlockPurchase()).toBe(false);
    expect(mocks.restorePurchases).not.toHaveBeenCalled();

    await mod.endPurchaseConnection();
    expect(mocks.endConnection).not.toHaveBeenCalled();
  });

  it('still drives the real native module on iOS outside Expo Go', async () => {
    const { mod, mocks } = loadIapModule('ios', 'standalone');

    expect(mod.isIapSupportedOnThisPlatform()).toBe(true);

    expect(await mod.initPurchaseConnection()).toBe(true);
    expect(mocks.initConnection).toHaveBeenCalledTimes(1);

    mod.subscribeToPurchaseUpdates(jest.fn(), jest.fn());
    expect(mocks.purchaseUpdatedListener).toHaveBeenCalledTimes(1);
    expect(mocks.purchaseErrorListener).toHaveBeenCalledTimes(1);

    await mod.requestUnlockPurchase();
    expect(mocks.requestPurchase).toHaveBeenCalledTimes(1);
  });

  it('leaves the pre-existing web-unsupported behavior unaffected by Expo Go detection', async () => {
    const { mod, mocks } = loadIapModule('web', 'bare');

    expect(mod.isIapSupportedOnThisPlatform()).toBe(false);
    await expect(mod.requestUnlockPurchase()).rejects.toThrow(/native iOS\/Android build/);
    expect(mocks.requestPurchase).not.toHaveBeenCalled();
  });
});
