import { TestBed, inject, async } from "@angular/core/testing";

import { TxFormatProvider } from "./tx-format";
import { BwcProvider } from '../bwc/bwc';
import { RateProvider } from '../rate/rate';
import { ConfigProvider } from '../config/config';
import { Filter } from '../filter/filter';
import * as _ from "lodash";

describe('Tx Format Provider',() => {
  let service: TxFormatProvider;

  class ConfigProviderMock {
    private config: any = {
      wallet: {
        settings: {
          unitName: 'BTC',
          unitToSatoshi: 100000000,
          unitDecimals: 8,
          unitCode: 'btc',
          alternativeName: 'US Dollar',
          alternativeIsoCode: 'USD'
        }
      }
    }
    get() {
      return this.config;
    }    
  };

  class BwcProviderMock {
    formatAmount(sat: number, unitCode: string, opts: any) {
      return sat / 100000000;
    }
    getUtils() {
      return {
        formatAmount: this.formatAmount
      }
    }
  };

  class RateProviderMock {
    toFiat(sat: number, altIsoCode: string, coin: string) {
      return 20.00;
    }
    fromFiat(amount: number, currency: string, coin: string) {
      return 500000;
    }
  };

  class FilterMock {
    formatFiatAmount(amount: number) {
      return amount.toFixed(2);
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TxFormatProvider,
        { provide: BwcProvider, useClass: BwcProviderMock },
        { provide: RateProvider, useClass: RateProviderMock },
        { provide: ConfigProvider, useClass: ConfigProviderMock },
        { provide: Filter, useClass: FilterMock },
        { provide: _ },
      ]
    });
  });

  beforeEach(inject([TxFormatProvider], (txService: TxFormatProvider) => {
    service = txService;
  }));

  /* formatAmount */
  it('should return successfully format from satoshis to btc', () => {
    const result = service.formatAmount(5000);
    expect(result).toEqual(0.00005);
  });

  /* formatAmountStr */
  it('should return successfully format from satoshis to unit string', () => {
    const result = service.formatAmountStr('btc', 5000);
    expect(result).toEqual('0.00005 BTC');
  });

  it('should return null if sat parameter is not a number', () => {
    const result = service.formatAmountStr('btc', 0.0000000001);
    expect(result).toBeNull;
  });

  /* toFiat */
  it('should return successfully format from satoshis to fiat amount', () => {
    service.toFiat('btc', 5000, 'USD')
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiat) => {
        expect(formatedFiat).toBeDefined();
        expect(formatedFiat).toEqual('20.00');
      });
  });

  it('should return null if sat parameter is not a number', () => {
    service.toFiat('btc', 0.0000000001, 'USD')
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiat) => {
        expect(formatedFiat).toBeNull;
      });
  });

  /* formatToUSD */
  it('should format successfully to amount in USD', () => {
    service.formatToUSD('btc', 5000)
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiatAmount) => {
        expect(formatedFiatAmount).toBeDefined();
        expect(formatedFiatAmount).toEqual('20.00');
      });
  });

  it('should return null if sat parameter is not a number', () => {
    service.formatToUSD('btc', 0.0000000001)
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiatAmount) => {
        expect(formatedFiatAmount).toBeNull;
      });
  });

  /* formatAlternativeStr */
  it('should format successfully the alternative amount string',() => {    
    service.formatAlternativeStr('btc', 5000)
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiatAmount) => {
        expect(formatedFiatAmount).toBeDefined();
        expect(formatedFiatAmount).toEqual('20.00 USD');
      });
  });

  it('should return null if sat parameter is not a number', () => {
    service.formatAlternativeStr('btc', 0.0000000001)
      .catch((err) => expect(err).toBeNull)
      .then((formatedFiatAmount) => {
        expect(formatedFiatAmount).toBeNull;
      });
  });
  
  /* ####### PENDING ######## 
   * 
   * ProcessTx
   * formatPendingTxps
   * 
   * ########################
   */
  
  /* parseAmount */
  it('should parse the amount based on USD currency', () => {
    const result = service.parseAmount('btc', 5000, 'USD');
    
    expect(result).toBeDefined();
    expect(result.amount).toEqual(5000);
    expect(result.currency).toEqual('USD');
    expect(result.alternativeIsoCode).toEqual('USD');
    expect(result.amountSat).toEqual('500000');
    expect(result.amountUnitStr).toEqual('5000.00 USD');
  });

  it('should parse the amount based on sat currency', () => {
    const result = service.parseAmount('btc', 5000, 'sat');
    
    expect(result).toBeDefined();
    expect(result.amount).toEqual((5000 * 1e-8).toFixed(8));
    expect(result.currency).toEqual('BTC');
    expect(result.alternativeIsoCode).toEqual('USD');
    expect(result.amountSat).toEqual(5000);
    expect(result.amountUnitStr).toEqual('0.00005 BTC');
  });

  it('should parse the amount based on BTC currency', () => {
    const result = service.parseAmount('btc', 5, 'BTC');
    
    expect(result).toBeDefined();
    expect(result.amount).toEqual((5).toFixed(8));
    expect(result.currency).toEqual('BTC');
    expect(result.alternativeIsoCode).toEqual('USD');
    expect(result.amountSat).toEqual((5 * 100000000));
    expect(result.amountUnitStr).toEqual('5 BTC');
  });
  
  /* satToUnit */
  it('should convert sat to unit', () => {
    const result = service.satToUnit(5000);
    expect(result).toEqual(0.00005);
  });
});