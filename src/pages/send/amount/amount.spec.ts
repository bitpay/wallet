import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TestUtils } from '../../../test';

import { RateProvider } from '../../../providers/rate/rate';
import { Coin } from '../../../providers/wallet/wallet';
import { AmountPage } from './amount';

describe('AmountPage', () => {
  let fixture: ComponentFixture<AmountPage>;
  let instance;
  let testBed: typeof TestBed;

  const wallet = {
    coin: 'bch',
    status: {
      totalBalanceStr: '1.000000'
    }
  };

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([AmountPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
      fixture.detectChanges();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('sendMax', () => {
    it('should set the send display value expression to the total balance', () => {
      instance.wallet = wallet;
      instance.ionViewDidLoad();
      instance.sendMax();
      expect(instance.expression).toBe(instance.wallet.status.totalBalanceStr);
    });

    it('should fetch the bch rate if in bch wallet', () => {
      instance.wallet = wallet;
      instance.ionViewDidLoad();
      instance.fiatCode = 'USD';
      instance.unitIndex = 1;
      const rateProvider: RateProvider = testBed.get(RateProvider);
      spyOn(rateProvider, 'getRate').and.returnValue(1000000);
      const spy = spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      instance.sendMax();
      expect(spy).toHaveBeenCalledWith(100000000, 'USD', Coin.BCH);
      expect(instance.expression).toBe('1000000.00');
    });

    it('should skip rate calculations and go directly to confirm if not within wallet', () => {
      const spy = spyOn(instance, 'finish');
      instance.sendMax();
      expect(spy).toHaveBeenCalled();
    });
  });
});
