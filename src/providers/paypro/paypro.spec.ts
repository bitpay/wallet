import { TestUtils } from '../../test';
import { BwcProvider } from '../bwc/bwc';
import { PayproProvider } from './paypro';

describe('PayProProvider', () => {
  let payproProvider: PayproProvider;
  let bwcProvider: BwcProvider;
  let getPayProV2Spy;

  const defaultPayPro = {
    verified: true,
    network: 'livenet',
    payProUrl: 'https://bitpay.com/i/5GREtmntcTvB9aejVDhVdm',
    coin: 'btc',
    requiredFeeRate: 134.972,
    amount: 278800,
    toAddress: '1Jzx8hv7Mz8DZH2QoLiWyFBCsCqK1yjwwz',
    memo:
      'Payment request for BitPay invoice DEkTtRXp6ni7n7WwUan4y for merchant Electronic Frontier Foundation',
    paymentId: 'DEkTtRXp6ni7n7WwUan4y',
    expires: '2019-05-22T14:19:02.609Z'
  };

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    payproProvider = testBed.get(PayproProvider);
    bwcProvider = testBed.get(BwcProvider);

    getPayProV2Spy = spyOn(bwcProvider, 'getPayProV2');
  });

  describe('getPayProDetails', () => {
    it('should return paypro details', () => {
      getPayProV2Spy.and.returnValue({
        selectPaymentOption: _opts => {
          return Promise.resolve(defaultPayPro);
        }
      });

      payproProvider
        .getPayProDetails({
          paymentUrl: 'https://bitpay.com/i/5GREtmntcTvB9aejVDhVdm',
          coin: 'btc'
        })
        .then(paypro => {
          expect(paypro).toEqual(defaultPayPro);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
    it('should return error if selectPaymentOption returns error', () => {
      getPayProV2Spy.and.returnValue({
        selectPaymentOption: _opts => {
          return Promise.reject('Error');
        }
      });

      payproProvider
        .getPayProDetails({
          paymentUrl: 'https://bitpay.com/i/5GREtmntcTvB9aejVDhVdm',
          coin: 'btc'
        })
        .then(paypro => {
          expect(paypro).toBeUndefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });
  });
});
