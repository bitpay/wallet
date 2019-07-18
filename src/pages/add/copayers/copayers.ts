import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavParams, Platform, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { KeyProvider } from '../../../providers/key/key';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';

@Component({
  selector: 'page-copayers',
  templateUrl: 'copayers.html'
})
export class CopayersPage {
  public appName: string;
  public appUrl: string;
  public isCordova: boolean;

  public wallet;
  public copayers: any[];
  public secret;

  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  static processed = {};

  constructor(
    private plt: Platform,
    private appProvider: AppProvider,
    private events: Events,
    private logger: Logger,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private socialSharing: SocialSharing,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService,
    private pushNotificationsProvider: PushNotificationsProvider,
    private viewCtrl: ViewController,
    private actionSheetProvider: ActionSheetProvider,
    private keyProvider: KeyProvider
  ) {
    this.secret = null;
    this.appName = this.appProvider.info.userVisibleName;
    this.appUrl = this.appProvider.info.url;
    this.isCordova = this.platformProvider.isCordova;
    this.copayers = [];
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CopayersPage');

    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.events.publish('Local/WalletFocus', {
        walletId: this.wallet.credentials.walletId
      });
      this.subscribeEvents();
    });

    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.unsubscribeEvents();
    });
  }

  ionViewWillEnter() {
    this.events.publish('Local/WalletFocus', {
      walletId: this.wallet.credentials.walletId
    });
    this.subscribeEvents();
  }

  ionViewWillLeave() {
    this.unsubscribeEvents();
  }

  ngOnDestroy() {
    this.events.publish('Local/WalletListChange');
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private subscribeEvents(): void {
    this.events.subscribe('Local/WalletUpdate', this.walletUpdate.bind(this));
  }

  private unsubscribeEvents(): void {
    this.events.unsubscribe('Local/WalletUpdate', this.walletUpdate.bind(this));
  }

  close() {
    this.viewCtrl.dismiss();
  }

  private walletUpdate(opts): void {
    if (!opts.finished) return;

    if (this.wallet && opts.walletId == this.wallet.id) {
      this.copayers = this.wallet.cachedStatus.wallet.copayers;
      this.secret = this.wallet.cachedStatus.wallet.secret;
      if (
        this.wallet.cachedStatus.wallet.status == 'complete' &&
        !CopayersPage.processed[opts.walletId]
      ) {
        CopayersPage.processed[opts.walletId] = true;
        // TODO?
        this.wallet.openWallet(err => {
          if (err) this.logger.error(err);
          this.viewCtrl.dismiss().then(() => {
            this.events.publish('Local/WalletListChange');
            this.events.publish('OpenWallet', this.wallet);
          });
        });
      }
    }
  }

  public showDeletePopup(): void {
    let title = this.translate.instant('Confirm');
    let msg = this.translate.instant(
      'Are you sure you want to cancel and delete this wallet?'
    );
    this.popupProvider.ionicConfirm(title, msg).then(res => {
      if (res) this.deleteWallet();
    });
  }

  private deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet');
    this.profileProvider
      .deleteWalletClient(this.wallet)
      .then(async () => {
        this.onGoingProcessProvider.clear();
        this.pushNotificationsProvider.unsubscribe(this.wallet);

        const keyId: string = this.wallet.credentials.keyId;
        if (keyId) {
          const keyInUse = this.profileProvider.isKeyInUse(keyId);

          if (!keyInUse) {
            await this.keyProvider.removeKey(keyId);
            delete this.profileProvider.walletsGroups[keyId];
          } else {
            this.logger.warn('Key was not removed. Still in use');
            this.dismiss();
          }
        }
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        let errorText = this.translate.instant('Error');
        this.popupProvider.ionicAlert(errorText, err.message || err);
      });
  }

  public dismiss() {
    this.events.publish('Local/WalletListChange');
    setTimeout(() => {
      this.viewCtrl.dismiss();
    }, 1000);
  }

  public showFullInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('copayers', {
      secret: this.secret
    });
    infoSheet.present();
  }

  public shareAddress(): void {
    this.socialSharing.share(this.secret);
  }
}
