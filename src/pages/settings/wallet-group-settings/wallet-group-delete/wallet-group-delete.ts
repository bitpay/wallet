import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { Logger } from '../../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../providers/push-notifications/push-notifications';

@Component({
  selector: 'page-wallet-group-delete',
  templateUrl: 'wallet-group-delete.html'
})
export class WalletGroupDeletePage {
  private walletGroupId: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private logger: Logger,
    private translate: TranslateService
  ) {
    this.walletGroupId = this.navParams.data.walletGroupId;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletGroupDeletePage');
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Warning!');
    const message = 'Are you sure you want to delete this wallet?';
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteWalletGroup();
    });
  }

  public async deleteWalletGroup() {
    const wallets = await this.profileProvider.getGroupWallets(
      this.walletGroupId
    );

    this.onGoingProcessProvider.set('deletingWalletGroup');
    this.profileProvider
      .deleteGroupWallets(wallets, this.walletGroupId)
      .then(() => {
        wallets.forEach(wallet => {
          this.pushNotificationsProvider.unsubscribe(wallet);
        });
        this.onGoingProcessProvider.clear();
        this.navCtrl.popToRoot();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error('Deleting wallets err', err);
        this.popupProvider.ionicAlert(
          this.translate.instant('Error'),
          'Could not delete wallet group'
        );
      });
  }
}
