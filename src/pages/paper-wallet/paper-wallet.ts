import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, Events } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../providers/popup/popup';
import { WalletProvider } from '../../providers/wallet/wallet';
import { FeeProvider } from '../../providers/fee/fee';
import { ProfileProvider } from '../../providers/profile/profile';

import * as _ from 'lodash';

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
    private actionSheetCtrl: ActionSheetController,
    private events: Events
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
      let message = 'Private key encrypted. Enter password'; //TODO gettextcatalog
      this.popupProvider.ionicPrompt(null, message, null).then((res) => {
        this.passphrase = res;
        this.scanFunds();
      });
    }
  }

  private getPrivateKey(scannedKey: string, isPkEncrypted: boolean, passphrase: string, cb: Function): Function {
    if (!isPkEncrypted) return cb(null, scannedKey);
    this.wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
  }

  private getBalance(privateKey: string, cb: Function): void {
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
          return resolve({ privateKey: privateKey, balance: balance });
        });
      });
    });
  }

  public scanFunds() {
    this.onGoingProcessProvider.set('scanning', true);
    this._scanFunds().then((data) => {
      this.onGoingProcessProvider.set('scanning', false);
      this.privateKey = data.privateKey;
      this.balanceSat = data.balance;
      if (this.balanceSat <= 0) this.popupProvider.ionicAlert('Error', 'Not funds found'); //TODO gettextcatalog
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('scanning', false);
      this.logger.error(err);
      this.popupProvider.ionicAlert('Error scanning funds:', err || err.toString());//TODO gettextcatalog
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
                return resolve({ destinationAddress: destinationAddress, txid: txid });
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
    this.onGoingProcessProvider.set('sweepingWallet', true);
    this._sweepWallet().then((data: any) => {
      this.onGoingProcessProvider.set('sweepingWallet', false);
    }).catch((err: any) => {
      this.logger.error(err);
      this.popupProvider.ionicAlert('Error sweeping wallet:', err || err.toString());//TODO gettextcatalog
    });
  }

  private onWalletSelect(wallet: any): void {
    this.wallet = wallet;
  }

  public showWallets(): void {
    this.events.publish('showWalletsSelectorEvent', this.wallets, this.wallet.id, 'Select a wallet');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
  }
}