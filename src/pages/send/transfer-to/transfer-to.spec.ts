import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../test';

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
      instance.walletList.btc = [
        {
          name: 'test1',
          coin: 'btc'
        },
        {
          name: 'test2',
          coin: 'btc'
        }
      ];

      instance.walletList.bch = [
        {
          name: 'test3',
          coin: 'bch'
        },
        {
          name: 'test4',
          coin: 'bch'
        }
      ];

      instance.walletList.eth = [
        {
          name: 'test5',
          coin: 'eth'
        },
        {
          name: 'test6',
          coin: 'eth'
        }
      ];
    });

    it('should filter BTC wallets when search by wallet name', () => {
      instance.hasWallets.btc = true;
      instance.wallet.coin = 'btc';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletList.btc);

      instance.search = 'TEST1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletList.btc[0]]);

      instance.search = 'test3';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });

    it('should filter BCH wallets when search by wallet name', () => {
      instance.hasWallets.bch = true;
      instance.wallet.coin = 'bch';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletList.bch);

      instance.search = 'TEST3';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletList.bch[0]]);

      instance.search = 'test1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });

    it('should filter ETH wallets when search by wallet name', () => {
      instance.hasWallets.eth = true;
      instance.wallet.coin = 'eth';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletList.eth);

      instance.search = 'TEST5';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletList.eth[0]]);

      instance.search = 'test1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });
  });

  describe('processInput', () => {
    beforeEach(() => {
      instance.walletList.btc = [
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

      instance.walletList.bch = [
        {
          name: 'test3',
          coin: 'bch'
        },
        {
          name: 'test4',
          coin: 'bch'
        }
      ];

      instance.walletList.eth = [
        {
          name: 'test5',
          coin: 'eth'
        },
        {
          name: 'test6',
          coin: 'eth'
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
      instance.hasWallets.btc = true;
      instance.wallet.coin = 'btc';
      instance.search = 'test';
      instance.processInput();
      expect(instance.filteredWallets.length).toEqual(2);
      expect(instance.filteredContactsList.length).toEqual(1);
      expect(instance.invalidAddress).toBeFalsy();
    });

    it('should filter ETH wallets and Contacts when search something', () => {
      instance.hasWallets.eth = true;
      instance.wallet.coin = 'eth';
      instance.search = 'test';
      instance.processInput();
      expect(instance.filteredWallets.length).toEqual(2);
      expect(instance.filteredContactsList.length).toEqual(1);
      expect(instance.invalidAddress).toBeFalsy();
    });
  });
});
