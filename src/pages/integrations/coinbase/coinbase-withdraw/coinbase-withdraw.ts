import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { WalletProvider } from '../../../../providers/wallet/wallet';

// pages
import { FinishModalPage } from '../../../finish/finish';
import { CoinbaseAccountPage } from '../../coinbase/coinbase-account/coinbase-account';

@Component({
  selector: 'page-coinbase-withdraw',
  templateUrl: 'coinbase-withdraw.html'
})
export class CoinbaseWithdrawPage {
  @ViewChild('slideButton')
  slideButton;

  private accountId: string;

  public hideSlideButton: boolean;
  public data: object = {};
  public amount: string;
  public currency: string;
  public description: string;
  public destinationTag: number;

  public wallet;
  public address: string;

  public buttonText: string;

  // Platform info
  public isCordova: boolean;

  constructor(
    private logger: Logger,
    private coinbaseProvider: CoinbaseProvider,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
    this.hideSlideButton = false;

    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.description = this.navParams.data.description;

    this.accountId = this.navParams.data.id;
    this.coinbaseProvider.getAccount(this.accountId, this.data);

    this.wallet = this.profileProvider.getWallet(
      this.navParams.data.toWalletId
    );

    this.buttonText = this.isCordova
      ? this.translate.instant('Slide to withdraw')
      : this.translate.instant('Click to withdraw');
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CoinbaseWithdrawPage');
    this.navCtrl.swipeBackEnabled = false;
    if (this.isCordova) {
      window.addEventListener('keyboardWillShow', () => {
        this.hideSlideButton = true;
      });

      window.addEventListener('keyboardWillHide', () => {
        this.hideSlideButton = false;
      });
    }
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    if (_.isEmpty(this.wallet)) {
      this.showErrorAndBack(this.translate.instant('No wallet found'));
      return;
    }

    this.walletProvider.getAddress(this.wallet, false).then(address => {
      this.address = address;
    });
  }

  private showErrorAndBack(err): void {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider
      .ionicAlert(this.translate.instant('Error'), err)
      .then(() => {
        this.navCtrl.pop();
      });
  }

  public showError(err): void {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
  }

  public approve(): void {
    const tx = {
      to: this.address,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      destination_tag: this.destinationTag
    };
    this._sendTransaction(tx);
  }

  private _sendTransaction(tx, code?): void {
    this.onGoingProcessProvider.set('sendingTx');
    this.coinbaseProvider
      .sendTransaction(this.accountId, tx, code)
      .then(data => {
        this.onGoingProcessProvider.clear();
        this.logger.info(data.data);
        this.coinbaseProvider.logEvent({
          method: 'withdraw',
          amount: tx.amount,
          currency: tx.currency
        });
        this.openFinishModal();
      })
      .catch(e => {
        this.onGoingProcessProvider.clear();
        if (e == '2fa') {
          const message = this.translate.instant('Enter 2-step verification');
          const opts = {
            type: 'number',
            enableBackdropDismiss: false
          };
          this.popupProvider.ionicPrompt(null, message, opts).then(res => {
            if (res === null) {
              this.showErrorAndBack(
                this.translate.instant('Missing 2-step verification')
              );
              return;
            }
            this._sendTransaction(tx, res);
          });
        } else {
          this.showErrorAndBack(e);
        }
      });
  }

  public openFinishModal() {
    const finishText = this.translate.instant('Withdraw success');
    const finishComment = this.translate.instant(
      'It could take a while to confirm transaction'
    );
    const modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, finishComment },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(_ => {
      this.navCtrl.popToRoot({ animate: false }).then(_ => {
        this.navCtrl.parent.select(1);
        this.navCtrl.push(
          CoinbaseAccountPage,
          {
            id: this.accountId
          },
          { animate: false }
        );
      });
    });
  }
}
