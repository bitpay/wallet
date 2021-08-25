import { fakeAsync, tick } from '@angular/core/testing';
import { Events } from 'ionic-angular';
import { AppProvider, PopupProvider } from '..';
import { TestUtils } from '../../test';
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { BwcProvider } from '../bwc/bwc';
import { Logger } from '../logger/logger';
import { ProfileProvider } from '../profile/profile';
import { IncomingDataProvider } from './incoming-data';

describe('Provider: Incoming Data Provider', () => {
  let incomingDataProvider: IncomingDataProvider;
  let bwcProvider: BwcProvider;
  let logger: Logger;
  let events: Events;
  let loggerSpy;
  let eventsSpy;
  let actionSheetSpy;

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

  class ProfileProviderMock {
    constructor() {}
    public getWallets() {
      return [
        {
          credentials: {
            keyId: 'keyId1',
            coin: 'bch',
            network: 'testnet',
            minAmount: 5255000000000000
          }
        }
      ];
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: AppProvider, useClass: AppProviderMock },
      { provide: PopupProvider, useClass: PopupProviderMock },
      { provide: ProfileProvider, useClass: ProfileProviderMock }
    ]);
    incomingDataProvider = testBed.get(IncomingDataProvider);
    bwcProvider = testBed.get(BwcProvider);
    logger = testBed.get(Logger);
    events = testBed.get(Events);
    loggerSpy = spyOn(logger, 'debug');
    eventsSpy = spyOn(events, 'publish');
    actionSheetSpy = spyOn(
      testBed.get(ActionSheetProvider),
      'createIncomingDataMenu'
    ).and.returnValue({
      present() {},
      onDidDismiss() {}
    });
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
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Plain text');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            type: 'text',
            data: element
          }
        });
      });
    });
    it('Should handle Join Wallet', () => {
      let data =
        'copay:RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      let stateParams = { keyId: 'keyId1', url: data };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };

      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): Code to join to a wallet'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle Old Join Wallet', () => {
      let data =
        'RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc';
      let stateParams = { keyId: 'keyId1', url: data };
      let nextView = {
        name: 'JoinWalletPage',
        params: stateParams
      };

      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): Code to join to a wallet'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle QR Code Export feature', () => {
      let data = [
        "1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|testnet|m/44'/1'/0'|false",
        '2|',
        '3|',
        '1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|null|null|false|null'
      ];
      data.forEach(element => {
        let stateParams = { code: element };
        let nextView = {
          name: 'ImportWalletPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): QR code export feature'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle Bitcoin cash Copay/BitPay format and CashAddr format plain Address', () => {
      let data = [
        'qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
        'CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN'
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Bitcoin Cash plain address'
        );
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'bitcoinCashAddress',
            coin: 'bch'
          }
        });
      });
    });
    it('Should handle XEC plain Address', () => {
      let data = ['qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: eCash address'
        );

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'eCashAddress',
            coin: 'xec'
          }
        });
      });
    });
    it('Should handle XPI plain Address', () => {
      let data = ['lotus_16PSJPYxmBxaJYAd1GGRcVn2nD1vooHJCozd5Dw91'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Lotus address');

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'lotusAddress',
            coin: 'xpi'
          }
        });
      });
    });

    it('Should handle Bitcoin cash Copay/BitPay format and CashAddr format URI', () => {
      let data = [
        'bitcoincash:CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN',
        'bitcoincash:qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
        'bchtest:pzpaleegjrc0cffrmh3nf43lt3e3gu8awqyxxjuew3'
      ];

      data.forEach(element => {
        let parsed = bwcProvider.getBitcoreCash().URI(element);
        let addr = parsed.address ? parsed.address.toString() : '';

        // keep address in original format
        if (parsed.address && element.indexOf(addr) < 0) {
          addr = parsed.address.toCashAddress();
        }
        let stateParams = {
          toAddress: addr,
          description: null,
          coin: 'bch'
        };
        let nextView = {
          name: 'AmountPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Bitcoin Cash URI'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });

    it('Should handle XEC URI as address if there is no amount', () => {
      let data = ['ecash:qqm0wxg52pzxu292yhgfx0wxwctrupcvgyw6z6ytay'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Ethereum address'
        );

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: 'qqm0wxg52pzxu292yhgfx0wxwctrupcvgyw6z6ytay',
            type: 'eCashAddress',
            coin: 'xec'
          }
        });
      });
    });

    it('Should handle XPI URI as address if there is no amount', () => {
      let data = ['lotus_16PSJQvoMKjCt78jpCqTLut9iRuiV2vJBH7Rmuwbq'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Ripple address');

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: '16PSJQvoMKjCt78jpCqTLut9iRuiV2vJBH7Rmuwbq',
            type: 'lotusAddress',
            coin: 'xpi'
          }
        });
      });
    });

    it('Should handle XEC URI with amount (value)', () => {
      let data = [
        {
          uri:
            'ecash:qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae?value=1543000000000000000',
          stateParams: {
            amount: '1543000000000000000',
            toAddress: 'qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae',
            description: '',
            coin: 'xec',
            requiredFeeRate: undefined,
            destinationTag: undefined
          },
          nextpage: 'ConfirmPage'
        },
        {
          uri:
            'ecash:qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae?value=1543000000000000000?gasPrice=0000400000000000000',
          stateParams: {
            amount: '1543000000000000000',
            toAddress: 'qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae',
            description: '',
            coin: 'xec',
            requiredFeeRate: '0000400000000000000',
            destinationTag: undefined
          },
          nextpage: 'ConfirmPage'
        }
      ];
      data.forEach(element => {
        let nextView = {
          name: element.nextpage,
          params: element.stateParams
        };
        expect(
          incomingDataProvider.redir(element.uri, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Ethereum URI');
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });

    it('Should handle XEC URI with amount', () => {
      let data = [
        {
          uri: 'ecash:qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae?amount=15',
          stateParams: {
            amount: '1500',
            toAddress: 'qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae',
            description: '',
            coin: 'xec',
            requiredFeeRate: undefined,
            destinationTag: undefined
          },
          nextpage: 'ConfirmPage'
        },
        {
          uri: 'ecash:qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae?amount=15&dt=12',
          stateParams: {
            amount: '1500',
            toAddress: 'qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae',
            description: '',
            coin: 'xec',
            requiredFeeRate: undefined,
            destinationTag: '12'
          },
          nextpage: 'ConfirmPage'
        }
      ];
      data.forEach(element => {
        let nextView = {
          name: element.nextpage,
          params: element.stateParams
        };
        expect(
          incomingDataProvider.redir(element.uri, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Ripple URI');
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });

    it('Should handle Bitcoin cash Copay/BitPay format and CashAddr format URI with amount', () => {
      let data = [
        'BITCOINCASH:QZCY06MXSK7HW0RU4KZWTRKXDS6VF8Y34VRM5SF9Z7?amount=1.00000000',
        'bchtest:pzpaleegjrc0cffrmh3nf43lt3e3gu8awqyxxjuew3?amount=12.00000000'
      ];

      data.forEach(element => {
        let parsed = bwcProvider.getBitcoreCash().URI(element);
        let addr = parsed.address ? parsed.address.toString() : '';

        // keep address in original format
        if (parsed.address && element.indexOf(addr) < 0) {
          addr = parsed.address.toCashAddress();
        }

        let amount = parsed.amount;

        let stateParams = {
          amount,
          toAddress: addr,
          description: null,
          coin: 'bch',
          requiredFeeRate: undefined,
          destinationTag: undefined
        };
        let nextView = {
          name: 'ConfirmPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Bitcoin Cash URI'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should Handle Bitcoin Cash URI with legacy address', fakeAsync(() => {
      let data = 'bitcoincash:1ML5KKKrJEHw3fQqhhajQjHWkh3yKhNZpa';
      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data: Bitcoin Cash URI with legacy address'
      );

      let parsed = bwcProvider
        .getBitcore()
        .URI(data.replace(/^bitcoincash:/, 'bitcoin:'));

      let oldAddr = parsed.address ? parsed.address.toString() : '';

      let a = bwcProvider.getBitcore().Address(oldAddr).toObject();
      let addr = bwcProvider.getBitcoreCash().Address.fromObject(a).toString();

      let stateParams = {
        toAddress: addr,
        description: null,
        coin: 'bch'
      };
      let nextView = {
        name: 'AmountPage',
        params: stateParams
      };
      tick();
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    }));
    it('Should Handle Testnet Bitcoin Cash URI with legacy address', fakeAsync(() => {
      let data = 'bchtest:mu7ns6LXun5rQiyTJx7yY1QxTzndob4bhJ';
      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );

      // bch testnet legacy, prefixed address are handled as normal addresses
      expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Bitcoin Cash URI');

      let parsed = bwcProvider
        .getBitcore()
        .URI(data.replace(/^bchtest:/, 'bitcoin:'));

      let oldAddr = parsed.address ? parsed.address.toString() : '';

      let a = bwcProvider.getBitcore().Address(oldAddr).toObject();
      let addr = bwcProvider.getBitcoreCash().Address.fromObject(a).toString();

      let stateParams = {
        toAddress: addr,
        description: null,
        coin: 'bch'
      };
      let nextView = {
        name: 'AmountPage',
        params: stateParams
      };
      tick();
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    }));
    it('Should handle Bitcoin Cash Livenet and Testnet Plain Address', () => {
      let data = [
        'qz49wrnh7d9p7ejrg55lqr6zdpu4x2kh7uckpdhth3', // Genesis Bitcoin Cash Address
        'qp7j7pdealmxfv7755vgvh05v7hf34sme5phep2xvs' // Genesis Testnet Bitcoin Cash Address
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Bitcoin Cash plain address'
        );
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'bitcoinCashAddress',
            coin: 'bch'
          }
        });
      });
    });
    it('Should handle private keys', () => {
      let data = [
        '6PnSQd4UamkL5LDZrAsmymQrAgj1jywES6frfp5DeFGWni7VouwjxeJ68z', // BIP 38 Encrypt Private Key
        '5Hwgr3u458GLafKBgxtssHSPqJnYoGrSzgQsPwLFhLNYskDPyyA', // WIF Mainnet Privkey (uncompressed pubkey)
        'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ' // WIF Mainnet Privkey (compressed pubkey)
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: private key');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'privateKey',
            fromHomeCard: undefined
          }
        });
      });
    });
  });

  describe('Function: finishIncomingData', () => {
    it('Should handle if there is data and redirTo is PaperWalletPage', () => {
      const stateParams = {
        privateKey: '123',
        toAddress: null,
        coin: 'bch',
        addressbookEntry: null,
        fromFooterMenu: undefined
      };
      const nextView = {
        name: 'PaperWalletPage',
        params: stateParams
      };
      const data = { redirTo: 'PaperWalletPage', value: '123' };
      incomingDataProvider.finishIncomingData(data);
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle if there is data and redirTo is AmountPage', () => {
      const stateParams = {
        toAddress: 'xxx',
        coin: 'bch',
        privateKey: null,
        addressbookEntry: null,
        fromFooterMenu: undefined
      };
      const nextView = {
        name: 'AmountPage',
        params: stateParams
      };
      const data = { redirTo: 'AmountPage', value: 'xxx', coin: 'bch' };
      incomingDataProvider.finishIncomingData(data);
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
    it('Should handle if there is data and redirTo is AddressbookAddPage', () => {
      const stateParams = {
        toAddress: null,
        coin: 'bch',
        privateKey: null,
        addressbookEntry: 'xxx',
        fromFooterMenu: undefined
      };
      const nextView = {
        name: 'AddressbookAddPage',
        params: stateParams
      };
      const data = { redirTo: 'AddressbookAddPage', value: 'xxx', coin: 'bch' };
      incomingDataProvider.finishIncomingData(data);
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
  });

  describe('Function: parseData', () => {
    it('Should return if there is no data', () => {
      const parsedData = incomingDataProvider.parseData(undefined);
      expect(parsedData).toBeUndefined();
    });
    it('Should return the correct type for each kind of data', () => {
      const dataArray = [
        {
          data: 'https://bitpay.com/i/5GREtmntcTvB9aejVDhVdm',
          expectedType: 'InvoiceUri'
        },
        {
          data: 'https://test.bitpay.com/i/VPDDwaG7eaGvFtbyDBq8NR',
          expectedType: 'InvoiceUri'
        },
        {
          data: 'bitcoin:?r=https://bitpay.com/i/CtcM753gnZ4Wpr5pmXU6i9',
          expectedType: 'PayPro'
        },
        {
          data: 'bitcoincash:?r=https://bitpay.com/i/Rtz1RwWA7kdRRU3Wyo4YDY',
          expectedType: 'PayPro'
        },
        {
          data: 'ethereum:?r=https://test.bitpay.com/i/VPDDwaG7eaGvFtbyDBq8NR',
          expectedType: 'PayPro'
        },
        {
          data: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          expectedType: 'BitcoinUri'
        },
        {
          data:
            'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?message=test%20message',
          expectedType: 'BitcoinUri'
        },
        {
          data: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000',
          expectedType: 'BitcoinUri'
        },
        {
          data:
            'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000&label=Genesis%20Bitcoin%20Address&message=test%20message',
          expectedType: 'BitcoinUri'
        },
        {
          data: 'bitcoincash:CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN',
          expectedType: 'BitcoinCashUri'
        },
        {
          data: 'bitcoincash:qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
          expectedType: 'BitcoinCashUri'
        },
        {
          data: 'bchtest:pzpaleegjrc0cffrmh3nf43lt3e3gu8awqyxxjuew3',
          expectedType: 'BitcoinCashUri'
        },
        {
          data: 'bchtest:mu7ns6LXun5rQiyTJx7yY1QxTzndob4bhJ',
          expectedType: 'BitcoinCashUri'
        },
        {
          data:
            'BITCOINCASH:QZCY06MXSK7HW0RU4KZWTRKXDS6VF8Y34VRM5SF9Z7?amount=1.00000000',
          expectedType: 'BitcoinCashUri'
        },
        {
          data:
            'bchtest:pzpaleegjrc0cffrmh3nf43lt3e3gu8awqyxxjuew3?amount=12.00000000',
          expectedType: 'BitcoinCashUri'
        },
        {
          data: 'ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd',
          expectedType: 'EthereumUri'
        },
        {
          data:
            'ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd?value=1543000000000000000',
          expectedType: 'EthereumUri'
        },
        {
          data:
            'ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd?value=1543000000000000000?gasPrice=0000400000000000000',
          expectedType: 'EthereumUri'
        },
        {
          data: 'bitcoincash:1ML5KKKrJEHw3fQqhhajQjHWkh3yKhNZpa',
          expectedType: 'BitcoinCashUri'
        },
        {
          data:
            'bitpay:mrNYDWy8ZgmgXVKDb4MM71LmfZWBwGztUK?coin=btc&amount=0.0002&message=message',
          expectedType: 'BitPayUri'
        },
        {
          data:
            'bitpay:1HZJoc4ZKMvyAYcYCU1vbmwm3KzZq34EmU?coin=btc&amount=0.0002&message=asd',
          expectedType: 'BitPayUri'
        },
        {
          data:
            'bitpay:0xDF5C0dd7656bB976aD7285a3Fb80C0F6B9604576?coin=eth&amount=1543000000000000000?gasPrice=0000400000000000000',
          expectedType: 'BitPayUri'
        },
        {
          data:
            'bitpay:bchtest:qp2gujqu2dsp6zs4kp0pevm2yl8ydx723q2kvfn7tc?coin=bch&amount=0.0002&message=asd',
          expectedType: 'BitPayUri'
        },
        {
          data:
            'bitpay:bitcoincash:qpcc9qe5ja73k7ekkqrnjfp9tya0r3d5tvpm2yfa0d?coin=bch&amount=0.0002&message=asd',
          expectedType: 'BitPayUri'
        },
        {
          data: 'http://bitpay.com/',
          expectedType: 'PlainUrl'
        },
        {
          data: 'https://bitpay.com',
          expectedType: 'PlainUrl'
        },
        {
          data: 'qr00upv8qjgkym8zng3f663n9qte9ljuqqcs8eep5w',
          expectedType: 'BitcoinCashAddress'
        },
        {
          data: 'CcnxtMfvBHGTwoKGPSuezEuYNpGPJH6tjN',
          expectedType: 'BitcoinCashAddress'
        },
        {
          data: '0xb506c911deE6379e3d4c4d0F4A429a70523960Fd',
          expectedType: 'EthereumAddress'
        },
        {
          data: 'bitpay://coinbase',
          expectedType: 'Coinbase'
        },
        {
          data: 'bitpay://bitpay.com?secret=xxxxx&email=xxx@xx.com',
          expectedType: 'BitPayCard'
        },
        {
          data:
            'copay:RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc',
          expectedType: 'JoinWallet'
        },
        {
          data:
            'RTpopkn5KBnkxuT7x4ummDKx3Lu1LvbntddBC4ssDgaqP7DkojT8ccxaFQEXY4f3huFyMewhHZLbtc', // Legacy code
          expectedType: 'JoinWallet'
        },
        {
          data: '6PnSQd4UamkL5LDZrAsmymQrAgj1jywES6frfp5DeFGWni7VouwjxeJ68z', // BIP 38 Encrypt Private Key
          expectedType: 'PrivateKey'
        },
        {
          data: '5Hwgr3u458GLafKBgxtssHSPqJnYoGrSzgQsPwLFhLNYskDPyyA', // WIF Mainnet Privkey (uncompressed pubkey)
          expectedType: 'PrivateKey'
        },
        {
          data: 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ', // WIF Mainnet Privkey (compressed pubkey)
          expectedType: 'PrivateKey'
        },
        {
          data:
            "1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|testnet|m/44'/1'/0'|false",
          expectedType: 'ImportPrivateKey'
        },
        {
          data: '2|',
          expectedType: 'ImportPrivateKey'
        },
        {
          data: '3|',
          expectedType: 'ImportPrivateKey'
        },
        {
          data:
            '1|sick arch glare wheat anchor innocent garbage tape raccoon already obey ability|null|null|false|null',
          expectedType: 'ImportPrivateKey'
        }
      ];
      dataArray.forEach(element => {
        const parsedData = incomingDataProvider.parseData(element.data);
        expect(parsedData).toBeDefined();
        expect(parsedData.type).toEqual(element.expectedType);
      });
    });
    it('Should return undefined if data to parse is wrong', () => {
      const data = 'something wrong';
      const parsedData = incomingDataProvider.parseData(data);
      expect(parsedData).toBeUndefined();
    });
  });
});
