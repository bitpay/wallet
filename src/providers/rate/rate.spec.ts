import { TestBed, getTestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RateProvider } from './rate';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';

describe('RateProvider', () => {
  let injector: TestBed;
  let service: RateProvider;
  let httpMock: HttpTestingController;

  const btcResponse = [{"code":"BTC","name":"Bitcoin","rate":1},{"code":"USD","name":"US Dollar","rate":11535.74},{"code":"BCH","name":"Bitcoin Cash","rate":7.65734}];
  const bchResponse = [{"code":"BTC","name":"Bitcoin","rate":0.130377},{"code":"USD","name":"US Dollar","rate":1503.3},{"code":"BCH","name":"Bitcoin Cash","rate":1}];
  let btcUrl: string = 'https://bitpay.com/api/rates';
  let bchUrl: string = 'https://bitpay.com/api/rates/bch';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgLoggerModule.forRoot(Level.LOG),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        RateProvider,
        Logger
      ]
    });
    injector = getTestBed();
    service = injector.get(RateProvider);
    httpMock = injector.get(HttpTestingController);
  });

  it('should see if rates are available', () => {
    service.updateRatesBtc().then(response => {
      expect(service.isAvailable()).toBe(true);
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should get BTC rates', () => {
    service.updateRatesBtc().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.getRate('BTC')).toEqual(1);
      expect(service.getRate('USD')).toEqual(11535.74);
      expect(service.getRate('BCH')).toEqual(7.65734);
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should get BCH rates', () => {
    service.updateRatesBch().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.getRate('BTC', 'bch')).toEqual(0.130377);
      expect(service.getRate('USD', 'bch')).toEqual(1503.3);
      expect(service.getRate('BCH', 'bch')).toEqual(1);
    });

    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should catch an error on when call to update btc rates fails', () => {
    service.getBCH = (): Promise<any> => {
      let prom = new Promise((resolve, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRatesBch()
    .catch((err: any) => {
      expect(err).not.toBeNull();
    });
  });

  it('should catch an error on when call to update bch rates fails', () => {
    service.getBTC = (): Promise<any> => {
      let prom = new Promise((resolve, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.updateRatesBtc()
    .catch((err: any) => {
      expect(err).not.toBeNull();
    });
  });

  it('should covert BCH satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25*1e+8, 'USD', 'bch')).toBeNull();

    // after we have rates
    service.updateRatesBch().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.toFiat(1*1e+8, 'USD', 'bch')).toEqual(1503.3);
      expect(service.toFiat(0.5*1e+8, 'USD', 'bch')).toEqual(751.65);
      expect(service.toFiat(0.25*1e+8, 'USD', 'bch')).toEqual(375.825);
    });

    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert fiat to BCH satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25*1e+8, 'USD', 'bch')).toBeNull();

    // after we have rates
    service.updateRatesBch().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.fromFiat(1503.3, 'USD', 'bch')).toEqual(1*1e+8);
      expect(service.fromFiat(751.65, 'USD', 'bch')).toEqual(0.5*1e+8);
      expect(service.fromFiat(375.825, 'USD', 'bch')).toEqual(0.25*1e+8);
    });

    httpMock.match(btcUrl)[0].flush(btcResponse);
    httpMock.match(bchUrl)[1].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert BTC satoshis to fiat', () => {
    // before we have rates
    expect(service.toFiat(0.25*1e+8, 'USD', 'btc')).toBeNull();

    // after we have rates
    service.updateRatesBtc().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.toFiat(1*1e+8, 'USD', 'btc')).toEqual(11535.74);
      expect(service.toFiat(0.5*1e+8, 'USD', 'btc')).toEqual(5767.87);
      expect(service.toFiat(0.25*1e+8, 'USD', 'btc')).toEqual(2883.935);
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should covert fiat to BTC satoshis', () => {
    // before we have rates
    expect(service.fromFiat(0.25*1e+8, 'USD', 'btc')).toBeNull();

    // after we have rates
    service.updateRatesBtc().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.fromFiat(11535.74, 'USD', 'btc')).toEqual(1*1e+8);
      expect(service.fromFiat(5767.87, 'USD', 'btc')).toEqual(0.5*1e+8);
      expect(service.fromFiat(2883.935, 'USD', 'btc')).toEqual(0.25*1e+8);
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should list alternatives', () => {
    // before we have rates
    expect(service.listAlternatives(false)).toEqual([]);
    expect(service.listAlternatives(true)).toEqual([]);

    // after we have rates
    service.updateRatesBtc().then(response => {
      expect(service.isAvailable()).toBe(true);
      expect(service.listAlternatives(false)).toEqual([
        {name: 'Bitcoin', isoCode: 'BTC'},
        {name: 'US Dollar', isoCode: 'USD'},
        {name: 'Bitcoin Cash', isoCode: 'BCH'}
      ]);
      expect(service.listAlternatives(true)).toEqual([
        {name: 'Bitcoin', isoCode: 'BTC'},
        {name: 'Bitcoin Cash', isoCode: 'BCH'},
        {name: 'US Dollar', isoCode: 'USD'}
      ]);
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });

  it('should resolve when rates are available', () => {
    // before we have rates
    expect(service.isAvailable()).toBe(false);

    service.whenRatesAvailable().then(response => {
      // after we have rates
      expect(service.isAvailable()).toBe(true);

      // hit the if in whenRatesAvailable
      service.whenRatesAvailable();
    });

    httpMock.match(btcUrl)[1].flush(btcResponse);
    httpMock.match(bchUrl)[0].flush(bchResponse);
    httpMock.verify();
  });
});
