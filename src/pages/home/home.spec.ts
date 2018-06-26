import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { AddPage } from '../add/add';
import { CopayersPage } from '../add/copayers/copayers';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { ConfigProvider } from './../../providers/config/config';
import { ActivityPage } from './activity/activity';
import { HomePage } from './home';
import { ProposalsPage } from './proposals/proposals';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let instance;
  let testBed: typeof TestBed;
  const mockWallet = {
    name: 'Test Wallet',
    cachedStatus: null,
    credentials: { walletId: '647b39d8-a88c-42d5-8728-0ba898dcdd90' },
    status: {},
    canSign: () => true,
    isComplete: () => true,
    isPrivKeyEncrypted: () => true
  };

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([HomePage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
      instance.showCard = {
        setShowRateCard: () => {}
      };
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should get recentTransactions enabled', () => {
        instance.ionViewWillEnter();
        const configProvider = testBed.get(ConfigProvider);
        const recentTransactionsEnabled = configProvider.get()
          .recentTransactions.enabled;
        expect(recentTransactionsEnabled).toEqual(true);
      });
      it('should not break if address book list call fails', () => {
        spyOn(testBed.get(AddressBookProvider), 'list').and.returnValue(
          Promise.reject('bad error')
        );
        instance.ionViewWillEnter();
      });
    });

    describe('ionViewDidEnter', () => {
      it('should check for update if NW', () => {
        instance.isNW = true;
        const spy = spyOn(instance, 'checkDesktopUpdate');
        instance.ionViewDidEnter();
        expect(spy).toHaveBeenCalled();
      });
      it('should check for update if is Cordova', () => {
        instance.isCordova = true;
        const spy = spyOn(instance, 'checkMobileUpdate');
        instance.ionViewDidEnter();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewDidLoad', () => {
      it('should update txps and set wallets on platform resume', () => {
        instance.plt.resume = new Subject();
        instance.ionViewDidLoad();
        const getNotificationsSpy = spyOn(instance, 'getNotifications');
        const updateTxpsSpy = spyOn(instance, 'updateTxps');
        const setWalletsSpy = spyOn(instance, 'setWallets');
        instance.plt.resume.next();
        expect(getNotificationsSpy).toHaveBeenCalled();
        expect(updateTxpsSpy).toHaveBeenCalled();
        expect(setWalletsSpy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should unsubscribe from bwsEvent event', () => {
        const spy = spyOn(instance.events, 'unsubscribe');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalledWith('bwsEvent');
      });
    });
  });
  describe('hideHomeTip function', () => {
    it('should set home tip as accepted', () => {
      const persistenceProvider = testBed.get(PersistenceProvider);
      const spy = spyOn(persistenceProvider, 'setHomeTipAccepted');
      instance.hideHomeTip();
      expect(spy).toHaveBeenCalledWith('accepted');
    });
  });
  describe('openServerMessageLink function', () => {
    it('should open external link', () => {
      const externalLinkProvider = testBed.get(ExternalLinkProvider);
      const spy = spyOn(externalLinkProvider, 'open');
      instance.serverMessage = {
        link: 'https://crowdin.com/project/copay'
      };
      instance.openServerMessageLink();
      expect(spy).toHaveBeenCalledWith(instance.serverMessage.link);
    });
  });
  describe('goToAddView function', () => {
    it('should push AddPage', () => {
      instance.goToAddView();
      expect(instance.navCtrl.push).toHaveBeenCalledWith(AddPage);
    });
  });
  describe('goToWalletDetails function', () => {
    it('should go to WalletDetailsPage', () => {
      instance.goToWalletDetails(mockWallet);
      const walletId = mockWallet.credentials.walletId;
      expect(instance.navCtrl.push).toHaveBeenCalledWith(WalletDetailsPage, {
        walletId
      });
    });
    it('should go to CopayersPage', () => {
      mockWallet.isComplete = () => false;
      instance.goToWalletDetails(mockWallet);
      const walletId = mockWallet.credentials.walletId;
      expect(instance.navCtrl.push).toHaveBeenCalledWith(CopayersPage, {
        walletId
      });
    });
  });
  describe('openProposalsPage function', () => {
    it('should push ProposalsPage', () => {
      instance.openProposalsPage();
      expect(instance.navCtrl.push).toHaveBeenCalledWith(ProposalsPage);
    });
  });
  describe('openActivityPage function', () => {
    it('should push ActivityPage', () => {
      instance.openActivityPage();
      expect(instance.navCtrl.push).toHaveBeenCalledWith(ActivityPage);
    });
  });
});
