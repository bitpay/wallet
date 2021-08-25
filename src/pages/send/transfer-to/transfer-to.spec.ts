import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../test';

// pages
import { TransferToPage } from './transfer-to';

describe('TransferToPage', () => {
  let fixture: ComponentFixture<TransferToPage>;
  let instance;

  const wallet = {
    coin: 'bch',
    network: 'livenet',
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
      instance.walletList.xec = [
        {
          name: 'test1',
          coin: 'xec',
          network: 'livenet'
        },
        {
          name: 'test2',
          coin: 'xec'
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

      instance.walletList.xpi = [
        {
          name: 'test5',
          coin: 'xpi'
        },
        {
          name: 'test6',
          coin: 'xpi'
        }
      ];
    });

    it('should filter XEC wallets when search by wallet name', () => {
      instance.hasWallets.bch = true;
      instance.wallet.coin = 'xec';
      instance.wallet.network = 'livenet';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletList.xec);

      instance.search = 'TEST1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletList.xec[0]]);

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

    it('should filter XPI wallets when search by wallet name', () => {
      instance.hasWallets.xpi = true;
      instance.wallet.coin = 'xpi';

      instance.search = 'test';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual(instance.walletList.xpi);

      instance.search = 'TEST5';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([instance.walletList.xpi[0]]);

      instance.search = 'test1';
      instance.searchWallets();
      expect(instance.filteredWallets).toEqual([]);
    });
  });

  describe('processInput', () => {
    beforeEach(() => {
      instance.walletList.xec = [
        {
          name: 'test1',
          coin: 'xec'
        },
        {
          name: 'test2',
          coin: 'xec'
        },
        {
          name: 'differentWalletName',
          coin: 'xec'
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

      instance.walletList.xpi = [
        {
          name: 'test5',
          coin: 'xpi'
        },
        {
          name: 'test6',
          coin: 'xpi'
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
    it('should filter XEC wallets and Contacts when search something', () => {
      instance.hasWallets.xec = true;
      instance.wallet.coin = 'xec';
      instance.search = 'test';
      instance.processInput();
      expect(instance.filteredWallets.length).toEqual(2);
      expect(instance.filteredContactsList.length).toEqual(1);
      expect(instance.invalidAddress).toBeFalsy();
    });

    it('should filter XPI wallets and Contacts when search something', () => {
      instance.hasWallets.xpi = true;
      instance.wallet.coin = 'xpi';
      instance.search = 'test';
      instance.processInput();
      expect(instance.filteredWallets.length).toEqual(2);
      expect(instance.filteredContactsList.length).toEqual(1);
      expect(instance.invalidAddress).toBeFalsy();
    });
  });
});
