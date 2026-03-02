import { TestBed } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { TouchIdProvider } from './touchid';

describe('Provider: TouchId Provider', () => {
  let touchIdProvider: TouchIdProvider;
  let testBed: typeof TestBed;

  beforeEach(() => {
    testBed = TestUtils.configureProviderTestingModule();
    touchIdProvider = testBed.get(TouchIdProvider);
  });

  describe('Function: isAvailable', () => {
    it('should return false if it not available', () => {
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toEqual(false);
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
      return touchIdProvider.checkWallet(wallet).then(() => {
        expect().nothing();
      });
    });
  });
});
