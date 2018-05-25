import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { FeeProvider } from '../../providers/fee/fee';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { FinishModalPage } from '../finish/finish';

@Component({
  selector: 'page-paper-wallet',
  templateUrl: 'paper-wallet.html',
})
export class PaperWalletPage {
  @ViewChild('slideButton') slideButton;

  public wallet: any;
  public walletName: string;
  public M: number;
  public N: number;
  public totalBalanceStr: string;
  public network: string;
  public wallets: any;
  // All coins for which we have a usable wallet to sweep to
  public coins: string[];
  public scannedKey: string;
  public isPkEncrypted: boolean;
  public passphrase: string;
  public balances: any[] = [];
  public noMatchingWallet: boolean;
  public balanceHidden: boolean;
  public error: boolean;
  public isOpenSelector: boolean;
  private bitcore: any;

  // Platform info
  public isCordova: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private feeProvider: FeeProvider,
    private profileProvider: ProfileProvider,
    private events: Events,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private platformProvider: PlatformProvider,
  ) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
    this.scannedKey = this.navParams.data.privateKey;
    this.isPkEncrypted = this.scannedKey ? (this.scannedKey.substring(0, 2) == '6P') : null;
    this.error = false;
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: 'livenet',
    });

    this.wallets = _.filter(_.clone(this.wallets), (wallet: any) => {
      return !wallet.needsBackup;
    });

    this.coins = _.uniq(_.map(this.wallets, (wallet: any) => wallet.coin));

    if (!this.wallets || !this.wallets.length) {
      this.noMatchingWallet = true;
      return;
    }

    this.wallet = this.wallets[0];
    if (!this.wallet) return;
    if (!this.isPkEncrypted) this.scanFunds();
    else {
      let message = this.translate.instant('Private key encrypted. Enter password');
      let opts = {
        type: 'password',
        enableBackdropDismiss: false
      }
      this.popupProvider.ionicPrompt(null, message, opts).then((res) => {
        this.passphrase = res;
        this.scanFunds();
      });
    }
  }

  private getPrivateKey(scannedKey: string, isPkEncrypted: boolean, passphrase: string, cb: (err, scannedKey) => any): () => any {
    if (!isPkEncrypted) return cb(null, scannedKey);
    this.wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
  }

  private getBalance(privateKey: string, coin: string, cb: (err: any, balance: number) => any): void {
    this.wallet.getBalanceFromPrivateKey(privateKey, coin, cb);
  }

  private checkPrivateKey(privateKey: string): boolean {
    try {
      new this.bitcore.PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  };

  private _scanFunds(coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getPrivateKey(this.scannedKey, this.isPkEncrypted, this.passphrase, (err: any, privateKey: string) => {
        if (err) return reject(err);
        if (!this.checkPrivateKey(privateKey)) return reject(new Error('Invalid private key'));

        this.getBalance(privateKey, coin, (err: any, balance: number) => {
          if (err) return reject(err);
          return resolve({ privateKey, coin, balance });
        });
      });
    });
  }

  public scanFunds() {
    this.onGoingProcessProvider.set('scanning');

    let scans: any[] = _.map(this.coins, (coin: string) => this._scanFunds(coin));

    Promise.all(scans).then(data => {
      this.onGoingProcessProvider.clear();

      _.each(data, d => { this.balances.push(d); });

      let available: any = {};
      this.balances = _.filter(_.clone(this.balances), b => {
        let nonzero: boolean = b.balance > 0;
        available[b.coin] = nonzero;
        return nonzero;
      });

      this.wallets = _.filter(_.clone(this.wallets), w => available[w.coin]);

      this.wallet = this.wallets[0];

      if (this.balances.length == 0) {
        this.popupProvider.ionicAlert('Error', this.translate.instant('No funds found'));

        this.navCtrl.pop();
      }
    }).catch((err: any) => {
      this.onGoingProcessProvider.clear();
      this.logger.error(err);
      this.popupProvider.ionicAlert(this.translate.instant('Error scanning funds:'), err || err.toString());
      this.navCtrl.pop();
    });
  }

  private _sweepWallet(): Promise<any> {
    return new Promise((resolve, reject) => {
      let balanceToSweep: any = _.filter(this.balances, b => {
        return b.coin === this.wallet.coin;
      })[0];

      this.walletProvider.getAddress(this.wallet, true).then((destinationAddress: string) => {
        let opts: any = {};
        opts.coin = balanceToSweep.coin;
        this.wallet.buildTxFromPrivateKey(balanceToSweep.privateKey, destinationAddress, opts, (err: any, testTx: any) => {
          if (err) return reject(err);
          let rawTxLength = testTx.serialize().length;
          this.feeProvider.getCurrentFeeRate(balanceToSweep.coin, 'livenet').then((feePerKb: number) => {
            opts.fee = Math.round((feePerKb * rawTxLength) / 2000);
            this.wallet.buildTxFromPrivateKey(balanceToSweep.privateKey, destinationAddress, opts, (err: any, tx: any) => {
              if (err) return reject(err);
              this.wallet.broadcastRawTx({
                rawTx: tx.serialize(),
                network: 'livenet',
                coin: balanceToSweep.coin
              }, (err, txid) => {
                if (err) return reject(err);
                return resolve({ destinationAddress, txid });
              });
            });
          });
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public sweepWallet(): void {
    this.onGoingProcessProvider.set('sweepingWallet');
    this._sweepWallet().then((data: any) => {
      this.onGoingProcessProvider.clear();
      this.logger.debug('Success sweep. Destination address:' + data.destinationAddress + ' - transaction id: ' + data.txid);
      this.openFinishModal();
    }).catch((err: any) => {
      this.logger.error(err);
      this.popupProvider.ionicAlert(this.translate.instant('Error sweeping wallet:'), err || err.toString());
    });
  }

  private onWalletSelect(wallet: any): void {
    this.wallet = wallet;
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, 'Transfer to');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
      this.isOpenSelector = false;
    });
  }

  private openFinishModal(): void {
    let finishComment = this.translate.instant("Check the transaction on your wallet details");
    let finishText = this.translate.instant('Sweep Completed');
    let modal = this.modalCtrl.create(FinishModalPage, { finishText, finishComment }, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.pop();
    });
  }
}