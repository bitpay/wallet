import { TestUtils } from '../../test';

// Providers
import { ConfigProvider } from '../config/config';
import { Coin } from '../currency/currency';
import { FilterProvider } from '../filter/filter';
import { PersistenceProvider } from '../persistence/persistence';
import { RateProvider } from '../rate/rate';
import { TxFormatProvider } from './tx-format';

describe('TxFormatProvider', () => {
  let configProvider: ConfigProvider;
  let filterProvider: FilterProvider;
  let rateProvider: RateProvider;
  let txFormatProvider: TxFormatProvider;

  class PersistenceProviderMock {
    constructor() {}
    storeConfig() {
      return Promise.resolve('');
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    txFormatProvider = testBed.get(TxFormatProvider);
    configProvider = testBed.get(ConfigProvider);
    rateProvider = testBed.get(RateProvider);
    filterProvider = testBed.get(FilterProvider);
  });

  describe('toCashAddress', () => {
    it('should get the address in Cash Address format', () => {
      let address = 'CcyUyVPZtNRQ5JxhjXLKQwWt1xKr8igncP'; // BCH livenet address
      let cashAddr: string = txFormatProvider.toCashAddress(address);
      expect(cashAddr).toEqual('qrs0knp7gal4d8xyxy2w3cq5tpzfa5ywgcuqqlwykf');
    });

    it('should get the address in Cash Address format, with prefix', () => {
      let address = 'CcyUyVPZtNRQ5JxhjXLKQwWt1xKr8igncP'; // BCH livenet address
      let cashAddr: string = txFormatProvider.toCashAddress(address, true);
      expect(cashAddr).toEqual(
        'bitcoincash:qrs0knp7gal4d8xyxy2w3cq5tpzfa5ywgcuqqlwykf'
      );
    });
  });

  describe('formatAmount', () => {
    it('should get the formatted amount for provided amount', () => {
      let newOpts = {
        wallet: {
          settings: { unitCode: 'bit' }
        }
      };
      configProvider.set(newOpts);

      let formattedAmount = txFormatProvider.formatAmount(
        'bit',
        12312312,
        true
      );
      expect(formattedAmount).toEqual('123,123.12');
    });

    it('should get the same amount of satoshis that was provided', () => {
      let newOpts = {
        wallet: {
          settings: { unitCode: 'sat' }
        }
      };
      configProvider.set(newOpts);

      let formattedAmount: number = txFormatProvider.formatAmount(
        'sat',
        12312312
      );
      expect(formattedAmount).toEqual(12312312);
    });
  });

  describe('formatAmountStr', () => {
    it('should return undefined if satoshis amount are not type of number', () => {
      expect(
        txFormatProvider.formatAmountStr('btc', undefined)
      ).toBeUndefined();
    });

    it('should return a string with formatted amount', () => {
      let newOpts = {
        wallet: {
          settings: { unitCode: 'btc' }
        }
      };
      configProvider.set(newOpts);

      expect(txFormatProvider.formatAmountStr('btc', 12312312)).toEqual(
        '0.123123 BTC'
      );
    });
  });

  describe('toFiat', () => {
    it('should return undefined if satoshis amount are undefined', () => {
      txFormatProvider.toFiat('btc', undefined, 'USD').then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should return null', () => {
      txFormatProvider.toFiat('btc', 12312312, 'USD').then(result => {
        expect(result).toBeNull();
      });
    });

    it('should return a string with formatted amount', () => {
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      txFormatProvider.toFiat('btc', 12312312, 'USD').then(result => {
        expect(result).toEqual('1000000.00');
      });
    });
  });

  describe('formatToUSD', () => {
    it('should return undefined if satoshis amount are undefined', () => {
      txFormatProvider.formatToUSD('btc', undefined).then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should return null', () => {
      txFormatProvider.formatToUSD('btc', 12312312).then(result => {
        expect(result).toBeNull();
      });
    });

    it('should return a string with formatted amount in USD', () => {
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      txFormatProvider.formatToUSD('btc', 12312312).then(result => {
        expect(result).toEqual('1000000.00');
      });
    });
  });

  describe('formatAlternativeStr', () => {
    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'btc',
            alternativeIsoCode: 'ARS'
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return undefined if satoshis amount are undefined', () => {
      expect(
        txFormatProvider.formatAlternativeStr('btc', undefined)
      ).toBeUndefined();
    });

    it('should return null', () => {
      let result = txFormatProvider.formatAlternativeStr('btc', 12312312);
      expect(result).toBeNull();
    });

    it('should return null', () => {
      spyOn(filterProvider, 'formatFiatAmount').and.returnValue(undefined);
      spyOn(rateProvider, 'isCoinAvailable').and.returnValue(true);
      let result = txFormatProvider.formatAlternativeStr('btc', 12312312);
      expect(result).toBeNull();
    });

    it('should return a string with formatted amount in alternative Iso Code setted in wallet', () => {
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      spyOn(rateProvider, 'isCoinAvailable').and.returnValue(true);
      let result = txFormatProvider.formatAlternativeStr('btc', 12312312);
      expect(result).toEqual('1,000,000 ARS');
    });
  });

  describe('processTx', () => {
    let tx: any = {
      action: 'received',
      amount: 447100,
      fee: 19440,
      outputs: [
        {
          alternativeAmountStr: '28.36 USD',
          amount: 447100,
          toAddress: 'mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb'
        }
      ]
    };

    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'btc',
            alternativeIsoCode: 'USD'
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return same tx if tx.action is invalid', () => {
      tx.action = 'invalid';
      expect(txFormatProvider.processTx(Coin.BTC, tx)).toEqual(tx);
    });

    it('should return tx with defined values if tx.action is received', () => {
      tx.action = 'received';
      let result = txFormatProvider.processTx(Coin.BTC, tx);

      expect(tx.toAddress).toBeDefined();
      expect(tx.toAddress).toEqual('mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb');
      expect(tx.amountStr).toBeDefined();
      expect(tx.alternativeAmountStr).toBeDefined();
      expect(tx.feeStr).toBeDefined();
      expect(result).toEqual(tx);
    });

    it('should return tx.toAddress in CashAddress format if coin is BCH', () => {
      tx.action = 'received';
      tx.outputs[0].toAddress = 'CWtp9bmTjiwBp89SvnZRbshkEkTY9TRZnt';
      txFormatProvider.processTx(Coin.BCH, tx);
      expect(tx.toAddress).toEqual(
        'qz0ys7q7utlsd7fmcsecxtpp9y8j8xhxtsy35kmzka'
      );
    });

    it('should return tx.addressTo in CashAddress format if coin is BCH', () => {
      tx.action = 'received';
      tx.addressTo = 'CWtp9bmTjiwBp89SvnZRbshkEkTY9TRZnt';
      txFormatProvider.processTx(Coin.BCH, tx);
      expect(tx.addressTo.toString()).toEqual(
        'qz0ys7q7utlsd7fmcsecxtpp9y8j8xhxtsy35kmzka'
      );
    });

    it('should return same tx.amount if only has one output', () => {
      tx.action = 'sent';
      txFormatProvider.processTx(Coin.BTC, tx);
      expect(tx.hasMultiplesOutputs).toBeFalsy();
      expect(tx.amount).toEqual(447100);
    });

    it('should return reduced tx.amount if has multiple outputs', () => {
      tx.action = 'sent';
      tx.outputs = [
        {
          alternativeAmountStr: '28.36 USD',
          amount: 447100,
          toAddress: 'mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb'
        },
        {
          alternativeAmountStr: '38.36 USD',
          amount: 647100,
          toAddress: 'mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb'
        }
      ];
      txFormatProvider.processTx(Coin.BTC, tx);
      expect(tx.hasMultiplesOutputs).toBeTruthy();
      expect(tx.amount).toEqual(1094200);
    });
  });

  describe('parseAmount', () => {
    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'btc',
            alternativeIsoCode: 'USD',
            unitToSatoshi: 100000000
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return amount parsed correctly if the currency is BTC', () => {
      let result = txFormatProvider.parseAmount(Coin.BTC, 0.012235, 'BTC', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: '0.01223500',
        currency: 'BTC',
        alternativeIsoCode: 'USD',
        amountSat: 1223500,
        amountUnitStr: '0.012235 BTC'
      });
    });

    it('should return amount parsed correctly if the currency is USD', () => {
      spyOn(filterProvider, 'formatFiatAmount').and.returnValue('1,505');
      spyOn(rateProvider, 'fromFiat').and.returnValue(24117237);

      let result = txFormatProvider.parseAmount(Coin.BTC, 1505, 'USD', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: 1505,
        currency: 'USD',
        alternativeIsoCode: 'USD',
        amountSat: 24117237,
        amountUnitStr: '1,505 USD'
      });
    });

    it('should return amount parsed correctly if the currency is JPY and onlyIntegers is true', () => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'btc',
            alternativeIsoCode: 'JPY',
            unitToSatoshi: 100000000
          }
        }
      };
      configProvider.set(newOpts);

      spyOn(filterProvider, 'formatFiatAmount').and.returnValue('1,505');
      spyOn(rateProvider, 'fromFiat').and.returnValue(24117237);

      let onlyIntegers = true;
      let result = txFormatProvider.parseAmount(Coin.BTC, 1505, 'JPY', {
        onlyIntegers
      });
      expect(result).toEqual({
        amount: 1505,
        currency: 'JPY',
        alternativeIsoCode: 'JPY',
        amountSat: 24117237,
        amountUnitStr: '1,505 JPY'
      });
    });

    it('should return amount parsed correctly if the currency is sat', () => {
      spyOn(filterProvider, 'formatFiatAmount').and.returnValue('1,505');

      let result = txFormatProvider.parseAmount(Coin.BTC, 1505, 'sat', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: '0.00001505',
        currency: 'BTC',
        alternativeIsoCode: 'USD',
        amountSat: 1505,
        amountUnitStr: '0.000015 BTC'
      });
    });
  });

  describe('satToUnit', () => {
    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            alternativeIsoCode: 'USD',
            unitCode: 'btc',
            unitDecimals: 8,
            unitToSatoshi: 100000000
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return amount in unit format', () => {
      let result = txFormatProvider.satToUnit(12312312, Coin.BTC);
      expect(result).toEqual(0.12312312);
    });
  });
});
