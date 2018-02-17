import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';

//providers
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';

@Component({
  selector: 'page-wallet-delete',
  templateUrl: 'wallet-delete.html',
})
export class WalletDeletePage {

  public wallet: any;
  public walletName: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private logger: Logger,
    private events: Events,
    private translate: TranslateService
  ) {

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
    let message = this.translate.instant('Are you sure you want to delete this wallet?');
    this.popupProvider.ionicConfirm(title, message, null, null).then((res) => {
      if (res) this.deleteWallet();
    });
  };

  public deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet', true);
    this.profileProvider.deleteWalletClient(this.wallet).then(() => {
      this.events.publish('status:updated');
      this.onGoingProcessProvider.set('deletingWallet', false);
      this.pushNotificationsProvider.unsubscribe(this.wallet);
      this.navCtrl.popToRoot({ animate: false });
      this.navCtrl.parent.select(0);
    }).catch((err) => {
      this.popupProvider.ionicAlert(this.translate.instant('Error'), err.message || err);
    });
  };
}
