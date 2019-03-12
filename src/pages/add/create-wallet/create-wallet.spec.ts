import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../test';
import { CreateWalletPage } from './create-wallet';

describe('CreateWalletPage', () => {
  let fixture: ComponentFixture<CreateWalletPage>;
  let instance;

  beforeEach(async(() => {
    return TestUtils.configurePageTestingModule([CreateWalletPage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        fixture.detectChanges();
      }
    );
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('setTotalCopayers function', () => {
    it('should call updateRCSelect functions', () => {
      const n = 3;
      const spy = spyOn(instance, 'updateRCSelect');
      instance.setTotalCopayers(n);
      expect(spy).toHaveBeenCalledWith(n);
    });
  });

  describe('setOptsAndCreate function', () => {
    it('should call create function with options', () => {
      const spy = spyOn(instance, 'create');
      const opts = {
        name: 'test',
        m: 2,
        n: 3,
        myName: 'test',
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc'
      };

      instance.createForm.value.walletName = 'test';
      instance.createForm.value.myName = 'test';
      instance.createForm.value.requiredCopayers = 2;
      instance.createForm.value.totalCopayers = 3;
      instance.createForm.value.testnetEnabled = false;
      instance.createForm.value.bwsURL = 'https://bws.bitpay.com/bws/api';
      instance.createForm.value.singleAddress = false;
      instance.createForm.value.coin = 'btc';

      instance.setOptsAndCreate();
      expect(spy).toHaveBeenCalledWith(opts);
    });
  });
});
