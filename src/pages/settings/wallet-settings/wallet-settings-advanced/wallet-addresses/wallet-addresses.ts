import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../providers/wallet/wallet';
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';

//pages
import { AllAddressesPage } from './all-addresses/all-addresses';
import { SettingsPage } from '../../../settings';
import { WalletDetailsPage } from '../../../../../pages/wallet-details/wallet-details';

import * as _ from 'lodash';

@Component({
  selector: 'page-wallet-addresses',
  templateUrl: 'wallet-addresses.html',
})
export class WalletAddressesPage {

  public wallet: any;
  public loading: boolean;
  public latestUnused: any;
  public latestWithBalance: any;
  public viewAll: boolean;
  public gapReached: boolean;
  private UNUSED_ADDRESS_LIMIT: number;
  private BALANCE_ADDRESS_LIMIT: number;
  private withBalance: any;
  private noBalance: any;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private bwcErrorProvider: BwcErrorProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private modalCtrl: ModalController,
  ) {
    this.UNUSED_ADDRESS_LIMIT = 5;
    this.BALANCE_ADDRESS_LIMIT = 5;
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.withBalance = null;
    this.noBalance = null;
  }

  ionViewWillEnter() {
    this.loading = true;
    this.walletProvider.getMainAddresses(this.wallet, {}).then((allAddresses: any) => {
      this.walletProvider.getBalance(this.wallet, {}).then((resp: any) => {
        this.withBalance = resp.byAddress;

        var idx = _.keyBy(this.withBalance, 'address');
        this.noBalance = _.reject(allAddresses, (x) => {
          return idx[x.address];
        });

        this.processPaths(this.noBalance);
        this.processPaths(this.withBalance);

        this.latestUnused = _.slice(this.noBalance, 0, this.UNUSED_ADDRESS_LIMIT);
        this.latestWithBalance = _.slice(this.withBalance, 0, this.BALANCE_ADDRESS_LIMIT);
        this.viewAll = this.noBalance.length > this.UNUSED_ADDRESS_LIMIT || this.withBalance.length > this.BALANCE_ADDRESS_LIMIT;
        this.loading = false;
      }).catch((err: any) => {
        this.logger.error(err);
        this.loading = false;
        this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, 'Could not update wallet')); //TODO gettextcatalog
      });
    }).catch((err: any) => {
      this.logger.error(err);
      this.loading = false;
      this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, 'Could not update wallet')); //TODO gettextcatalog
    });
  }

  private processPaths(list: any): void {
    _.each(list, (n: any) => {
      n.path = n.path.replace(/^m/g, 'xpub');
    });
  }

  public newAddress(): void {
    if (this.gapReached) return;

    this.onGoingProcessProvider.set('generatingNewAddress', true);
    this.walletProvider.getAddress(this.wallet, true).then((addr: string) => {
      this.walletProvider.getMainAddresses(this.wallet, { limit: 1 }).then((_addr: any) => {
        this.onGoingProcessProvider.set('generatingNewAddress', false);
        if (addr != _addr[0].address) {
          this.popupProvider.ionicAlert('Error', 'New address could not be generated. Please try again.'); //TODO gettextcatalog
          return;
        }
        this.noBalance = [_addr[0]].concat(this.noBalance);
        this.latestUnused = _.slice(this.noBalance, 0, this.UNUSED_ADDRESS_LIMIT);
        this.viewAll = this.noBalance.length > this.UNUSED_ADDRESS_LIMIT;
      }).catch((err) => {
        this.logger.error(err);
        this.onGoingProcessProvider.set('generatingNewAddress', false);
        this.popupProvider.ionicAlert('Error', err); //TODO getextcatalog
      });
    }).catch((err) => {
      this.logger.error(err);
      this.onGoingProcessProvider.set('generatingNewAddress', false);
      if (err.toString().match('MAIN_ADDRESS_GAP_REACHED')) {
        this.gapReached = true;
      } else {
        this.popupProvider.ionicAlert('Error', err);
      }
    });
  }

  public viewAllAddresses(): void {
    let modal = this.modalCtrl.create(AllAddressesPage, { noBalance: this.noBalance, withBalance: this.withBalance, coin: this.wallet.coin });
    modal.present();
  }

  public scan(): void {
    this.walletProvider.startScan(this.wallet);
    this.navCtrl.setRoot(SettingsPage);
    this.navCtrl.popToRoot();
    this.navCtrl.parent.select(0);
    this.navCtrl.push(WalletDetailsPage, { walletId: this.wallet.credentials.walletId })
  }

  // TODO: socialsharing
  /*private formatDate(ts: number): any {
    var dateObj = new Date(ts * 1000);
    if (!dateObj) {
      this.logger.debug('Error formating a date');
      return 'DateError';
    }
    if (!dateObj.toJSON()) {
      return '';
    }
    return dateObj.toJSON();
  }*/

  public sendByEmail(): any {

    this.onGoingProcessProvider.set('sendingByEmail', true);
    setTimeout(() => {
      this.onGoingProcessProvider.set('sendingByEmail', false);
      // TODO: socialsharing
      /*let appName = this.app.info.nameCase;

      let body: string = appName + ' Wallet "' + this.wallet.name + '" Addresses\n  Only Main Addresses are  shown.\n\n';
      body += "\n";
      body += this.allAddresses.map((v) => {
        return ('* ' + v.address + ' xpub' + v.path.substring(1) + ' ' + this.formatDate(v.createdOn));
      }).join("\n");
      
       window.plugins.socialsharing.shareViaEmail(
        body,
        appName + ' Addresses',
        null, // TO: must be null or an array
        null, // CC: must be null or an array
        null, // BCC: must be null or an array
        null, // FILES: can be null, a string, or an array
        function () { },
        function () { }
      ); */
    });
  }
}