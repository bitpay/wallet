import { HttpTestingController } from '@angular/common/http/testing';
import { TestUtils } from '../../test';
import { RateProvider } from './rate';

describe('RateProvider', () => {
  let service: RateProvider;
  let httpMock: HttpTestingController;

  const bchResponse = [
    { code: 'XPI', name: 'Lotus', rate: 0.130377 },
    { code: 'USD', name: 'US Dollar', rate: 1503.3 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 1 },
    { code: 'XEC', name: 'eCash', rate: 0.899 },
    { code: 'LTC', name: 'Litecoin', rate: 974.05 },
    { code: 'DOGE', name: 'Dogecoin', rate: 20000 }
  ];
  const dogeResponse = [
    { code: 'XPI', name: 'Lotus', rate: 0 },
    { code: 'USD', name: 'US Dollar', rate: 0.05 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 0 },
    { code: 'XEC', name: 'eCash', rate: 0 },
    { code: 'LTC', name: 'Litecoin', rate: 0.5 },
    { code: 'DOGE', name: 'Dogecoin', rate: 1 }
  ];

  const xpiResponse = [
    { code: 'XPI', name: 'Lotus', rate: 0.130377 },
    { code: 'USD', name: 'US Dollar', rate: 1503.3 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 1 },
    { code: 'XEC', name: 'eCash', rate: 0.899 },
    { code: 'LTC', name: 'Litecoin', rate: 974.05 },
    { code: 'DOGE', name: 'Dogecoin', rate: 20000 }
  ];
  
  const xecResponse = [
    { code: 'XPI', name: 'Lotus', rate: 0 },
    { code: 'USD', name: 'US Dollar', rate: 0.05 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 0 },
    { code: 'XEC', name: 'eCash', rate: 0 },
    { code: 'LTC', name: 'Litecoin', rate: 0.5 },
    { code: 'DOGE', name: 'Dogecoin', rate: 1 }
  ];

  const ltcResponse = [
    { code: 'XPI', name: 'Lotus', rate: 0 },
    { code: 'USD', name: 'US Dollar', rate: 0.05 },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 0 },
    { code: 'XEC', name: 'eCash', rate: 0 },
    { code: 'LTC', name: 'Litecoin', rate: 0.5 },
    { code: 'DOGE', name: 'Dogecoin', rate: 1 }
  ];

  const fiatResponse = {
    ts: 1559315523000,
    rate: 8427.66,
    fetchedOn: 1559315104699
  };
  let xecUrl: string = 'https://aws.abcpay.cash/bws/api/v3/fiatrates/xec';
  let bchUrl: string = 'https://aws.abcpay.cash/bws/api/v3/fiatrates/bch';
  let xpiUrl: string = 'https://aws.abcpay.cash/bws/api/v3/fiatrates/xpi';
  let ltcUrl: string = 'https://aws.abcpay.cash/bws/api/v3/fiatrates/ltc';
  let dogeUrl: string = 'https://aws.abcpay.cash/bws/api/v3/fiatrates/doge';

  let fiatRateUrl: string =
    'https://aws.abcpay.cash/bws/api/v1/fiatrates/USD?coin=btc&ts=1559315523000';

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    service = testBed.get(RateProvider);
    httpMock = testBed.get(HttpTestingController);
  });

  it('should see if rates are available', () => {
    service.updateRates().then(() => {
      service.updateRates('xpi').then(() => {
        expect(service.isCoinAvailable('xpi')).toBe(true);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should get BCH rates', () => {
    service.updateRates().then(() => {
      service.updateRates('bch').then(() => {
        expect(service.isCoinAvailable('bch')).toBe(true);
        expect(service.getRate('USD', 'bch')).toEqual(1503.3);
        expect(service.getRate('BCH', 'bch')).toEqual(1);
        expect(service.getRate('DOGE', 'bch')).toEqual(20000);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should get XEC rates', () => {
    service.updateRates().then(() => {
      service.updateRates('xec').then(() => {
        expect(service.isCoinAvailable('xec')).toBe(true);
        expect(service.getRate('USD', 'eth')).toEqual(1503.3);
        expect(service.getRate('BCH', 'eth')).toEqual(0.899);
        expect(service.getRate('DOGE', 'eth')).toEqual(25000);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
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

  it('should catch an error on when call to update xec rates fails', () => {
    service.getCoin = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRates('xec').catch(err => {
      expect(err).not.toBeNull();
    });
  });

  it('should catch an error on when call to update xpi rates fails', () => {
    service.getCoin = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRates('xpi').catch(err => {
      expect(err).not.toBeNull();
    });
  });

  it('should covert XPI satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25 * 1e6, 'USD', 'xpi')).toBeNull();

    // after we have rates
    service.updateRates().then(() => {
      service.updateRates('bch').then(() => {
        expect(service.isCoinAvailable('xpi')).toBe(true);
        expect(service.toFiat(1 * 1e8, 'USD', 'bch')).toEqual(1503.3);
        expect(service.toFiat(0.5 * 1e8, 'USD', 'bch')).toEqual(751.65);
        expect(service.toFiat(0.25 * 1e8, 'USD', 'bch')).toEqual(375.825);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should covert fiat to XPI satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25 * 1e8, 'USD', 'xpi')).toBeNull();

    service.updateRates().then(() => {
      // after we have rates
      service.updateRates('bch').then(() => {
        expect(service.isCoinAvailable('bch')).toBe(true);
        expect(service.fromFiat(1503.3, 'USD', 'bch')).toEqual(1 * 1e8);
        expect(service.fromFiat(751.65, 'USD', 'bch')).toEqual(0.5 * 1e8);
        expect(service.fromFiat(375.825, 'USD', 'bch')).toEqual(0.25 * 1e8);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should list alternatives', () => {
    // before we have rates
    expect(service.listAlternatives(false)).toEqual([]);
    expect(service.listAlternatives(true)).toEqual([]);
    service.updateRates().then(() => {
      // after we have rates
      service.updateRates('bch').then(() => {
        expect(service.isCoinAvailable('bch')).toBe(true);
        expect(service.listAlternatives(false)).toEqual([
          { name: 'eCash', isoCode: 'XPI' },
          { name: 'Bitcoin Cash', isoCode: 'BCH' },
          { name: 'Dogecoin', isoCode: 'DOGE' },
          { name: 'Litecoin', isoCode: 'LTC' },
          { name: 'Lotus', isoCode: 'XPI' }
        ]);
        expect(service.listAlternatives(true)).toEqual([
          { name: 'eCash', isoCode: 'XPI' },
          { name: 'Lotus', isoCode: 'Lotus' },
          { name: 'Bitcoin Cash', isoCode: 'BCH' },
          { name: 'Dogecoin', isoCode: 'DOGE' },
          { name: 'Litecoin', isoCode: 'LTC' }
        ]);
      });

      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should resolve when rates are available', () => {
    // before we have rates
    expect(service.isCoinAvailable('bch')).toBe(false);
    service.updateRates().then(() => {
      service.whenRatesAvailable('bch').then(() => {
        // after we have rates
        expect(service.isCoinAvailable('bch')).toBe(true);

        // hit the if in whenRatesAvailable
        service.whenRatesAvailable('bch');
      });


      httpMock.match(bchUrl)[0].flush(bchResponse);
      httpMock.match(dogeUrl)[0].flush(dogeResponse);
      httpMock.match(xecUrl)[0].flush(xecResponse);
      httpMock.match(xpiUrl)[0].flush(xpiResponse);
      httpMock.match(ltcUrl)[0].flush(ltcResponse);
      httpMock.verify();
    });
  });

  it('should get historic fiat rate', () => {
    service.getHistoricFiatRate('USD', 'bch', '1559315523000').then(a => {
      expect(a).toEqual(fiatResponse);
      httpMock.expectOne(fiatRateUrl).flush(fiatResponse);
      httpMock.verify();
    });
  });
});
