import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';

// providers
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';
import { WalletTabsChild } from '../../../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../../../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-wallet-delete',
  templateUrl: 'wallet-delete.html'
})
export class WalletDeletePage extends WalletTabsChild {
  public wallet;
  public walletName: string;

  constructor(
    public profileProvider: ProfileProvider,
    public navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private logger: Logger,
    private events: Events,
    private translate: TranslateService,
    public walletTabsProvider: WalletTabsProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletDeletePage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.walletName = this.wallet.name;
  }

  public showDeletePopup(): void {
    let title = this.translate.instant('Warning!');
    let message = this.translate.instant(
      'Are you sure you want to delete this wallet?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteWallet();
    });
  }

  public deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet');
    this.profileProvider
      .deleteWalletClient(this.wallet)
      .then(() => {
        this.events.publish('status:updated');
        this.onGoingProcessProvider.clear();
        this.pushNotificationsProvider.unsubscribe(this.wallet);
        this.close();
      })
      .catch(err => {
        this.popupProvider.ionicAlert(
          this.translate.instant('Error'),
          err.message || err
        );
      });
  }
}
