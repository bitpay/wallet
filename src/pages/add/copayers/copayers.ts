import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { HomePage } from '../../../pages/home/home';
import { WalletDetailsPage } from '../../../pages/wallet-details/wallet-details';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';


@Component({
  selector: 'page-copayers',
  templateUrl: 'copayers.html',
})
export class CopayersPage {

  public appName: string = this.appProvider.info.userVisibleName;
  public appUrl: string = this.appProvider.info.url;
  public isCordova: boolean = this.platformProvider.isCordova;

  public wallet: any;
  public shareIcon: string;
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
    private walletProvider: WalletProvider
  ) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CopayersPage');
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.updateWallet();
    this.shareIcon = this.platformProvider.isIOS ? 'iOS' : 'Android';

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

          this.navCtrl.setRoot(HomePage);
          this.navCtrl.popToRoot();
          this.navCtrl.push(WalletDetailsPage, { walletId: this.wallet.credentials.walletId });
        });
      }
    }).catch((err: any) => {
      this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, 'Could not update wallet')); // TODO: GetTextCatalog
      return;
    });
  }

  public showDeletePopup(): void {
    let title = 'Confirm'; // TODO: GetTextCatalog
    let msg = 'Are you sure you want to cancel and delete this wallet?'; // TODO: GetTextCatalog
    this.popupProvider.ionicConfirm(title, msg, 'Ok', 'Cancel').then((res: any) => {
      if (res) this.deleteWallet();
    });
  }

  private deleteWallet(): void {
    this.onGoingProcessProvider.set('deletingWallet', true);
    this.profileProvider.deleteWalletClient(this.wallet).then(() => {
      this.onGoingProcessProvider.set('deletingWallet', false);

      // TODO: pushNotificationsService.unsubscribe(this.wallet);
      this.navCtrl.setRoot(HomePage);
      this.navCtrl.popToRoot();
      this.navCtrl.parent.select(0);
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('deletingWallet', false);
      this.popupProvider.ionicAlert('Error', err.message || err); // TODO: GetTextCatalog  
    });
  }

}

