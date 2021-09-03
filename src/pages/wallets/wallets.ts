import { HttpClient } from '@angular/common/http';
import { Component, NgZone, ViewChild } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  LoadingController,
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Pages
import { AddPage } from '../add/add';
import { CopayersPage } from '../add/copayers/copayers';
import { BackupKeyPage } from '../backup/backup-key/backup-key';
import { SettingsPage } from '../settings/settings';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { ProposalsNotificationsPage } from './proposals-notifications/proposals-notifications';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
// import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { AmountPage } from '../send/amount/amount';

@Component({
  selector: 'page-wallets',
  templateUrl: 'wallets.html'
})
export class WalletsPage {
  @ViewChild('priceCard')
  priceCard;
  public wallets;
  public walletsGroups = [];
  public txpsN: number;

  public collapsedGroups;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

  public showCoinbase: boolean;
  public coinbaseLinked: boolean;
  public coinbaseData: object = {};
  isDonation ;
  donationSupportCoins = [];

  constructor(
    public http: HttpClient,
    private plt: Platform,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    // private bwcErrorProvider: BwcErrorProvider,
    private platformProvider: PlatformProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private events: Events,
    private persistenceProvider: PersistenceProvider,
    // private translate: TranslateService,
    private modalCtrl: ModalController,
    private actionSheetProvider: ActionSheetProvider,
    private navParams: NavParams,
    private loadingCtr: LoadingController
  ) {
    this.isDonation = this.navParams.data.isDonation;
    this.collapsedGroups = {};
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewDidEnter() {
    this._didEnter();
  }

  ionViewWillEnter() {
    this.getWalletsGroups();
  }

  private getWalletsGroups(){
    const walletsGroups = this.profileProvider.orderedWalletsByGroup;
    if (this.isDonation) {
        this.walletProvider.getDonationInfo().then((data: any) => {
        this.donationSupportCoins = data.donationSupportCoins;
        this.walletsGroups = this.filterLotusDonationWallet(walletsGroups);
      });
    }
    this.walletsGroups = walletsGroups;
  }

  private filterLotusDonationWallet(walletGroups: any) {
    const walletsGroup = [];
    walletGroups.forEach((el: any) => {
      const wallet = el.filter(wallet => {
        return _.some(this.donationSupportCoins, (item: any) => item.network == wallet.network && item.coin == wallet.coin);
      })
      walletsGroup.push(wallet);
    })
    return walletsGroup;
  }

  isEmptyWalletDonation(walletGroups: any){
    return walletGroups.length <= 1 && _.isEmpty(walletGroups[0]);
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
        if (parseFloat(totalBalance.totalBalanceAlternative)) {
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
      this.walletsGroups.forEach(walletArray => {
        walletArray.forEach(wallet => {
          this.events.publish('Local/WalletFocus', {
            walletId: wallet.id,
            force: true
          });
        });
        
      });
      
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

  // private processWalletError(wallet, err): void {
  //   wallet.error = wallet.errorObj = null;

  //   if (!err || err == 'INPROGRESS') return;

  //   wallet.cachedStatus = null;
  //   wallet.errorObj = err;

  //   if (err.message === '403') {
  //     wallet.error = this.translate.instant('Access denied');
  //   } else if (err === 'WALLET_NOT_REGISTERED') {
  //     wallet.error = this.translate.instant('Wallet not registered');
  //   } else {
  //     wallet.error = this.bwcErrorProvider.msg(err);
  //   }
  //   this.logger.warn(
  //     this.bwcErrorProvider.msg(
  //       wallet.error,
  //       'Error updating status for ' + wallet.id
  //     )
  //   );
  // }
  
  public handleDonation(wallet) {
    const loading = this.loadingCtr.create({
      content: 'Please wait...'
    })
    loading.present();
    this.walletProvider.getDonationInfo().then((data:any) => {
      loading.dismiss();
      if(_.isEmpty(data)) {
        throw new Error("No data Remaning");
      }
      this.navCtrl.push(AmountPage, {
        toAddress: _.get(_.find(data.donationToAddresses, item => item.coin == wallet.coin), 'address', '' ),
        donationSupportCoins : data.donationSupportCoins,
        id: wallet.credentials.walletId,
        walletId: wallet.credentials.walletId,
        recipientType: 'wallet',
        name: wallet.name,
        coin: wallet.coin,
        network: wallet.network,
        isDonation: true,
        fromWalletDetails: true,
        minMoneydonation: data.minMoneydonation,
        remaining : data.remaining,
        receiveLotus: data.receiveAmountLotus,
        donationCoin: data.donationCoin
      });
    }).catch((err) => {
      console.log(err)
    });
  }

  public goToWalletDetails(wallet): void {
    if (this.isDonation) {
      return this.handleDonation(wallet);
    }
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
    if (!this.isDonation) {
      this.debounceSetWallets();
    }
    this.debounceSetWallets();
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
}



// WEBPACK FOOTER //
// ./src/pages/wallets/wallets.ts