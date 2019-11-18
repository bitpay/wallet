import { fakeAsync, tick } from '@angular/core/testing';
import { Events } from 'ionic-angular';
import { AppProvider, PopupProvider } from '..';
import { TestUtils } from '../../test';
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { BwcProvider } from '../bwc/bwc';
import { Logger } from '../logger/logger';
import { PayproProvider } from '../paypro/paypro';
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
  let profileProvider;
  let payproProvider: PayproProvider;

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
    bwcProvider = testBed.get(BwcProvider);
    payproProvider = testBed.get(PayproProvider);
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
    profileProvider = testBed.get(ProfileProvider);
    spyOn(profileProvider, 'getWallets').and.returnValue([
      {
        credentials: {
          keyId: 'keyId1'
        }
      }
    ]);
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
    it('Should handle Plain URL', () => {
      let data = [
        'http://bitpay.com/', // non-SSL URL Handling
        'https://bitpay.com/' // SSL URL Handling
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Plain URL');
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            type: 'url',
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
    it('Should handle BitPay Invoices with different coins', () => {
      let data = [
        'bitcoin:?r=https://bitpay.com/i/CtcM753gnZ4Wpr5pmXU6i9',
        'bitcoincash:?r=https://bitpay.com/i/Rtz1RwWA7kdRRU3Wyo4YDY',
        'ethereum:?r=https://test.bitpay.com/i/VPDDwaG7eaGvFtbyDBq8NR'
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Payment Protocol with non-backwards-compatible request'
        );
      });
    });
    it('Should parse valid BitPay Invoice Url if selectedtransactionCurrency exists with different coins', fakeAsync(() => {
      const data = [
        {
          expires: '2019-11-05T16:29:31.754Z',
          memo:
            'Payment request for BitPay invoice FQLHDgV8YWoy4vT8n4pKQe for merchant Johnco',
          payProUrl: 'https://test.bitpay.com/i/FQLHDgV8YWoy4vT8n4pKQe',
          paymentOptions: [
            {
              chain: 'BTC',
              currency: 'BTC',
              decimals: 8,
              estimatedAmount: 10800,
              minerFee: 100,
              network: 'testnet',
              requiredFeeRate: 1,
              selected: false
            },
            {
              chain: 'BCH',
              currency: 'BCH',
              decimals: 8,
              estimatedAmount: 339800,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 1,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'ETH',
              decimals: 18,
              estimatedAmount: 5255000000000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: true
            },
            {
              chain: 'ETH',
              currency: 'USDC',
              decimals: 6,
              estimatedAmount: 1000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'GUSD',
              decimals: 2,
              estimatedAmount: 100,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'PAX',
              decimals: 18,
              estimatedAmount: 1000000000000000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            }
          ],
          verified: true
        }
      ];

      const payProDetails = {
        amount: 123,
        network: 'testnet',
        requiredFeeRate: 123,
        instructions: [
          {
            toAddress: 'toAddress1',
            data: 'data1',
            amount: 123
          }
        ],
        memo: ''
      };

      const getPayProDetailsSpy = spyOn(
        payproProvider,
        'getPayProDetails'
      ).and.returnValue(Promise.resolve(payProDetails));
      let getPayProOptionsSpy = spyOn(payproProvider, 'getPayProOptions');

      data.forEach(element => {
        getPayProOptionsSpy.and.returnValue(Promise.resolve(element));

        expect(incomingDataProvider.redir(element.payProUrl)).toBe(true);
        expect(getPayProOptionsSpy).toHaveBeenCalledWith(
          element.payProUrl,
          true
        );
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Handling bitpay invoice'
        );
        tick();

        const stateParams = {
          amount: element.paymentOptions[2].estimatedAmount,
          toAddress: payProDetails.instructions[0].toAddress,
          description: payProDetails.memo,
          data: payProDetails.instructions[0].data,
          paypro: payProDetails,
          coin: element.paymentOptions[2].currency.toLowerCase(),
          network: payProDetails.network,
          payProUrl: element.payProUrl,
          requiredFeeRate: payProDetails.requiredFeeRate
        };

        let nextView = {
          name: 'ConfirmPage',
          params: stateParams
        };

        expect(getPayProDetailsSpy).toHaveBeenCalledWith(
          element.payProUrl,
          element.paymentOptions[2].currency.toLowerCase(),
          true
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    }));
    it('Should parse valid BitPay Invoice Url if !selectedtransactionCurrency', fakeAsync(() => {
      const data = [
        {
          expires: '2019-11-05T16:29:31.754Z',
          memo:
            'Payment request for BitPay invoice FQLHDgV8YWoy4vT8n4pKQe for merchant Johnco',
          payProUrl: 'https://test.bitpay.com/i/FQLHDgV8YWoy4vT8n4pKQe',
          paymentOptions: [
            {
              chain: 'BTC',
              currency: 'BTC',
              decimals: 8,
              estimatedAmount: 10800,
              minerFee: 100,
              network: 'testnet',
              requiredFeeRate: 1,
              selected: false
            },
            {
              chain: 'BCH',
              currency: 'BCH',
              decimals: 8,
              estimatedAmount: 339800,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 1,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'ETH',
              decimals: 18,
              estimatedAmount: 5255000000000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'USDC',
              decimals: 6,
              estimatedAmount: 1000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'GUSD',
              decimals: 2,
              estimatedAmount: 100,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            },
            {
              chain: 'ETH',
              currency: 'PAX',
              decimals: 18,
              estimatedAmount: 1000000000000000000,
              minerFee: 0,
              network: 'testnet',
              requiredFeeRate: 4000000000,
              selected: false
            }
          ],
          verified: true
        }
      ];

      let getPayProOptionsSpy = spyOn(payproProvider, 'getPayProOptions');

      data.forEach(element => {
        getPayProOptionsSpy.and.returnValue(Promise.resolve(element));

        expect(incomingDataProvider.redir(element.payProUrl)).toBe(true);
        expect(getPayProOptionsSpy).toHaveBeenCalledWith(
          element.payProUrl,
          true
        );
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Handling bitpay invoice'
        );
        tick();

        const stateParams = {
          payProOptions: element
        };

        let nextView = {
          name: 'SelectInvoicePage',
          params: stateParams
        };

        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    }));
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
            type: 'bitcoinAddress',
            coin: 'bch'
          }
        });
      });
    });
    it('Should handle ETH plain Address', () => {
      let data = ['0xb506c911deE6379e3d4c4d0F4A429a70523960Fd'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Ethereum address'
        );

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'ethereumAddress',
            coin: 'eth'
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

    it('Should handle ETH URI as address if there is no amount', () => {
      let data = ['ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd'];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Ethereum address'
        );

        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: '0xb506c911deE6379e3d4c4d0F4A429a70523960Fd',
            type: 'ethereumAddress',
            coin: 'eth'
          }
        });
      });
    });

    it('Should handle ETH URI with amount (value)', () => {
      let data = [
        {
          uri:
            'ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd?value=1543000000000000000',
          stateParams: {
            amount: '1543000000000000000',
            toAddress: '0xb506c911deE6379e3d4c4d0F4A429a70523960Fd',
            description: '',
            coin: 'eth',
            requiredFeeRate: undefined
          },
          nextpage: 'ConfirmPage'
        },
        {
          uri:
            'ethereum:0xb506c911deE6379e3d4c4d0F4A429a70523960Fd?value=1543000000000000000?gasPrice=0000400000000000000',
          stateParams: {
            amount: '1543000000000000000',
            toAddress: '0xb506c911deE6379e3d4c4d0F4A429a70523960Fd',
            description: '',
            coin: 'eth',
            requiredFeeRate: '0000400000000000000'
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
          requiredFeeRate: undefined
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
    it('Should handle Bitcoin URI', () => {
      let data = [
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Bitcoin Address
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?message=test%20message', // Bitcoin Address with message and not amount
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000', // Bitcoin Address with amount
        'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1.0000&label=Genesis%20Bitcoin%20Address&message=test%20message' // Basic Payment Protocol
      ];
      data.forEach(element => {
        let parsed = bwcProvider.getBitcore().URI(element);
        let addr = parsed.address ? parsed.address.toString() : '';
        let message = parsed.message;
        let amount = parsed.amount ? parsed.amount : '';
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith('Incoming-data: Bitcoin URI');
        if (amount) {
          let stateParams = {
            amount,
            toAddress: addr,
            description: message,
            coin: 'btc',
            requiredFeeRate: undefined
          };
          let nextView = {
            name: 'ConfirmPage',
            params: stateParams
          };
          expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
        } else {
          let stateParams = {
            toAddress: addr,
            description: message,
            coin: 'btc'
          };
          let nextView = {
            name: 'AmountPage',
            params: stateParams
          };
          expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
        }
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

      let a = bwcProvider
        .getBitcore()
        .Address(oldAddr)
        .toObject();
      let addr = bwcProvider
        .getBitcoreCash()
        .Address.fromObject(a)
        .toString();

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

      let a = bwcProvider
        .getBitcore()
        .Address(oldAddr)
        .toObject();
      let addr = bwcProvider
        .getBitcoreCash()
        .Address.fromObject(a)
        .toString();

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
    it('Should handle Bitcoin Livenet and Testnet Plain Address', () => {
      let data = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis Bitcoin Address
        'mpXwg4jMtRhuSpVq4xS3HFHmCmWp9NyGKt' // Genesis Testnet3 Bitcoin Address
      ];
      data.forEach(element => {
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data: Bitcoin plain address'
        );
        expect(actionSheetSpy).toHaveBeenCalledWith({
          data: {
            data: element,
            type: 'bitcoinAddress',
            coin: 'btc'
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
    it('Should handle Coinbase URI', () => {
      let data = ['bitpay://coinbase', 'copay://coinbase'];
      data.forEach(element => {
        let stateParams = { code: null };
        let nextView = {
          name: 'CoinbasePage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): Coinbase URL'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle Shapeshift URI', () => {
      let data = ['bitpay://shapeshift', 'copay://shapeshift'];
      data.forEach(element => {
        let stateParams = { code: null };
        let nextView = {
          name: 'ShapeshiftPage',
          params: stateParams
        };
        expect(
          incomingDataProvider.redir(element, { activePage: 'ScanPage' })
        ).toBe(true);
        expect(loggerSpy).toHaveBeenCalledWith(
          'Incoming-data (redirect): ShapeShift URL'
        );
        expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
      });
    });
    it('Should handle BitPay Card URI', () => {
      let data = 'bitpay://bitpay.com?secret=xxxxx&email=xxx@xx.com';
      let stateParams = { secret: 'xxxxx', email: 'xxx@xx.com', otp: null };
      let nextView = {
        name: 'BitPayCardIntroPage',
        params: stateParams
      };
      expect(incomingDataProvider.redir(data, { activePage: 'ScanPage' })).toBe(
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Incoming-data (redirect): BitPay Card URL'
      );
      expect(eventsSpy).toHaveBeenCalledWith('IncomingDataRedir', nextView);
    });
  });

  describe('Function: finishIncomingData', () => {
    it('Should handle if there is data and redirTo is different to AmountPage', () => {
      const data = {
        redirTo: 'anyPage',
        value: 123
      };
      const nextView = data;
      incomingDataProvider.finishIncomingData(data);
      expect(eventsSpy).toHaveBeenCalledWith(
        'finishIncomingDataMenuEvent',
        nextView
      );
    });
    it('Should handle if there is data and redirTo is AmountPage', () => {
      const data = {
        redirTo: 'AmountPage',
        value: 123,
        coin: 'btc'
      };
      const nextView = data;
      incomingDataProvider.finishIncomingData(data);
      expect(eventsSpy).toHaveBeenCalledWith(
        'finishIncomingDataMenuEvent',
        nextView
      );
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
          data: 'http://bitpay.com/',
          expectedType: 'PlainUrl'
        },
        {
          data: 'https://bitpay.com',
          expectedType: 'PlainUrl'
        },
        {
          data: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          expectedType: 'BitcoinAddress'
        },
        {
          data: 'mpXwg4jMtRhuSpVq4xS3HFHmCmWp9NyGKt',
          expectedType: 'BitcoinAddress'
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
          expectedType: 'EthereumUri' // TODO: handle plain ETH address
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
