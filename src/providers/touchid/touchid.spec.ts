import { TestUtils } from '../../test';
import { PlatformProvider } from '../platform/platform';
import { TouchIdProvider } from './touchid';

describe('Provider: TouchId Provider', () => {
  let touchIdProvider: TouchIdProvider;
  let platformProvider: PlatformProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    touchIdProvider = testBed.get(TouchIdProvider);
    platformProvider = testBed.get(PlatformProvider);
  });

  describe('Function: isAvailable', () => {
    it('should return false if it not available', () => {
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toEqual(false);
      });
    });

    it('should return isAvailable value if platform is Android', () => {
      platformProvider.isAndroid = true;
      platformProvider.isCordova = true;
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });

    it('should return isAvailable value if platform is IOS', () => {
      platformProvider.isIOS = true;
      platformProvider.isCordova = true;
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });
  });

  describe('Function: check', () => {
    it('should verify is IOS device has Fingerprint', () => {
      platformProvider.isIOS = true;
      platformProvider.isCordova = true;
      touchIdProvider.check().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });

    it('should verify is Android device has Fingerprint', () => {
      platformProvider.isAndroid = true;
      touchIdProvider.check().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });
  });

  describe('Function: checkWallet', () => {
    it('should verify is IOS device has Fingerprint', () => {
      let wallet = {
        isComplete() {
          return false;
        },
        needsBackup: false
      };
      platformProvider.isIOS = true;
      return touchIdProvider.checkWallet(wallet).then(() => {
        expect().nothing();
      });
    });
  });
});
