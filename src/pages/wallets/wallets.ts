import { Component, NgZone, ViewChild } from '@angular/core';
import {
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Pages
import { AddPage } from '../add/add';
import { CopayersPage } from '../add/copayers/copayers';
import { BackupKeyPage } from '../backup/backup-key/backup-key';
import { CoinbaseAccountPage } from '../integrations/coinbase/coinbase-account/coinbase-account';
import { SettingsPage } from '../settings/settings';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { ProposalsNotificationsPage } from './proposals-notifications/proposals-notifications';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { CoinbaseProvider } from '../../providers/coinbase/coinbase';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  selector: 'page-wallets',
  templateUrl: 'wallets.html'
})
export class WalletsPage {
  @ViewChild('priceCard')
  priceCard;
  public wallets;
  public walletsGroups;
  public txpsN: number;

  public collapsedGroups;
  public useImgFadeEffect: boolean = true;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

  public showCoinbase: boolean;
  public coinbaseLinked: boolean;
  public coinbaseData: object = {};

  constructor(
    private plt: Platform,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private events: Events,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private persistenceProvider: PersistenceProvider,
    private modalCtrl: ModalController,
    private actionSheetProvider: ActionSheetProvider,
    private coinbaseProvider: CoinbaseProvider
  ) {
    this.collapsedGroups = {};
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewDidEnter() {
    this._didEnter();
  }

  ionViewWillEnter() {
    this.walletsGroups = this.profileProvider.orderedWalletsByGroup;

    // Get Coinbase Accounts and UserInfo
    this.setCoinbase();
  }

  private setCoinbase(force?) {
    this.showCoinbase = this.homeIntegrationsProvider.shouldShowInHome(
      'coinbase'
    );
    if (!this.showCoinbase) return;
    this.coinbaseLinked = this.coinbaseProvider.isLinked();
    if (this.coinbaseLinked) {
      if (force || _.isEmpty(this.coinbaseData)) {
        this.zone.run(() => {
          this.coinbaseProvider.preFetchAllData(this.coinbaseData);
        });
      } else this.coinbaseData = this.coinbaseProvider.coinbaseData;
    }
  }

  private async walletAudienceEvents() {
    try {
      const deviceUUID = this.platformProvider.getDeviceUUID();
      const hasCreatedWallet = await this.persistenceProvider.getHasReportedFirebaseWalletCreateFlag();
      const hasSecuredWalletFlag = await this.persistenceProvider.getHasReportedFirebaseSecuredWallet();
      const hasFundedWallet = await this.persistenceProvider.getHasReportedFirebaseHasFundedWallet();
      const hasNotFundedWallet = await this.persistenceProvider.getHasReportedFirebasedNonFundedWallet();
      const keys = await this.persistenceProvider.getKeys();

      if (!hasCreatedWallet) {
        if (keys && keys.length > 0) {
          this.analyticsProvider.logEvent('user_has_created_wallet', {
            uuid: deviceUUID,
            timestamp: Date.now()
          });
          this.persistenceProvider.setHasReportedFirebaseWalletCreateFlag();
        }
      }

      if (!hasSecuredWalletFlag) {
        let hasAtLeastOneMnemonicEncrypted = keys.some(
          key => key.mnemonicEncrypted
        );
        if (hasAtLeastOneMnemonicEncrypted) {
          this.analyticsProvider.logEvent('user_has_secured_wallet', {
            uuid: deviceUUID
          });
          this.persistenceProvider.setHasReportedFirebaseSecuredWallet();
        }
      }

      if (!hasFundedWallet) {
        let totalBalance = await this.persistenceProvider.getTotalBalance();
        if (totalBalance && parseFloat(totalBalance.totalBalanceAlternative)) {
          this.analyticsProvider.logEvent('user_has_funded_wallet', {
            uuid: deviceUUID
          });
          this.persistenceProvider.setHasReportedFirebaseHasFundedWallet();
        } else {
          if (!hasNotFundedWallet) {
            this.analyticsProvider.logEvent('user_has_not_funded_wallet', {
              uuid: deviceUUID
            });
            this.persistenceProvider.setHasReportedFirebaseNonFundedWallet();
          }
        }
      }
    } catch (e) {
      this.logger.debug(
        'Error occurred during wallet audience events: ' + e.message
      );
    }
  }

  private _didEnter() {
    this.updateTxps();
    this.walletAudienceEvents();
    if (this.useImgFadeEffect) {
      setTimeout(() => {
        this.useImgFadeEffect = false;
      }, 5000);
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletsPage');

    const subscribeEvents = () => {
      this.events.subscribe('Local/WalletUpdate', opts => {
        if (opts.finished) {
          this.debounceSetWallets();
        }
      });
    };

    subscribeEvents();
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      subscribeEvents();
    });

    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.events.unsubscribe('Local/WalletHistoryUpdate');
      this.events.unsubscribe('Local/WalletUpdate');
    });
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private debounceSetWallets = _.debounce(
    async () => {
      this.profileProvider.setOrderedWalletsByGroup();
      this.walletsGroups = this.profileProvider.orderedWalletsByGroup;
    },
    5000,
    {
      leading: true
    }
  );

  private debounceSetCoinbase = _.debounce(
    async () => {
      this.coinbaseProvider.updateExchangeRates();
      this.setCoinbase(true);
    },
    5000,
    {
      leading: true
    }
  );

  private updateTxps() {
    this.profileProvider
      .getTxps({ limit: 3 })
      .then(data => {
        this.events.publish('Local/UpdateTxps', {
          n: data.n
        });
        this.zone.run(() => {
          this.txpsN = data.n;
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public goToWalletDetails(wallet): void {
    if (wallet.isComplete()) {
      this.navCtrl.push(WalletDetailsPage, {
        walletId: wallet.credentials.walletId
      });
    } else {
      const copayerModal = this.modalCtrl.create(
        CopayersPage,
        {
          walletId: wallet.credentials.walletId
        },
        {
          cssClass: 'wallet-details-modal'
        }
      );
      copayerModal.present();
    }
  }

  public openProposalsNotificationsPage(): void {
    this.navCtrl.push(ProposalsNotificationsPage);
  }

  public doRefresh(refresher): void {
    this.debounceSetWallets();
    this.debounceSetCoinbase();
    this.events.publish('Local/FetchWallets');
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  public settings(): void {
    this.navCtrl.push(SettingsPage);
  }

  public collapseGroup(keyId: string) {
    this.collapsedGroups[keyId] = this.collapsedGroups[keyId] ? false : true;
  }

  public isCollapsed(keyId: string): boolean {
    return this.collapsedGroups[keyId] ? true : false;
  }

  public addWallet(keyId): void {
    this.navCtrl.push(AddPage, {
      keyId
    });
  }

  public openBackupPage(keyId) {
    this.navCtrl.push(BackupKeyPage, {
      keyId
    });
  }

  public showMoreOptions(): void {
    const walletTabOptionsAction = this.actionSheetProvider.createWalletTabOptions(
      { walletsGroups: this.walletsGroups }
    );
    walletTabOptionsAction.present();
    walletTabOptionsAction.onDidDismiss(data => {
      if (data)
        data.keyId
          ? this.addWallet(data.keyId)
          : this.navCtrl.push(AddPage, {
              isZeroState: true
            });
    });
  }

  public getNativeBalance(amount, currency): string {
    return this.coinbaseProvider.getNativeCurrencyBalance(amount, currency);
  }

  public goToCoinbaseAccount(id): void {
    this.navCtrl.push(CoinbaseAccountPage, {
      id
    });
  }
}
