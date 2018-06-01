import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { GlideraProvider } from '../../../providers/glidera/glidera';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
// pages
import { AmountPage } from '../../send/amount/amount';
import { GlideraTxDetailsPage } from './glidera-tx-details/glidera-tx-details';

@Component({
  selector: 'page-glidera',
  templateUrl: 'glidera.html'
})
export class GlideraPage {
  public account: any;
  public tx: any;
  public showOauthForm: boolean;
  public network: string;
  public currency: string;
  public oauthCodeForm: FormGroup;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private glideraProvider: GlideraProvider,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController
  ) {
    this.oauthCodeForm = this.formBuilder.group({
      code: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.network = this.glideraProvider.getNetwork();
    this.currency = this.glideraProvider.getCurrency();
    this.showOauthForm = false;
    this.account = {};
  }

  ionViewDidEnter() {
    if (this.navParams.data && this.navParams.data.code)
      this.submitOauthCode(this.navParams.data.code);
    else this.init();
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private init(): void {
    this.onGoingProcessProvider.set('connectingGlidera');
    this.glideraProvider.init((err, data) => {
      this.onGoingProcessProvider.clear();
      if (err) {
        this.popupProvider.ionicAlert(
          'Error connecting Glidera',
          err + '. Please re-connect to Glidera'
        );
        return;
      }
      if (!data || (data && !data.token)) return;

      this.account.token = data.token;
      this.account.status = data.status;
      this.account.txs = data.txs;
      this.update();
    });
  }

  public update(opts?: any): void {
    this.logger.debug('Updating Glidera...');
    this.glideraProvider.updateStatus(this.account);
  }

  public getAuthenticateUrl(): string {
    return this.glideraProvider.getOauthCodeUrl();
  }

  public submitOauthCode(code?: string): void {
    this.onGoingProcessProvider.set('connectingGlidera');
    this.glideraProvider.authorize(code, (err, data) => {
      this.onGoingProcessProvider.clear();
      if (err) {
        this.popupProvider.ionicAlert('Authorization error', err);
        return;
      }
      this.account.token = data.token;
      this.account.status = data.status;
      this.init();
    });
  }

  public openTxModal(tx) {
    this.tx = tx;

    let modal = this.modalCtrl.create(GlideraTxDetailsPage, { tx: this.tx });
    modal.present();

    this.glideraProvider.getTransaction(
      this.account.token,
      tx.transactionUuid,
      (err, tx) => {
        if (err) {
          this.popupProvider.ionicAlert(
            'Error getting transaction',
            'Could not get transactions'
          );
          return;
        }
        this.tx = tx;
      }
    );
  }

  public openAuthenticateWindow(): void {
    this.openExternalLink(this.getAuthenticateUrl());
    this.navCtrl.popToRoot();
  }

  public openLoginWindow() {
    let glideraUrl =
      this.network === 'testnet'
        ? 'https://sandbox.glidera.io/login'
        : 'https://glidera.io/login';
    this.openExternalLink(glideraUrl);
  }

  public openSupportWindow(): void {
    var url = this.glideraProvider.getSupportUrl();
    var optIn = true;
    var title = 'Glidera Support';
    var message =
      'You can email glidera at support@glidera.io for direct support, or you can contact Glidera on Twitter.';
    var okText = 'Tweet @GlideraInc';
    var cancelText = 'Go Back';
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public toggleOauthForm(): void {
    this.showOauthForm = !this.showOauthForm;
  }

  public goToBuyGlideraPage(): void {
    this.navCtrl.push(AmountPage, {
      nextPage: 'BuyGlideraPage',
      currency: this.currency,
      coin: 'btc',
      fixedUnit: true
    });
  }

  public goToSellGlideraPage(): void {
    this.navCtrl.push(AmountPage, {
      nextPage: 'SellGlideraPage',
      currency: this.currency,
      coin: 'btc',
      fixedUnit: true
    });
  }
}
