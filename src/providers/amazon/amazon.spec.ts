import { TestUtils } from '../../test';

// providers
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';
import { AmazonProvider } from './amazon';

describe('Provider: AmazonProvider', () => {
  let amazonProvider: AmazonProvider;
  let persistenceProvider: PersistenceProvider;
  let homeIntegrationsProvider: HomeIntegrationsProvider;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();

    amazonProvider = testBed.get(AmazonProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    homeIntegrationsProvider = testBed.get(HomeIntegrationsProvider);
    configProvider = testBed.get(ConfigProvider);
    persistenceProvider.load();
  });

  describe('Function: getNetwork by default', () => {
    it('Should get livenet network by default', () => {
      expect(amazonProvider.getNetwork()).toBe('livenet');
      expect(amazonProvider.credentials.BITPAY_API_URL).toBe(
        'https://bitpay.com'
      );
    });
  });

  describe('Function: register', () => {
    beforeEach(() => {
      let opts = {
        showIntegration: { ['amazon']: true }
      };
      configProvider.set(opts);
    });

    it('Should regist Amazon and Amazon Japan as integrations', () => {
      amazonProvider.register();
      expect(homeIntegrationsProvider.get()).toEqual([
        {
          name: 'amazon',
          title: 'Amazon Gift Cards',
          icon: 'assets/img/amazon/amazon-icon.svg',
          show: true
        }
      ]);
    });
  });
});
