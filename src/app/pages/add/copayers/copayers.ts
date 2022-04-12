import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Native
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { KeyProvider } from '../../../providers/key/key';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { ModalController, NavParams, Platform } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { ReplaceParametersProvider } from 'src/app/providers';

@Component({
  selector: 'page-copayers',
  templateUrl: 'copayers.html',
  styleUrls: ['./copayers.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CopayersPage {
  public appName: string;
  public appUrl: string;
  public isCordova: boolean;

  public wallet;
  public canSign: boolean;
  public copayers: any[];
  public secret;
  typeErrorQr = NgxQrcodeErrorCorrectionLevels;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  static processed = {};
  public titlePage: string;
  public currentTheme: string;
  constructor(
    private plt: Platform,
    private appProvider: AppProvider,
    private events: EventManagerService,
    private logger: Logger,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private socialSharing: SocialSharing,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService,
    private pushNotificationsProvider: PushNotificationsProvider,
    private viewCtrl: ModalController,
    private keyProvider: KeyProvider,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.secret = null;
    this.appName = this.appProvider.info.userVisibleName;
    this.appUrl = this.appProvider.info.url;
    this.isCordova = this.platformProvider.isCordova;
    this.copayers = [];
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.canSign = this.wallet.canSign;
    this.titlePage = this.replaceParametersProvider.replace(
      this.translate.instant('{{ name }} [{{m}}-{{n}}]'),
      {
        name: this.wallet.name,
        m: this.wallet.m,
        n: this.wallet.n
      }
    );
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }


  ngOnInit() {
    this.logger.info('Loaded: CopayersPage');
    this.subscribeEvents();
    this.events.publish('Local/WalletFocus', {
      walletId: this.wallet.credentials.walletId
    });
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

  ngOnDestroy() {
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
    this.unsubscribeEvents();
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
          this.close();
        });
      }
    }
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Confirm');
    let msg;
    if (!this.canSign) {
      msg = this.translate.instant(
        'Are you sure you want to delete this wallet?'
      );
    }
    msg = this.translate.instant('Are you sure you want to hide this wallet?');
    this.popupProvider.ionicConfirm(title, msg).then(res => {
      if (res) this.deleteWallet();
    });
  }

  private deleteWallet(): void {
    if (this.canSign) {
      this.profileProvider.toggleHideWalletFlag(this.wallet.id);
      setTimeout(() => {
        this.close();
      }, 1000);
      return;
    }
    this.onGoingProcessProvider.set('deletingWallet');
    this.profileProvider
      .deleteWalletClient(this.wallet)
      .then(() => {
        this.onGoingProcessProvider.clear();
        this.pushNotificationsProvider.unsubscribe(this.wallet);

        const keyId: string = this.wallet.credentials.keyId;
        if (keyId) {
          const keyInUse = this.profileProvider.isKeyInUse(keyId);

          if (!keyInUse) {
            this.keyProvider.removeKey(keyId);
          } else {
            this.logger.warn('Key was not removed. Still in use');
          }
        }
        setTimeout(() => {
          this.close();
        }, 1000);
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        let errorText = this.translate.instant('Error');
        this.popupProvider.ionicAlert(errorText, err.message || err);
      });
  }

  public shareAddress(): void {
    this.socialSharing.share(this.secret);
  }
}
