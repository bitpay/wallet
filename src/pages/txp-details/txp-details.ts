import { Component } from '@angular/core';
import { NavController, NavParams, Events, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PlatformProvider } from '../../providers/platform/platform';
import { FeeProvider } from '../../providers/fee/fee';
import { PopupProvider } from '../../providers/popup/popup';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { WalletProvider } from '../../providers/wallet/wallet';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ConfigProvider } from '../../providers/config/config';
import { ProfileProvider } from '../../providers/profile/profile';

import * as _ from 'lodash';

@Component({
  selector: 'page-txp-details',
  templateUrl: 'txp-details.html'
})
export class TxpDetailsPage {
  public wallet: any;
  public tx: any;
  public copayers: any;
  public copayerId: string;
  public isShared: boolean;
  public canSign: boolean;
  public color: string;
  public data: any;
  public buttonText: string;
  public successText: string;
  public actionList: Array<any>;
  public paymentExpired: boolean;
  public expires: string;
  public sendStatus: string;
  public currentSpendUnconfirmed: boolean;

  private isGlidera: boolean;
  private GLIDERA_LOCK_TIME: number;
  private now: number;
  private countDown: any;
  private loading: boolean;
  private isCordova: boolean;
  private isWindowsPhoneApp: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private feeProvider: FeeProvider,
    private events: Events,
    private popupProvider: PopupProvider,
    private bwcError: BwcErrorProvider,
    private walletProvider: WalletProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private viewCtrl: ViewController,
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider
  ) {
    let config = this.configProvider.get().wallet;
    this.tx = this.navParams.data.tx;
    this.wallet = this.tx.wallet ? this.tx.wallet : this.profileProvider.getWallet(this.tx.walletId);
    if (!this.tx.toAddress) this.tx.toAddress = this.tx.outputs[0].toAddress;
    this.isGlidera = this.navParams.data.isGlidera;
    this.GLIDERA_LOCK_TIME = 6 * 60 * 60;
    this.currentSpendUnconfirmed = config.spendUnconfirmed;
    this.now = Math.floor(Date.now() / 1000);
    this.loading = false;
    this.isCordova = this.platformProvider.isCordova;
    this.isCordova = this.platformProvider.isCordova;
    this.isWindowsPhoneApp = this.platformProvider.isCordova && this.platformProvider.isWP;
    this.copayers = this.wallet.status.wallet.copayers;
    this.copayerId = this.wallet.credentials.copayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.canSign = this.wallet.canSign() || this.wallet.isPrivKeyExternal();
    this.color = this.wallet.color;
    this.data = {};

  }

  ionViewWillEnter() {
    this.displayFeeValues();
    this.initActionList();
    this.checkPaypro();
    this.applyButtonText();

    // ToDo: use tx.customData instead of tx.message
    if (this.tx.message === 'Glidera transaction' && this.isGlidera) {
      this.tx.isGlidera = true;
      if (this.tx.canBeRemoved) {
        this.tx.canBeRemoved = (Date.now() / 1000 - (this.tx.ts || this.tx.createdOn)) > this.GLIDERA_LOCK_TIME;
      }
    }
    this.events.subscribe('accepted', () => {
      this.sign();
    });

    this.events.subscribe('bwsEvent', (walletId: string, type: string, n: number) => {
      _.each([
        'TxProposalRejectedBy',
        'TxProposalAcceptedBy',
        'transactionProposalRemoved',
        'TxProposalRemoved',
        'NewOutgoingTx',
        'UpdateTx'
      ], (eventName: string) => {
        if (walletId == this.wallet.id && type == eventName) {
          this.updateTxInfo(eventName);
        }
      });
    });

    this.statusChangeHandler = this.statusChangeHandler;
  }

  private displayFeeValues(): void {
    this.tx.feeRateStr = (this.tx.fee / (this.tx.amount + this.tx.fee) * 100).toFixed(2) + '%';
    this.tx.feeLevelStr = this.feeProvider.feeOpts[this.tx.feeLevel];
  }

  private applyButtonText(): void {
    var lastSigner = _.filter(this.tx.actions, {
      type: 'accept'
    }).length == this.tx.requiredSignatures - 1;

    if (lastSigner) {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = 'Slide to send'; //TODO gettextcatalog
      } else {
        this.buttonText = 'Click to send';//TODO gettextcatalog
      }
      this.successText = 'Payment Sent';//TODO gettextcatalog
    } else {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = 'Slide to accept';//TODO gettextcatalog
      } else {
        this.buttonText = 'Click to accept';//TODO gettextcatalog
      }
      this.successText = 'Payment Accepted';//TODO gettextcatalog
    }
  }

  private initActionList(): void {
    this.actionList = [];

    if (!this.isShared) return;

    var actionDescriptions = {
      created: 'Proposal Created', //TODO gettextcatalog
      accept: 'Accepted', //TODO gettextcatalog
      reject: 'Rejected', //TODO gettextcatalog
      broadcasted: 'Broadcasted', //TODO gettextcatalog
    };

    this.actionList.push({
      type: 'created',
      time: this.tx.createdOn,
      description: actionDescriptions['created'],
      by: this.tx.creatorName
    });

    _.each(this.tx.actions, (action: any) => {
      this.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    setTimeout(() => {
      this.actionList.reverse();
    }, 10);
  }

  private checkPaypro() {
    if (this.tx.payProUrl) {
      this.wallet.fetchPayPro({
        payProUrl: this.tx.payProUrl,
      }, (err, paypro) => {
        if (err) return;
        this.tx.paypro = paypro;
        this.paymentTimeControl(this.tx.paypro.expires);
      });
    }
  }

  private paymentTimeControl(expirationTime) {

    let setExpirationTime = (): void => {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        this.paymentExpired = true;
        if (this.countDown) clearInterval(this.countDown);
        return;
      }
      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      this.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    this.paymentExpired = false;
    setExpirationTime();

    this.countDown = setInterval(() => {
      setExpirationTime();
    }, 1000);
  }

  private setError(err: any, prefix: string): void {
    this.loading = false;
    this.popupProvider.ionicAlert('Error', this.bwcError.msg(err, prefix)); //TODO gettextcatalog
  }

  public sign(onSendStatusChange?: any): void {
    this.loading = true;
    this.walletProvider.publishAndSign(this.wallet, this.tx, onSendStatusChange).then((txp: any) => {
      this.events.publish('UpdateTx');
      this.success();
    }).catch((err: any) => {
      this.setError(err, 'Could not send payment'); //TODO gettextcatalog
    });
  }

  public reject(txp: any): void {
    var title = 'Warning!'; //TODO gettextcatalog
    var msg = 'Are you sure you want to reject this transaction?'; //TODO gettextcatalog
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return
      this.loading = true;
      this.walletProvider.reject(this.wallet, this.tx).then((txpr) => {
        this.close();
      }).catch((err: any) => {
        this.setError(err, 'Could not reject payment');  //TODO gettextcatalog
      });
    });
  }

  public remove(): void {
    var title = 'Warning!'; //TODO gettextcatalog
    var msg = 'Are you sure you want to remove this transaction?'; //TODO gettextcatalog
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return;
      this.onGoingProcessProvider.set('removeTx', true);
      this.walletProvider.removeTx(this.wallet, this.tx).then(() => {
        this.onGoingProcessProvider.set('removeTx', false);
        this.close();
      }).catch((err: any) => {
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          this.events.publish('UpdateTx');
          this.setError(err, 'Could not delete payment proposal'); //TODO gettextcatalog
        }
      });
    });
  }

  public broadcast(txp: any): void {
    this.loading = true;
    this.onGoingProcessProvider.set('broadcastingTx', true);
    this.walletProvider.broadcastTx(this.wallet, this.tx).then((txpb: any) => {
      this.onGoingProcessProvider.set('broadcastingTx', false);
      this.close();
    }).catch((err: any) => {
      this.setError(err, 'Could not broadcast payment');
    });
  }

  public getShortNetworkName(): string {
    return this.wallet.credentials.networkName.substring(0, 4);
  }

  private updateTxInfo(eventName: string): void {
    this.wallet.getTx(this.tx.id, (err: any, tx: any) => {
      if (err) {
        if (err.message && err.message == 'Transaction proposal not found' &&
          (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
          this.tx.removed = true;
          this.tx.canBeRemoved = false;
          this.tx.pendingForUs = false;
        }
        return;
      }

      let action = _.find(tx.actions, {
        copayerId: this.wallet.credentials.copayerId
      });

      //this.tx = txFormatService.processTx(this.wallet.coin, tx);

      if (!action && tx.status == 'pending') this.tx.pendingForUs = true;

      this.updateCopayerList();
      this.initActionList();
    });
  }

  public updateCopayerList(): void {
    _.map(this.copayers, (cp: any) => {
      _.each(this.tx.actions, (ac: any) => {
        if (cp.id == ac.copayerId) {
          cp.action = ac.type;
        }
      });
    });
  }

  private statusChangeHandler(processName: string, showName: string, isOn: boolean): void {
    this.logger.debug('statusChangeHandler: ', processName, showName, isOn);
    if (showName) {
      this.sendStatus = showName;
    }
  }

  private success(): void {
    this.sendStatus = 'success';
  }

  public onConfirm(): void {
    this.sign(this.statusChangeHandler);
  };

  public onSuccessConfirm(): void {
    this.close();
  }

  public close(): void {
    this.events.unsubscribe('bwsEvent');
    this.loading = null;
    this.viewCtrl.dismiss();
  }

}