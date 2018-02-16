import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavParams, ViewController } from 'ionic-angular';

//providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { FeeProvider } from '../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

//pages
import { SuccessModalPage } from '../success/success';

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
  public buttonText: string;
  public successText: string;
  public actionList: Array<any>;
  public paymentExpired: boolean;
  public expires: string;
  public currentSpendUnconfirmed: boolean;
  public loading: boolean;

  private isGlidera: boolean;
  private GLIDERA_LOCK_TIME: number;
  private countDown: any;
  private isCordova: boolean;
  private isWindowsPhoneApp: boolean;

  constructor(
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private feeProvider: FeeProvider,
    private events: Events,
    private popupProvider: PopupProvider,
    private bwcError: BwcErrorProvider,
    private walletProvider: WalletProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private viewCtrl: ViewController,
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController
  ) {
    let config = this.configProvider.get().wallet;
    this.tx = this.navParams.data.tx;
    this.wallet = this.tx.wallet ? this.tx.wallet : this.profileProvider.getWallet(this.tx.walletId);
    this.tx = this.txFormatProvider.processTx(this.wallet.coin, this.tx);
    if (!this.tx.toAddress) this.tx.toAddress = this.tx.outputs[0].toAddress;
    this.isGlidera = this.navParams.data.isGlidera;
    this.GLIDERA_LOCK_TIME = 6 * 60 * 60;
    this.currentSpendUnconfirmed = config.spendUnconfirmed;
    this.loading = false;
    this.isCordova = this.platformProvider.isCordova;
    this.isWindowsPhoneApp = this.platformProvider.isCordova && this.platformProvider.isWP;
    this.copayers = this.wallet.status.wallet.copayers;
    this.copayerId = this.wallet.credentials.copayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.canSign = this.wallet.canSign() || this.wallet.isPrivKeyExternal();
    this.color = this.wallet.color;
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
  }

  private displayFeeValues(): void {
    this.tx.feeFiatStr = this.txFormatProvider.formatAlternativeStr(this.wallet.coin, this.tx.fee);
    this.tx.feeRateStr = (this.tx.fee / (this.tx.amount + this.tx.fee) * 100).toFixed(2) + '%';
    this.tx.feeLevelStr = this.feeProvider.feeOpts[this.tx.feeLevel];
  }

  private applyButtonText(): void {
    var lastSigner = _.filter(this.tx.actions, {
      type: 'accept'
    }).length == this.tx.requiredSignatures - 1;

    if (lastSigner) {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = this.translate.instant('Slide to send');
      } else {
        this.buttonText = this.translate.instant('Click to send');
      }
      this.successText = this.translate.instant('Payment Sent');
    } else {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = this.translate.instant('Slide to accept');
      } else {
        this.buttonText = this.translate.instant('Click to accept');
      }
      this.successText = this.translate.instant('Payment Accepted');
    }
  }

  private initActionList(): void {
    this.actionList = [];

    if (!this.isShared) return;

    var actionDescriptions = {
      created: this.translate.instant('Proposal Created'),
      accept: this.translate.instant('Accepted'),
      reject: this.translate.instant('Rejected'),
      broadcasted: this.translate.instant('Broadcasted'),
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
      let now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        this.paymentExpired = true;
        if (this.countDown) clearInterval(this.countDown);
        return;
      }
      let totalSecs = expirationTime - now;
      let m = Math.floor(totalSecs / 60);
      let s = totalSecs % 60;
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
    this.popupProvider.ionicAlert(this.translate.instant('Error'), this.bwcError.msg(err, prefix));
  }

  public sign(): void {
    this.loading = true;
    this.walletProvider.publishAndSign(this.wallet, this.tx).then((txp: any) => {
      this.openSuccessModal();
    }).catch((err: any) => {
      this.setError(err, ('Could not send payment'));
    });
  }

  public reject(txp: any): void {
    let title = this.translate.instant('Warning!');
    let msg = this.translate.instant('Are you sure you want to reject this transaction?');
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return
      this.loading = true;
      this.walletProvider.reject(this.wallet, this.tx).then((txpr) => {
        this.close();
      }).catch((err: any) => {
        this.setError(err, this.translate.instant('Could not reject payment'));
      });
    });
  }

  public remove(): void {
    let title = this.translate.instant('Warning!');
    let msg = this.translate.instant('Are you sure you want to remove this transaction?');
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return;
      this.onGoingProcessProvider.set('removeTx', true);
      this.walletProvider.removeTx(this.wallet, this.tx).then(() => {
        this.onGoingProcessProvider.set('removeTx', false);
        this.close();
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('removeTx', false);
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          this.setError(err, this.translate.instant('Could not delete payment proposal'));
        }
      });
    });
  }

  public broadcast(txp: any): void {
    this.loading = true;
    this.onGoingProcessProvider.set('broadcastingTx', true);
    this.walletProvider.broadcastTx(this.wallet, this.tx).then((txpb: any) => {
      this.onGoingProcessProvider.set('broadcastingTx', false);
      this.openSuccessModal();
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('broadcastingTx', false);
      this.setError(err, 'Could not broadcast payment');
    });
  }

  public getShortNetworkName(): string {
    return this.wallet.credentials.networkName.substring(0, 4);
  }

  private updateTxInfo(eventName: string): void {
    this.walletProvider.getTxp(this.wallet, this.tx.id).then((tx: any) => {
      let action = _.find(tx.actions, {
        copayerId: this.wallet.credentials.copayerId
      });

      this.tx = this.txFormatProvider.processTx(this.wallet.coin, tx);

      if (!action && tx.status == 'pending') this.tx.pendingForUs = true;

      this.updateCopayerList();
      this.initActionList();
    }).catch((err) => {
      if (err.message && err.message == 'Transaction proposal not found' &&
        (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
        this.tx.removed = true;
        this.tx.canBeRemoved = false;
        this.tx.pendingForUs = false;
      }
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

  public onConfirm(): void {
    this.sign();
  };

  public close(): void {
    this.loading = false;
    this.viewCtrl.dismiss();
  }

  public openSuccessModal() {
    let modal = this.modalCtrl.create(SuccessModalPage, {}, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.close();
    })
  }

}
