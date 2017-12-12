import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';

//pages
import { SettingsPage } from '../../../../settings/settings';

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
    private logger: Logger
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
    var title = 'Warning!'; //TODO gettextcatalog
    var message = 'Are you sure you want to delete this wallet?'; //TODO gettextcatalog
    this.popupProvider.ionicConfirm(title, message, null, null).then((res) => {
      if (res) this.deleteWallet();
    });
  };

  public deleteWallet() {
    this.onGoingProcessProvider.set('deletingWallet', true);
    this.profileProvider.deleteWalletClient(this.wallet).then(() => {
      this.onGoingProcessProvider.set('deletingWallet', false);
      this.pushNotificationsProvider.unsubscribe(this.wallet);
      this.navCtrl.setRoot(SettingsPage);
      this.navCtrl.popToRoot();
      this.navCtrl.parent.select(0);
    }).catch((err) => {
      this.popupProvider.ionicAlert('Error', err.message || err);//TODO gettextcatalog
    });
  };
}