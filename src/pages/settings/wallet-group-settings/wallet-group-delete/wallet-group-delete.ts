import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { KeyProvider } from '../../../../providers/key/key';
import { Logger } from '../../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../providers/push-notifications/push-notifications';
import { WalletTabsChild } from '../../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-wallet-group-delete',
  templateUrl: 'wallet-group-delete.html'
})
export class WalletGroupDeletePage extends WalletTabsChild {
  public walletsGroup;

  private keyId: string;
  constructor(
    public profileProvider: ProfileProvider,
    public navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private logger: Logger,
    private translate: TranslateService,
    private keyProvider: KeyProvider,
    public walletTabsProvider: WalletTabsProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletDeletePage');
  }

  ionViewWillEnter() {
    this.keyId = this.navParams.data.keyId;
    this.walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Warning!');
    const message = this.translate.instant(
      'Are you sure you want to delete all wallets in group?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteWallet();
    });
  }

  public deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet');
    const opts = {
      keyId: this.keyId
    };
    const wallets = this.profileProvider.getWallets(opts);
    this.profileProvider
      .deleteWalletGroup(wallets)
      .then(() => {
        if (this.keyId) {
          const keyInUse = this.profileProvider.isKeyInUse(this.keyId);

          if (!keyInUse) {
            this.keyProvider.removeKey(this.keyId);
          } else {
            this.logger.warn('Key was not removed. Still in use');
          }
        }

        this.onGoingProcessProvider.clear();
        this.pushNotificationsProvider.unsubscribe(this.wallet);
        this.close();
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
}
