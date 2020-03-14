import { TestUtils } from '../../test';
import { ConfigProvider } from '../config/config';
import { PersistenceProvider } from '../persistence/persistence';
import { ProfileProvider } from '../profile/profile';
import { WalletProvider } from '../wallet/wallet';
import { EmailNotificationsProvider } from './email-notifications';

describe('Provider: Email Notifications Provider', () => {
  let emailNotificationsProvider: EmailNotificationsProvider;
  let configProvider: ConfigProvider;
  let persistenceProvider: PersistenceProvider;
  let walletProvider: WalletProvider;
  let profileProvider: ProfileProvider;

  let opts = {
    enabled: true,
    email: 'test@bitpay.com'
  };

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    configProvider = testBed.get(ConfigProvider);
    emailNotificationsProvider = testBed.get(EmailNotificationsProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    persistenceProvider.load();
    walletProvider = testBed.get(WalletProvider);
    profileProvider = testBed.get(ProfileProvider);
  });

  describe('updateEmail function', () => {
    it('should exit function if options has not email', () => {
      let optsWithoutEmail = {
        enabled: true,
        email: ''
      };
      expect(
        emailNotificationsProvider.updateEmail(optsWithoutEmail)
      ).toBeUndefined();
    });

    it('should update email if options has an email', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(configProvider.get().emailNotifications).toEqual(opts);
    });

    it('should update remote preferences', () => {
      jasmine.clock().install();
      emailNotificationsProvider.updateEmail(opts);
      jasmine.clock().tick(1001);
      let wallets = profileProvider.getWallets();
      walletProvider.updateRemotePreferences(wallets).then(() => {
        expect().nothing();
      });
      jasmine.clock().uninstall();
    });
  });

  describe('getEmailIfEnabled function', () => {
    it('should exit if has not email enabled', () => {
      let optsDisabled = {
        enabled: false,
        email: ''
      };

      configProvider.set(optsDisabled);
      expect(emailNotificationsProvider.getEmailIfEnabled()).toBeUndefined();
    });

    it('should return email', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(emailNotificationsProvider.getEmailIfEnabled()).toEqual(
        'test@bitpay.com'
      );
    });
  });

  describe('init function', () => {
    it('should return if email already set', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(emailNotificationsProvider.init()).toBeUndefined();
    });

    it('should return if config is empty', () => {
      let emptyOpts = {};
      configProvider.set(emptyOpts);
      expect(emailNotificationsProvider.init()).toBeUndefined();
    });
  });
});
