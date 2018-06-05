import { AppProvider, PopupProvider } from '..';
import { TestUtils } from '../../test';
import { Logger } from '../logger/logger';
import { IncomingDataProvider } from './incoming-data';

describe('Provider: Incoming Data Provider', () => {
  let incomingDataProvider: IncomingDataProvider;
  let logger: Logger;
  let spy;

  class AppProviderMock {
    public info = {};
    constructor() {
      this.info = { name: 'bitpay', _enabledExtensions: { debitcard: true } };
    }
  }

  class PopupProviderMock {
    constructor() {}
    ionicConfirm() {
      return Promise.resolve(true);
    }
    ionicAlert() {
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: AppProvider, useClass: AppProviderMock },
      { provide: PopupProvider, useClass: PopupProviderMock }
    ]);
    incomingDataProvider = testBed.get(IncomingDataProvider);
    logger = testBed.get(Logger);
    spy = spyOn(logger, 'debug');
  });

  describe('Function: SCANNER Redir', () => {
    it('Should handle plain text', () => {
      let data = [
        'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63o StZzF93Y5wvzdUayhgkkFoicQZcP3y52uPPxFnfoLZB21Teqt1VvEHx', // BIP 32 mainnet xprivkey
        'cNJFgo1driFnPcBdBX8BrJrpxchBW XwXCvNH5SoSkdcF6JXXwHMm', // WIF Testnet Privkey (compressed pubkey)
        'tprv8ZgxMBicQKsPcsbCVeqqF1KVdH7gwDJbxbzpCxDUsoXHdb6SnTPY xdwSAKDC6KKJzv7khnNWRAJQsRA8BBQyiSfYnRt6zuu4vZQGKjeW4YF', // BIP 32 testnet xprivkey
        'Jason was here'
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling plain text');
      });
    });
    it('Should handle Plain URL', () => {
      let data = [
        'http://bitpay.com/', // non-SSL URL Handling
        'https://bitpay.com/' // SSL URL Handling
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling Plain URL');
      });
    });
    it('Should handle Join Wallet', () => {
      let data =
        'copay:RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Join Wallet');
    });
    it('Should handle Old Join Wallet', () => {
      let data =
        'RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Old Join Wallet');
    });
    it('Should handle QR Code Export feature', () => {
      let data = [
        "1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|testnet|m/44'/1'/0'|false",
        '2|',
        '3|'
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling QR Code Export feature');
      });
    });
    it('Should handle BTC and BCH BitPay Invoices', () => {
      let data = [
        'bitcoin:?r=https://bitpay.com/i/CtcM753gnZ4Wpr5pmXU6i9',
        'bitcoincash:?r=https://bitpay.com/i/Rtz1RwWA7kdRRU3Wyo4YDY'
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith(
          'Handling Payment Protocol with non-backwards-compatible request'
        );
      });
    });
    it('Should handle Bitcoin cash Copay/BitPay format and CashAddr format plain Address', () => {
      let data = [
        'qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
        'CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN'
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling Bitcoin Cash Plain Address');
      });
    });
    it('Should handle Bitcoin cash Copay/BitPay format and CashAddr format URI', () => {
      let data = [
        'bitcoincash:CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN',
        'bitcoincash:qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w'
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling Bitcoin Cash URI');
      });
    });
    it('Should handle Bitcoin URI', () => {
      let data = [
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Bitcoin Address
        'bitcoincash:qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w', // Genesis Testnet3 Bitcoin Address
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000&label=Genesis%20Bitcoin%20Address&message=test%20message' // Basic Payment Protocol
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling Bitcoin URI');
      });
    });
    it('Should Handle Bitcoin Cash URI with legacy address', () => {
      let data = 'bitcoincash:1ML5KKKrJEHw3fQqhhajQjHWkh3yKhNZpa';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith(
        'Handling Bitcoin Cash URI with legacy address'
      );
    });
    it('Should handle Bitcoin Livenet and Testnet Plain Address', () => {
      let data = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Bitcoin Address
        'mpXwg4jMtRhuSpVq4xS3HFHmCmWp9NyGKt' // Genesis Testnet3 Bitcoin Address
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling Bitcoin Plain Address');
      });
    });
    it('Should handle private keys', () => {
      let data = [
        '6PnSQd4UamkL5LDZrAsmymQrAgj1jywES6frfp5DeFGWni7VouwjxeJ68z', // BIP 38 Encrypt Private Key
        '5Hwgr3u458GLafKBgxtssHSPqJnYoGrSzgQsPwLFhLNYskDPyyA', // WIF Mainnet Privkey (uncompressed pubkey)
        'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ' // WIF Mainnet Privkey (compressed pubkey)
      ];
      data.forEach(element => {
        expect(incomingDataProvider.redir(element, 'ScanPage')).toBe(true);
        expect(spy).toHaveBeenCalledWith('Handling private key');
      });
    });
    it('Should handle Glidera URI', () => {
      let data = 'bitpay://glidera';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Glidera URL');
      /* TODO data = 'copay://glidera';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Glidera URL'); */
    });
    it('Should handle Coinbase URI', () => {
      let data = 'bitpay://coinbase';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Coinbase URL');
      /* TODO data = 'copay://coinbase';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling Coinbase URL'); */
    });
    it('Should handle BitPay Card URI', () => {
      let data = 'bitpay://';
      expect(incomingDataProvider.redir(data, 'ScanPage')).toBe(true);
      expect(spy).toHaveBeenCalledWith('Handling BitPayCard URL');
    });
  });
});
