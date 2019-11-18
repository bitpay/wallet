import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TestUtils } from '../../../test';

import { Coin } from '../../../providers/currency/currency';
import { RateProvider } from '../../../providers/rate/rate';
import { AmountPage } from './amount';

describe('AmountPage', () => {
  // TODO: Improve Amount page unit tests
  let fixture: ComponentFixture<AmountPage>;
  let instance;
  let testBed: typeof TestBed;
  let rateProvider: RateProvider;
  let toFiatSpy;

  const wallet = {
    coin: 'bch',
    cachedStatus: {
      totalBalanceStr: '1.000000',
      totalBalanceSat: 100000000,
      availableBalanceStr: '1.000000',
      availableBalanceSat: 100000000
    },
    credentials: {}
  };

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([AmountPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
      fixture.detectChanges();
      rateProvider = testBed.get(RateProvider);
      spyOn(rateProvider, 'getRate').and.returnValue(1000000);
      toFiatSpy = spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('sendMax', () => {
    it('should set the send display value expression to the available balance', () => {
      instance.wallet = wallet;
      instance.ionViewDidLoad();
      instance.sendMax();
      expect(instance.expression).toBe(
        instance.wallet.cachedStatus.availableBalanceSat / 1e8
      );
    });

    it('should fetch the bch rate if in bch wallet', () => {
      instance.wallet = wallet;
      instance.ionViewDidLoad();
      instance.fiatCode = 'USD';
      instance.unitIndex = 1;
      instance.unitToSatoshi = 1e8;
      instance.sendMax();
      expect(toFiatSpy).toHaveBeenCalledWith(100000000, 'USD', Coin.BCH);
      expect(instance.expression).toBe('1000000.00');
    });

    it('should skip rate calculations and go directly to confirm if not within wallet', () => {
      const finishSpy = spyOn(instance, 'finish');
      instance.sendMax();
      expect(finishSpy).toHaveBeenCalled();
    });
  });
});
