import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../test';
import { WalletTabsChild } from '../../wallet-tabs/wallet-tabs-child';

// pages
import { TransferToPage } from './transfer-to';

describe('TransferToPage', () => {
  let fixture: ComponentFixture<TransferToPage>;
  let instance;

  const wallet = {
    coin: 'btc',
    status: {
      totalBalanceStr: '1.000000'
    }
  };

  beforeEach(async(() => {
    spyOn(WalletTabsChild.prototype, 'getParentWallet').and.returnValue(wallet);
    TestUtils.configurePageTestingModule([TransferToPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.wallet = wallet;
      fixture.detectChanges();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('searchWallets', () => {
    beforeEach(() => {
      instance.walletBtcList = [
        {
          name: 'test1',
          coin: 'btc'
        },
        {
          name: 'test2',
          coin: 'btc'
        }
      ];

      instance.walletBchList = [
        {
          name: 'test3',
          coin: 'bch'
        },
        {
          name: 'test4',
          coin: 'bch'
        }
      ];
    });

    it('should filter BTC wallets when search by wallet name', () => {
      instance.hasBtcWallets = true;
      instance.wallet.coin = 'btc';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletBtcList);

      instance.search = 'TEST1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletBtcList[0]]);

      instance.search = 'test3';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });

    it('should filter BCH wallets when search by wallet name', () => {
      instance.hasBchWallets = true;
      instance.wallet.coin = 'bch';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletBchList);

      instance.search = 'TEST3';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletBchList[0]]);

      instance.search = 'test1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });
  });

  describe('processInput', () => {
    beforeEach(() => {
      instance.walletBtcList = [
        {
          name: 'test1',
          coin: 'btc'
        },
        {
          name: 'test2',
          coin: 'btc'
        },
        {
          name: 'differentWalletName',
          coin: 'btc'
        }
      ];

      instance.walletBchList = [
        {
          name: 'test3',
          coin: 'bch'
        },
        {
          name: 'test4',
          coin: 'bch'
        }
      ];

      instance.contactsList = [
        {
          name: 'test contact'
        },
        {
          name: 'contact2'
        }
      ];
    });
    it('should filter BTC wallets and Contacts when search something', () => {
      instance.hasBtcWallets = true;
      instance.wallet.coin = 'btc';
      instance.search = 'test';
      instance.processInput();
      expect(instance.filteredWallets.length).toEqual(2);
      expect(instance.filteredContactsList.length).toEqual(1);
      expect(instance.invalidAddress).toBeFalsy();
    });
  });
});
