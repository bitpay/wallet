import { HttpTestingController } from '@angular/common/http/testing';
import { TestUtils } from '../../test';
import { RateProvider } from './rate';

describe('RateProvider', () => {
  let service: RateProvider;
  let httpMock: HttpTestingController;

  const btcResponse = [
    { code: 'BTC', name: 'Bitcoin', rate: 1 },
    { code: 'USD', name: 'US Dollar', rate: 11535.74 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 7.65734 },
    { code: 'ETH', name: 'Ethereum', rate: 5.65734 }
  ];
  const bchResponse = [
    { code: 'BTC', name: 'Bitcoin', rate: 0.130377 },
    { code: 'USD', name: 'US Dollar', rate: 1503.3 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 1 },
    { code: 'ETH', name: 'Ethereum', rate: 0.899 }
  ];
  const ethResponse = [
    { code: 'BTC', name: 'Bitcoin', rate: 0.130377 },
    { code: 'USD', name: 'US Dollar', rate: 1503.3 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 0.899 },
    { code: 'ETH', name: 'Ethereum', rate: 1 }
  ];
  const fiatResponse = {
    ts: 1559315523000,
    rate: 8427.66,
    fetchedOn: 1559315104699
  };
  let btcUrl: string = 'https://bitpay.com/api/rates';
  let bchUrl: string = 'https://bitpay.com/api/rates/bch';
  let ethUrl: string = 'https://bitpay.com/api/rates/eth';

  let fiatRateUrl: string =
    'https://bws.bitpay.com/bws/api/v1/fiatrates/USD?coin=btc&ts=1559315523000';

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    service = testBed.get(RateProvider);
    httpMock = testBed.get(HttpTestingController);
  });

  it('should see if rates are available', () => {
    service.updateRates('btc').then(() => {
      expect(service.isCoinAvailable('btc')).toBe(true);
    });
    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should get BTC rates', () => {
    service.updateRates('btc').then(() => {
      expect(service.isCoinAvailable('btc')).toBe(true);
      expect(service.getRate('BTC', 'btc')).toEqual(1);
      expect(service.getRate('USD', 'btc')).toEqual(11535.74);
      expect(service.getRate('BCH', 'btc')).toEqual(7.65734);
      expect(service.getRate('ETH', 'btc')).toEqual(5.65734);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should get BCH rates', () => {
    service.updateRates('bch').then(() => {
      expect(service.isCoinAvailable('bch')).toBe(true);
      expect(service.getRate('BTC', 'bch')).toEqual(0.130377);
      expect(service.getRate('USD', 'bch')).toEqual(1503.3);
      expect(service.getRate('BCH', 'bch')).toEqual(1);
      expect(service.getRate('ETH', 'bch')).toEqual(0.899);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should get ETH rates', () => {
    service.updateRates('bch').then(() => {
      expect(service.isCoinAvailable('eth')).toBe(true);
      expect(service.getRate('BTC', 'eth')).toEqual(0.130377);
      expect(service.getRate('USD', 'eth')).toEqual(1503.3);
      expect(service.getRate('BCH', 'eth')).toEqual(0.899);
      expect(service.getRate('ETH', 'eth')).toEqual(1);
    });

    httpMock.match(ethUrl)[1].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should catch an error on when call to update btc rates fails', () => {
    service.getCoin = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRates('bch').catch(err => {
      expect(err).not.toBeNull();
    });
  });

  it('should catch an error on when call to update bch rates fails', () => {
    service.getCoin = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRates('btc').catch(err => {
      expect(err).not.toBeNull();
    });
  });

  it('should catch an error on when call to update eth rates fails', () => {
    service.getCoin = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRates('eth').catch(err => {
      expect(err).not.toBeNull();
    });
  });

  it('should covert BCH satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25 * 1e8, 'USD', 'bch')).toBeNull();

    // after we have rates
    service.updateRates('bch').then(() => {
      expect(service.isCoinAvailable('bch')).toBe(true);
      expect(service.toFiat(1 * 1e8, 'USD', 'bch')).toEqual(1503.3);
      expect(service.toFiat(0.5 * 1e8, 'USD', 'bch')).toEqual(751.65);
      expect(service.toFiat(0.25 * 1e8, 'USD', 'bch')).toEqual(375.825);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert fiat to BCH satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25 * 1e8, 'USD', 'bch')).toBeNull();

    // after we have rates
    service.updateRates('bch').then(() => {
      expect(service.isCoinAvailable('bch')).toBe(true);
      expect(service.fromFiat(1503.3, 'USD', 'bch')).toEqual(1 * 1e8);
      expect(service.fromFiat(751.65, 'USD', 'bch')).toEqual(0.5 * 1e8);
      expect(service.fromFiat(375.825, 'USD', 'bch')).toEqual(0.25 * 1e8);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert BTC satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25 * 1e8, 'USD', 'btc')).toBeNull();

    // after we have rates
    service.updateRates('btc').then(() => {
      expect(service.isCoinAvailable('btc')).toBe(true);
      expect(service.toFiat(1 * 1e8, 'USD', 'btc')).toEqual(11535.74);
      expect(service.toFiat(0.5 * 1e8, 'USD', 'btc')).toEqual(5767.87);
      expect(service.toFiat(0.25 * 1e8, 'USD', 'btc')).toEqual(2883.935);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert fiat to BTC satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25 * 1e8, 'USD', 'btc')).toBeNull();

    // after we have rates
    service.updateRates('btc').then(() => {
      expect(service.isCoinAvailable('btc')).toBe(true);
      expect(service.fromFiat(11535.74, 'USD', 'btc')).toEqual(1 * 1e8);
      expect(service.fromFiat(5767.87, 'USD', 'btc')).toEqual(0.5 * 1e8);
      expect(service.fromFiat(2883.935, 'USD', 'btc')).toEqual(0.25 * 1e8);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert ETH satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25 * 1e8, 'USD', 'eth')).toBeNull();

    // after we have rates
    service.updateRates('eth').then(() => {
      expect(service.isCoinAvailable('eth')).toBe(true);
      expect(service.toFiat(1 * 1e8, 'USD', 'eth')).toEqual(1.5033e-7);
      expect(service.toFiat(0.5 * 1e8, 'USD', 'eth')).toEqual(7.5165e-8);
      expect(service.toFiat(0.25 * 1e8, 'USD', 'eth')).toEqual(3.75825e-8);
    });

    httpMock.match(ethUrl)[1].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert fiat to ETH satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25 * 1e8, 'USD', 'eth')).toBeNull();

    // after we have rates
    service.updateRates('eth').then(() => {
      expect(service.isCoinAvailable('eth')).toBe(true);
      expect(service.fromFiat(1.5033e-7, 'USD', 'eth')).toEqual(1 * 1e8);
      expect(service.fromFiat(7.5165e-8, 'USD', 'eth')).toEqual(0.5 * 1e8);
      expect(service.fromFiat(3.75825e-8, 'USD', 'eth')).toEqual(0.25 * 1e8);
    });

    httpMock.match(ethUrl)[1].flush(ethResponse);
    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should list alternatives', () => {
    // before we have rates
    expect(service.listAlternatives(false)).toEqual([]);
    expect(service.listAlternatives(true)).toEqual([]);

    // after we have rates
    service.updateRates('btc').then(() => {
      expect(service.isCoinAvailable('btc')).toBe(true);
      expect(service.listAlternatives(false)).toEqual([
        { name: 'Bitcoin', isoCode: 'BTC' },
        { name: 'US Dollar', isoCode: 'USD' },
        { name: 'Bitcoin Cash', isoCode: 'BCH' },
        { name: 'Ethereum', isoCode: 'ETH' }
      ]);
      expect(service.listAlternatives(true)).toEqual([
        { name: 'Bitcoin', isoCode: 'BTC' },
        { name: 'Bitcoin Cash', isoCode: 'BCH' },
        { name: 'Ethereum', isoCode: 'ETH' },
        { name: 'US Dollar', isoCode: 'USD' }
      ]);
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should resolve when rates are available', () => {
    // before we have rates
    expect(service.isCoinAvailable('btc')).toBe(false);

    service.whenRatesAvailable('btc').then(() => {
      // after we have rates
      expect(service.isCoinAvailable('btc')).toBe(true);

      // hit the if in whenRatesAvailable
      service.whenRatesAvailable('btc');
    });

    httpMock.match(ethUrl)[0].flush(ethResponse);
    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should get historic fiat rate', () => {
    service.getHistoricFiatRate('USD', 'btc', '1559315523000').then(a => {
      expect(a).toEqual(fiatResponse);
      httpMock.expectOne(fiatRateUrl).flush(fiatResponse);
      httpMock.verify();
    });
  });
});
