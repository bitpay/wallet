import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../providers/wallet/wallet';
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { AppProvider } from '../../../../../providers/app/app';

//pages
import { AllAddressesPage } from './all-addresses/all-addresses';
import { HomePage } from '../../../../../pages/home/home';
import { WalletDetailsPage } from '../../../../../pages/wallet-details/wallet-details';

import * as _ from 'lodash';

@Component({
  selector: 'page-wallet-addresses',
  templateUrl: 'wallet-addresses.html',
})
export class WalletAddressesPage {

  public wallet: any;
  public allAddressesView: boolean;
  public loading: boolean;
  public noBalance: any;
  public latestUnused: any;
  public latestWithBalance: any;
  public viewAll: boolean;
  public allAddresses: any;
  public showInfo: boolean;
  public showMore: boolean;
  public gapReached: boolean;
  private UNUSED_ADDRESS_LIMIT: number = 5;
  private BALANCE_ADDRESS_LIMIT: number = 5;
  private withBalance;
  private cachedWallet;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private bwcErrorProvider: BwcErrorProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private app: AppProvider
  ) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad WalletAddressesPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.allAddressesView = this.navParams.data.stateName == 'tabs.receive.allAddresses' ? true : false;
    if (!this.isCachedWallet(this.navParams.data.walletId)) this.init();
    else this.logger.debug('Addresses cached for Wallet:', this.navParams.data.walletId);
  }

  private init(): void {
    this.resetValues();
    this.loading = true;

    this.walletProvider.getMainAddresses(this.wallet, {}).then((addresses: any) => {
      var allAddresses = addresses;

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
        this.allAddresses = this.noBalance.concat(this.withBalance);

        this.cachedWallet = this.wallet.id;
        this.loading = false;
        this.logger.debug('Addresses cached for Wallet:', this.cachedWallet);
      }).catch((err: any) => {
        if (err) {
          this.loading = false;
          return this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, 'Could not update wallet')); //TODO gettextcatalog
        }
      });
    }).catch((err: any) => {
      if (err) {
        this.loading = false;
        return this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, 'Could not update wallet')); //TODO gettextcatalog
      }
    });
  }

  private resetValues() {
    this.loading = false;
    this.showInfo = false;
    this.showMore = false;
    this.allAddressesView = false;
    this.latestUnused = this.latestWithBalance = null;
    this.viewAll = false;
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
        this.popupProvider.ionicAlert('Error', err); //TODO getextcatalog
      });
    }).catch((err) => {
      this.onGoingProcessProvider.set('generatingNewAddress', false);
      if (err.toString().match('MAIN_ADDRESS_GAP_REACHED')) {
        this.gapReached = true;
      } else {
        this.popupProvider.ionicAlert(err);
      }
    });
  }

  public viewAllAddresses(): void {
    this.navCtrl.push(AllAddressesPage, { walletId: this.wallet.credentials.walletId });
  }

  public showInformation(): void {
    this.showInfo = !this.showInfo;
  }

  public readMore(): void {
    this.showMore = !this.showMore;
  }

  public scan(): void {
    this.walletProvider.startScan(this.wallet);
    this.navCtrl.setRoot(HomePage, { walletId: this.wallet.credentials.walletId });
    this.navCtrl.popToRoot();
    this.navCtrl.push(WalletDetailsPage, { walletId: this.wallet.credentials.walletId })
  }

  private formatDate(ts: number): any {
    var dateObj = new Date(ts * 1000);
    if (!dateObj) {
      this.logger.debug('Error formating a date');
      return 'DateError';
    }
    if (!dateObj.toJSON()) {
      return '';
    }
    return dateObj.toJSON();
  }

  public sendByEmail(): any {

    this.onGoingProcessProvider.set('sendingByEmail', true);
    setTimeout(() => {
      var appName = this.app.info.nameCase;

      var body = appName + ' Wallet "' + this.wallet.name + '" Addresses\n  Only Main Addresses are  shown.\n\n';
      body += "\n";
      body += this.allAddresses.map((v) => {
        return ('* ' + v.address + ' xpub' + v.path.substring(1) + ' ' + this.formatDate(v.createdOn));
      }).join("\n");
      this.onGoingProcessProvider.set('sendingByEmail', false);
      //TODO
      /* window.plugins.socialsharing.shareViaEmail(
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

  private isCachedWallet(walletId: string): boolean {
    if (this.cachedWallet && this.cachedWallet == walletId) return true;
    else return false;
  }
}