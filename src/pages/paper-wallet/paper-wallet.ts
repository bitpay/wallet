import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { FeeProvider } from '../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { FinishModalPage } from '../finish/finish';

@Component({
  selector: 'page-paper-wallet',
  templateUrl: 'paper-wallet.html',
})
export class PaperWalletPage {

  public wallet: any;
  public walletName: string;
  public M: number;
  public N: number;
  public totalBalanceStr: string;
  public network: string;
  public wallets: any;
  public scannedKey: string;
  public isPkEncrypted: boolean;
  public passphrase: string;
  public privateKey: string;
  public balanceSat: number;
  public singleWallet: boolean;
  public noMatchingWallet: boolean;
  public balanceHidden: boolean;
  public error: boolean;
  private bitcore: any;

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
    private translate: TranslateService
  ) {
    this.bitcore = this.bwcProvider.getBitcore();
  }

  ionViewWillEnter() {
    this.scannedKey = this.navParams.data.privateKey;
    this.isPkEncrypted = this.scannedKey ? (this.scannedKey.substring(0, 2) == '6P') : null;
    this.error = false;
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: 'livenet',
    });
    this.singleWallet = this.wallets.length == 1;

    if (!this.wallets || !this.wallets.length) {
      this.noMatchingWallet = true;
      return;
    }

    this.wallet = this.wallets[0];
    if (!this.wallet) return;
    if (!this.isPkEncrypted) this.scanFunds();
    else {
      let message = this.translate.instant('Private key encrypted. Enter password');
      this.popupProvider.ionicPrompt(null, message, null).then((res) => {
        this.passphrase = res;
        this.scanFunds();
      });
    }
  }

  private getPrivateKey(scannedKey: string, isPkEncrypted: boolean, passphrase: string, cb: (err, scannedKey) => any): () => any {
    if (!isPkEncrypted) return cb(null, scannedKey);
    this.wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
  }

  private getBalance(privateKey: string, cb: (err: any, balance: number) => any): void {
    this.wallet.getBalanceFromPrivateKey(privateKey, cb);
  }

  private checkPrivateKey(privateKey: string): boolean {
    try {
      new this.bitcore.PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  };

  private _scanFunds(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getPrivateKey(this.scannedKey, this.isPkEncrypted, this.passphrase, (err: any, privateKey: string) => {
        if (err) return reject(err);
        if (!this.checkPrivateKey(privateKey)) return reject(new Error('Invalid private key'));

        this.getBalance(privateKey, (err: any, balance: number) => {
          if (err) return reject(err);
          return resolve({ privateKey, balance });
        });
      });
    });
  }

  public scanFunds() {
    this.onGoingProcessProvider.set('scanning');
    this._scanFunds().then((data) => {
      this.onGoingProcessProvider.clear();
      this.privateKey = data.privateKey;
      this.balanceSat = data.balance;
      if (this.balanceSat <= 0) {
        this.popupProvider.ionicAlert('Error', this.translate.instant('Not funds found'));
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
      this.walletProvider.getAddress(this.wallet, true).then((destinationAddress: string) => {
        this.wallet.buildTxFromPrivateKey(this.privateKey, destinationAddress, null, (err: any, testTx: any) => {
          if (err) return reject(err);
          let rawTxLength = testTx.serialize().length;
          this.feeProvider.getCurrentFeeRate('btc', 'livenet').then((feePerKb: number) => {
            let opts: any = {};
            opts.fee = Math.round((feePerKb * rawTxLength) / 2000);
            this.wallet.buildTxFromPrivateKey(this.privateKey, destinationAddress, opts, (err: any, tx: any) => {
              if (err) return reject(err);
              this.wallet.broadcastRawTx({
                rawTx: tx.serialize(),
                network: 'livenet'
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
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, 'Select a wallet');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
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