import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// providers
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../providers/push-notifications/push-notifications';

@Component({
  selector: 'page-wallet-delete',
  templateUrl: 'wallet-delete.html',
  styleUrls: ['wallet-delete.scss']
})
export class WalletDeletePage {
  public wallet;
  navParamsData;
  private keyId: string;
  constructor(
    private profileProvider: ProfileProvider,
    private router: Router,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private translate: TranslateService,
    private keyProvider: KeyProvider,
    private pushNotificationsProvider: PushNotificationsProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : undefined;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: WalletDeletePage');
  }

  ionViewWillEnter() {
    const walletId = this.navParamsData.walletId;
    this.keyId = this.navParamsData.keyId;
    this.wallet = this.profileProvider.getWallet(walletId);
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Warning!');
    const message = this.translate.instant(
      'Are you sure you want to delete this account?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteWallet();
    });
  }

  public deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet');
    this.profileProvider.removeProfileLegacy();
    this.profileProvider
      .deleteWalletClient(this.wallet)
      .then(async () => {
        this.onGoingProcessProvider.clear();

        this.pushNotificationsProvider.unsubscribe(this.wallet);

        const keyInUse = this.profileProvider.isKeyInUse(this.keyId);

        if (!keyInUse) {
          this.keyProvider.removeKey(this.keyId);
          this.goHome();
        } else {
          this.logger.warn('Key was not removed. Still in use');
          this.goHome();
        }
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Could not remove all wallet data: ', err);
        this.popupProvider.ionicAlert(
          this.translate.instant('Error'),
          err.message || err
        );
      });
  }

  private goHome() {
    setTimeout(() => {
      this.router.navigate([''], { replaceUrl: true });
    }, 1000);
  }
}
