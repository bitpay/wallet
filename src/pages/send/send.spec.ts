import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Events, NavParams } from 'ionic-angular';

import { Coin } from '../../providers/wallet/wallet';
import { TestUtils } from '../../test';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';
import { SendPage } from './send';

describe('SendPage', () => {
  let fixture: ComponentFixture<SendPage>;
  let instance;
  let testBed: typeof TestBed;

  const wallet = {
    coin: 'bch',
    status: {
      totalBalanceStr: '1.000000'
    }
  };

  beforeEach(async(() => {
    spyOn(WalletTabsChild.prototype, 'getParentWallet').and.returnValue(wallet);
    TestUtils.configurePageTestingModule([SendPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.wallet = wallet;
      testBed = testEnv.testBed;
      fixture.detectChanges();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('openScanner', () => {
    it('should set the send display value expression to the total balance', () => {
      const walletTabsProvider: WalletTabsProvider = testBed.get(
        WalletTabsProvider
      );
      const events: Events = testBed.get(Events);
      const navParams: NavParams = testBed.get(NavParams);
      const amount = '1.00000';
      const coin = Coin.BCH;
      instance.useSendMax = false;
      spyOn(navParams, 'get').and.returnValues(amount, coin);
      const sendParamsSpy = spyOn(walletTabsProvider, 'setSendParams');
      const publishSpy = spyOn(events, 'publish');
      instance.openScanner();
      expect(sendParamsSpy).toHaveBeenCalledWith({
        amount,
        coin,
        useSendMax: false
      });
      expect(publishSpy).toHaveBeenCalledWith('ScanFromWallet');
    });
  });
});
