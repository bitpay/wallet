import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

// Pages
import { WalletDetailsPage } from '../../../pages/wallet-details/wallet-details';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { Logger } from '../../../providers/logger/logger';


@Component({
  selector: 'page-copayers',
  templateUrl: 'copayers.html',
})
export class CopayersPage {

  public appName: string = this.appProvider.info.userVisibleName;
  public appUrl: string = this.appProvider.info.url;
  public isCordova: boolean = this.platformProvider.isCordova;

  public wallet: any;
  public copayers: any;
  public secret: any;

  constructor(
    private appProvider: AppProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private events: Events,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private translate: TranslateService
  ) {
    this.secret = null;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CopayersPage');
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.updateWallet();

    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      if (this.wallet && walletId == this.wallet.id && type == ('NewCopayer' || 'WalletComplete')) {
        this.updateWallet();
      }
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  private updateWallet(): void {
    this.logger.debug('Updating wallet:' + this.wallet.name)
    this.walletProvider.getStatus(this.wallet, {}).then((status: any) => {
      this.wallet.status = status;
      this.copayers = this.wallet.status.wallet.copayers;
      this.secret = this.wallet.status.wallet.secret;
      if (status.wallet.status == 'complete') {
        this.wallet.openWallet((err: any, status: any) => {
          if (err)
            this.logger.error(err);

          this.navCtrl.popToRoot({ animate: false });
          this.navCtrl.push(WalletDetailsPage, { walletId: this.wallet.credentials.walletId });
        });
      }
    }).catch((err: any) => {
      let message = this.translate.instant('Could not update wallet');
      this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, message));
      return;
    });
  }

  public showDeletePopup(): void {
    let title = this.translate.instant('Confirm');
    let msg = this.translate.instant('Are you sure you want to cancel and delete this wallet?');
    this.popupProvider.ionicConfirm(title, msg).then((res: any) => {
      if (res) this.deleteWallet();
    });
  }

  private deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet', true);
    this.profileProvider.deleteWalletClient(this.wallet).then(() => {
      this.onGoingProcessProvider.set('deletingWallet', false);

      // TODO: pushNotificationsService.unsubscribe(this.wallet);
      this.navCtrl.popToRoot({ animate: false });
      this.navCtrl.parent.select(0);
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('deletingWallet', false);
      let errorText = this.translate.instant('Error');
      this.popupProvider.ionicAlert(errorText, err.message || err);
    });
  }

}

