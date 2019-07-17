import { TestUtils } from '../../test';
import { ProfileProvider } from '../profile/profile';
import { PayproProvider } from './paypro';

describe('PayProProvider', () => {
  let payproProvider: PayproProvider;
  let profileProvider: ProfileProvider;

  const defaultPayPro = {
    verified: true,
    network: 'livenet',
    coin: 'btc',
    requiredFeeRate: 134.972,
    amount: 278800,
    toAddress: '1Jzx8hv7Mz8DZH2QoLiWyFBCsCqK1yjwwz',
    memo:
      'Payment request for BitPay invoice DEkTtRXp6ni7n7WwUan4y for merchant Electronic Frontier Foundation',
    paymentId: 'DEkTtRXp6ni7n7WwUan4y',
    expires: '2019-05-22T14:19:02.609Z'
  };

  const walletFixture = {
    id: {
      credentials: {
        coin: 'btc',
        network: 'livenet'
      },
      isComplete: () => {
        return true;
      },
      fetchPayPro: (_payProUrl, _cb) => {}
    }
  };

  const walletFixture2 = {
    id: {
      credentials: {
        coin: 'btc',
        network: 'testnet'
      },
      isComplete: () => {
        return true;
      },
      fetchPayPro: (_payProUrl, _cb) => {}
    }
  };

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    payproProvider = testBed.get(PayproProvider);
    profileProvider = testBed.get(ProfileProvider);
  });

  describe('getPayProDetails', () => {
    it('should return paypro details', () => {
      walletFixture.id.fetchPayPro = (_payProUrl, cb) => {
        return cb(null, defaultPayPro);
      };
      profileProvider.wallet = walletFixture;
      payproProvider.getPayProDetails('uri', 'btc').then(paypro => {
        expect(paypro).toEqual({
          verified: true,
          network: 'livenet',
          payProUrl: 'uri',
          coin: 'btc',
          requiredFeeRate: 134.972,
          amount: 278800,
          toAddress: '1Jzx8hv7Mz8DZH2QoLiWyFBCsCqK1yjwwz',
          memo:
            'Payment request for BitPay invoice DEkTtRXp6ni7n7WwUan4y for merchant Electronic Frontier Foundation',
          paymentId: 'DEkTtRXp6ni7n7WwUan4y',
          expires: '2019-05-22T14:19:02.609Z'
        });
      });
    });
    it('should return error if is not verified', () => {
      walletFixture.id.fetchPayPro = (_payProUrl, cb) => {
        defaultPayPro.verified = false;
        return cb(null, defaultPayPro);
      };
      profileProvider.wallet = walletFixture;
      payproProvider.getPayProDetails('uri', 'btc').catch(err => {
        expect(err).toBeDefined();
      });
    });
    it('should return error if exist', () => {
      walletFixture.id.fetchPayPro = (_payProUrl, cb) => {
        return cb(new Error());
      };
      profileProvider.wallet = walletFixture;
      payproProvider.getPayProDetails('uri', 'btc').catch(err => {
        expect(err).toBeDefined();
      });
    });
    it('should return error if invoice is expired', () => {
      walletFixture.id.fetchPayPro = (_payProUrl, cb) => {
        return cb(new Error('The invoice is no longer receiving payments'));
      };
      profileProvider.wallet = walletFixture;
      payproProvider.getPayProDetails('uri', 'btc').catch(err => {
        expect(err).toBeDefined();
      });
    });
    it('should return error if network does not match', () => {
      walletFixture2.id.fetchPayPro = (_payProUrl, cb) => {
        return cb(
          new Error('The key on the response is not trusted for transactions')
        );
      };
      profileProvider.wallet = walletFixture2;
      payproProvider.getPayProDetails('uri', 'btc').catch(err => {
        expect(err).toBeDefined();
      });
    });
    it('should resolve without error if no wallet available', () => {
      payproProvider.getPayProDetails('uri', 'btc').then(result => {
        expect(result).toBe(undefined);
      });
    });
  });
});
