import { HttpTestingController } from '@angular/common/http/testing';
import { TestUtils } from '../../test';

// providers
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { AmazonProvider } from './amazon';

describe('Provider: AmazonProvider', () => {
  let amazonProvider: AmazonProvider;
  let persistenceProvider: PersistenceProvider;
  let homeIntegrationsProvider: HomeIntegrationsProvider;
  let configProvider: ConfigProvider;
  let httpMock: HttpTestingController;
  let logger: Logger;
  let spyLoggerInfo;
  let spyLoggerError;
  let urls = ['https://bitpay.com', 'https://test.bitpay.com'];

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();

    amazonProvider = testBed.get(AmazonProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    homeIntegrationsProvider = testBed.get(HomeIntegrationsProvider);
    configProvider = testBed.get(ConfigProvider);
    logger = testBed.get(Logger);
    spyLoggerInfo = spyOn(logger, 'info');
    spyLoggerError = spyOn(logger, 'error');
    persistenceProvider.load();
    httpMock = testBed.get(HttpTestingController);
  });

  describe('Function: getNetwork by default', () => {
    it('Should get livenet network by default', () => {
      expect(amazonProvider.getNetwork()).toBe('livenet');
      expect(amazonProvider.credentials.BITPAY_API_URL).toBe(
        'https://bitpay.com'
      );
    });
  });

  describe('Function: setCountryParameters', () => {
    it('Should get all the data of the respective country sent', () => {
      amazonProvider.setCountryParameters('japan');

      expect(amazonProvider.getCountry()).toBe('japan');
      expect(amazonProvider.getCurrency()).toBe('JPY');
      expect(amazonProvider.getRedeemAmazonUrl()).toBe(
        'https://www.amazon.co.jp/gc/redeem?claimCode='
      );
      expect(amazonProvider.amazonNetwork).toBe('livenet-japan');
      expect(amazonProvider.limitPerDay).toBe(200000);
    });

    it('Should get all the default data if a specific country was not sent', () => {
      amazonProvider.setCountryParameters();

      expect(amazonProvider.getCountry()).toBe('usa');
      expect(amazonProvider.getCurrency()).toBe('USD');
      expect(amazonProvider.getRedeemAmazonUrl()).toBe(
        'https://www.amazon.com/gc/redeem?claimCode='
      );
      expect(amazonProvider.amazonNetwork).toBe('livenet');
      expect(amazonProvider.limitPerDay).toBe(2000);
    });
  });

  describe('Function: savePendingGiftCard', () => {
    let newGiftcard: any;
    beforeEach(() => {
      newGiftcard = {
        accessKey: '8425ece778263c',
        amount: 5,
        cardStatus: 'Fulfilled',
        claimCode: 'Z9FF-JANACN-BRFS',
        currency: 'USD',
        date: 1526655234795,
        invoiceId: 'CZdggnzSxo1p8SmL9F2kPh',
        invoiceUrl: 'https://test.bitpay.com/invoice?id=CZdggnzSxo1p8SmL9F2kPh',
        status: 'SUCCESS',
        uuid: 'd92370cc-5a64-4077-af78-12a4231ca54e'
      };
    });

    it('Should save the Giftcard correctly', () => {
      amazonProvider.savePendingGiftCard(newGiftcard, null, (err: any) => {
        expect(err).toBe(null);
        amazonProvider.getPendingGiftCards((err, giftCards) => {
          expect(err).toBe(null);
          expect(giftCards['CZdggnzSxo1p8SmL9F2kPh']).toEqual(newGiftcard);
        });
      });
    });
  });

  describe('Function: createBitPayInvoice', () => {
    let newData: any;
    beforeEach(() => {
      newData = {
        currency: 'USD',
        amount: 5,
        uuid: 'd92370cc-5a64-4077-af78-12a4231ca54e',
        buyerSelectedTransactionCurrency: 'BTC'
      };
    });

    it("Should do POST request to BitPay's Server to create the BitPay invoice correctly", () => {
      amazonProvider.createBitPayInvoice(
        newData,
        (err: any, dataInvoice: any) => {
          expect(err).toBe(null);
          expect(dataInvoice).toEqual({
            accessKey: '1928f88929e557',
            invoiceId: 'UiaCmXc1QiwxX8edcayzzC'
          });
          expect(spyLoggerInfo).toHaveBeenCalledWith(
            'BitPay Create Invoice: SUCCESS'
          );
        }
      );

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/pay');
      expect(req.request.method).toBe('POST');
      req.flush({
        accessKey: '1928f88929e557',
        invoiceId: 'UiaCmXc1QiwxX8edcayzzC'
      });

      httpMock.verify();
    });

    it('Should return an Error if any of data parameters are incorrect', () => {
      newData.currency = 'XXXX';

      amazonProvider.createBitPayInvoice(newData, (errResponse: any) => {
        expect(errResponse).toBe(data);
        expect(spyLoggerError).toHaveBeenCalledWith(
          'BitPay Create Invoice: ERROR ' + errResponse.message
        );
      });

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/pay');
      expect(req.request.method).toBe('POST');

      const mockErrorResponse = {
        status: 500,
        statusText: 'NOK'
      };

      const data = {
        message: 'Unsupported amazonGiftCard currency'
      };

      req.flush(data, mockErrorResponse);
      httpMock.verify();
    });
  });

  describe('Function: getBitPayInvoice', () => {
    let invoiceId;
    beforeEach(() => {
      invoiceId = '1928f88929e557';
    });

    it("Should do GET request to BitPay's Server to get a specific BitPay invoice", () => {
      amazonProvider.getBitPayInvoice(
        invoiceId,
        (err: any, dataInvoice: any) => {
          expect(err).toBe(null);
          expect(dataInvoice).toEqual({
            data: {
              status: 'new'
            },
            facade: 'public/invoice'
          });
          expect(spyLoggerInfo).toHaveBeenCalledWith(
            'BitPay Get Invoice: SUCCESS'
          );
        }
      );

      const req = httpMock.expectOne(urls[0] + '/invoices/' + invoiceId);
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          data: {
            status: 'new'
          },
          facade: 'public/invoice'
        }
      });

      httpMock.verify();
    });

    it('Should return an Error if the invoice id does not exist', () => {
      amazonProvider.getBitPayInvoice(invoiceId, (errResponse: any) => {
        expect(errResponse).toBe(data.message);
        expect(spyLoggerError).toHaveBeenCalledWith(
          'BitPay Get Invoice: ERROR ' + errResponse
        );
      });

      const req = httpMock.expectOne(urls[0] + '/invoices/' + invoiceId);
      expect(req.request.method).toBe('GET');

      const mockErrorResponse = {
        status: 500,
        statusText: 'NOK'
      };

      const data = {
        message: 'Unsupported amazonGiftCard currency'
      };

      req.flush(data, mockErrorResponse);
      httpMock.verify();
    });
  });

  describe('Function: createGiftCard', () => {
    let newData: any;
    beforeEach(() => {
      newData = {
        currency: 'USD',
        amount: 5,
        uuid: 'd92370cc-5a64-4077-af78-12a4231ca54e',
        buyerSelectedTransactionCurrency: 'BTC',
        accessKey: '1928f88929e557',
        invoiceId: 'UiaCmXc1QiwxX8edcayzzC'
      };
    });

    it("Should do POST request to BitPay's Server to create a Gift Card correctly", () => {
      amazonProvider.createGiftCard(newData, (err: any, data: any) => {
        expect(err).toBe(null);
        expect(data).toEqual({
          status: 'PENDING'
        });
        expect(spyLoggerInfo).toHaveBeenCalledWith(
          'Amazon.com Gift Card Create/Update: ' + data.status
        );
      });

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/redeem');
      expect(req.request.method).toBe('POST');
      req.flush({
        status: 'PENDING'
      });

      httpMock.verify();
    });

    it('Should return an Error if any of data parameters are incorrect', () => {
      newData.currency = 'XXXX';

      amazonProvider.createGiftCard(newData, (errResponse: any) => {
        expect(errResponse.error).toBe(data);
        expect(spyLoggerError).toHaveBeenCalledWith(
          'Amazon.com Gift Card Create/Update: ' + errResponse.message
        );
      });

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/redeem');
      expect(req.request.method).toBe('POST');

      const mockErrorResponse = {
        status: 500,
        statusText: 'NOK'
      };

      const data = {
        message: 'Unsupported amazonGiftCard currency'
      };

      req.flush(data, mockErrorResponse);
      httpMock.verify();
    });
  });

  describe('Function: cancelGiftCard', () => {
    let newData: any;
    beforeEach(() => {
      newData = {
        uuid: 'd92370cc-5a64-4077-af78-12a4231ca54e',
        accessKey: '1928f88929e557',
        invoiceId: 'UiaCmXc1QiwxX8edcayzzC'
      };
    });

    it("Should do POST request to BitPay's Server to cancel a Gift Card correctly", () => {
      amazonProvider.cancelGiftCard(newData, (err: any, data: any) => {
        expect(err).toBe(null);
        expect(data).toEqual({
          status: 'canceled'
        });
        expect(spyLoggerInfo).toHaveBeenCalledWith(
          'Amazon.com Gift Card Cancel: SUCCESS'
        );
      });

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/cancel');
      expect(req.request.method).toBe('POST');
      req.flush({
        status: 'canceled'
      });

      httpMock.verify();
    });

    it('Should return an Error if could not cancel the Gift Card', () => {
      amazonProvider.cancelGiftCard(newData, (errResponse: any) => {
        expect(errResponse.error).toBe(data);
        expect(spyLoggerError).toHaveBeenCalledWith(
          'Amazon.com Gift Card Cancel: ' + errResponse.message
        );
      });

      const req = httpMock.expectOne(urls[0] + '/amazon-gift/cancel');
      expect(req.request.method).toBe('POST');

      const mockErrorResponse = {
        status: 500,
        statusText: 'NOK'
      };

      const data = {
        message: 'Error'
      };

      req.flush(data, mockErrorResponse);
      httpMock.verify();
    });
  });

  describe('Function: register', () => {
    beforeEach(() => {
      let opts = {
        showIntegration: { ['amazon']: true, ['amazonJapan']: true }
      };
      configProvider.set(opts);
    });

    it('Should regist Amazon and Amazon Japan as integrations', () => {
      amazonProvider.register();
      expect(homeIntegrationsProvider.get()).toEqual([
        {
          name: 'amazon',
          title: 'Amazon.com Gift Cards',
          icon: 'assets/img/amazon/icon-amazon.svg',
          page: 'AmazonPage',
          show: true
        },
        {
          name: 'amazonJapan',
          title: 'Amazon.co.jp ギフト券',
          icon: 'assets/img/amazon/icon-amazon.svg',
          page: 'AmazonPage',
          show: true
        }
      ]);
    });
  });
});
