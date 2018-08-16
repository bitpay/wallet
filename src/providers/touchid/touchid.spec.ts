import { TestBed } from '@angular/core/testing';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { TouchID } from '@ionic-native/touch-id';
import { TestUtils } from '../../test';
import { AppProvider } from '../app/app';
import { PlatformProvider } from '../platform/platform';
import { TouchIdProvider } from './touchid';

describe('Provider: TouchId Provider', () => {
  let touchIdProvider: TouchIdProvider;
  let platformProvider: PlatformProvider;
  let testBed: typeof TestBed;

  beforeEach(() => {
    testBed = TestUtils.configureProviderTestingModule();
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
    it('should verify iOS device has Fingerprint', () => {
      platformProvider.isIOS = true;
      const touchId = testBed.get(TouchID);
      const spy = spyOn(touchId, 'verifyFingerprint').and.returnValue(
        Promise.resolve()
      );
      touchIdProvider.check();
      expect(spy).toHaveBeenCalled();
    });

    it('should verify Android device has Fingerprint', () => {
      platformProvider.isAndroid = true;
      const androidFingerprintAuth = testBed.get(AndroidFingerprintAuth);
      const appProvider = testBed.get(AppProvider);
      const spy = spyOn(androidFingerprintAuth, 'encrypt').and.returnValue(
        Promise.resolve({ withFingerprint: true })
      );
      touchIdProvider.check();
      expect(spy).toHaveBeenCalledWith({
        clientId: appProvider.info.nameCase
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
