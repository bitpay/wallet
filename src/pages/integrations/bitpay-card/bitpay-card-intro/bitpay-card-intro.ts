import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// providers
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ScanProvider } from '../../../../providers/scan/scan';

// pages
import {
  IABCardProvider,
  PersistenceProvider,
  ProfileProvider
} from '../../../../providers';
import { BitPayCardPage } from '../bitpay-card';

@Component({
  selector: 'page-bitpay-card-intro',
  templateUrl: 'bitpay-card-intro.html',
  providers: [ScanProvider]
})
export class BitPayCardIntroPage {
  private scannerHasPermission: boolean;
  public accounts;
  public cardExperimentEnabled: boolean;
  public ready: boolean;
  constructor(
    private translate: TranslateService,
    private actionSheetCtrl: ActionSheetController,
    private navParams: NavParams,
    private bitPayAccountProvider: BitPayAccountProvider,
    private popupProvider: PopupProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider,
    private persistenceProvider: PersistenceProvider,
    private iabCardProvider: IABCardProvider,
    private profileProvider: ProfileProvider,
    private scanProvider: ScanProvider
  ) {
    this.scannerHasPermission = false;
    this.updateCapabilities();
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      this.cardExperimentEnabled = status === 'enabled';
    });
  }

  ionViewWillEnter() {
    if (this.navParams.data.secret) {
      let pairData = {
        secret: this.navParams.data.secret,
        email: this.navParams.data.email,
        otp: this.navParams.data.otp
      };
      let pairingReason = this.translate.instant(
        'add your BitPay Visa card(s)'
      );
      this.bitPayAccountProvider.pair(
        pairData,
        pairingReason,
        (err: string, paired: boolean, apiContext) => {
          if (err) {
            this.popupProvider.ionicAlert(
              this.translate.instant('Error pairing BitPay Account'),
              err
            );
            return;
          }
          if (paired) {
            this.bitPayCardProvider.sync(apiContext, (err, cards) => {
              if (err) {
                this.popupProvider.ionicAlert(
                  this.translate.instant('Error updating Debit Cards'),
                  err
                );
                return;
              }

              // Fixes mobile navigation
              setTimeout(() => {
                if (cards[0]) {
                  this.navCtrl
                    .push(
                      BitPayCardPage,
                      { id: cards[0].id },
                      { animate: false }
                    )
                    .then(() => {
                      let previousView = this.navCtrl.getPrevious();
                      this.navCtrl.removeView(previousView);
                    });
                }
              }, 200);
            });
          }
        }
      );
    }

    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        return;
      }
      this.accounts = accounts;
    });

    if (!this.scannerHasPermission) {
      this.authorizeCamera();
    }
  }

  ionViewDidEnter() {
    this.iabCardProvider.updateWalletStatus();
    this.bitPayCardProvider.logEvent('legacycard_view_setup', {});
    this.ready = true;
  }

  private updateCapabilities(): void {
    const capabilities = this.scanProvider.getCapabilities();
    this.scannerHasPermission = capabilities.hasPermission;
  }

  private authorizeCamera(): void {
    this.scanProvider
      .initialize() // prompt for authorization by initializing scanner
      .then(() => this.scanProvider.pausePreview()) // release camera resources from scanner
      .then(() => this.updateCapabilities()); // update component state
  }

  public openExchangeRates() {
    let url = 'https://bitpay.com/exchange-rates';
    this.externalLinkProvider.open(url);
  }

  public bitPayCardInfo() {
    let url = 'https://bitpay.com/visa/faq';
    this.externalLinkProvider.open(url);
  }

  public async orderBitPayCard() {
    this.iabCardProvider.loadingWrapper(async () => {
      const hasWalletWithFunds = this.profileProvider.hasWalletWithFunds(
        12,
        'USD'
      );

      const hasFirstView = await this.iabCardProvider.hasFirstView();

      if (!hasWalletWithFunds && !hasFirstView) {
        this.iabCardProvider.show();
        this.iabCardProvider.sendMessage(
          {
            message: 'needFunds'
          },
          () => {}
        );
        return;
      }

      this.iabCardProvider.show();
      this.iabCardProvider.sendMessage(
        {
          message: 'orderCard'
        },
        () => {}
      );
      setTimeout(() => {
        this.navCtrl.pop();
      }, 300);
    });
  }

  public connectBitPayCard() {
    this.bitPayCardProvider.logEvent('legacycard_connect', {});
    if (this.accounts.length == 0) {
      this.startPairBitPayAccount();
    } else {
      this.showAccountSelector();
    }
  }

  private startPairBitPayAccount() {
    this.navCtrl.popToRoot({ animate: false }); // Back to Root
    let url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }

  private showAccountSelector() {
    let options = [];

    _.forEach(this.accounts, account => {
      options.push({
        text:
          (account.givenName || account.familyName) +
          ' (' +
          account.email +
          ')',
        handler: () => {
          this.onAccountSelect(account);
        }
      });
    });

    // Add account
    options.push({
      text: this.translate.instant('Add account'),
      handler: () => {
        this.onAccountSelect();
      }
    });

    // Cancel
    options.push({
      text: this.translate.instant('Cancel'),
      role: 'cancel'
    });

    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('From BitPay account'),
      buttons: options
    });
    actionSheet.present();
  }

  private onAccountSelect(account?): void {
    if (_.isUndefined(account)) {
      this.startPairBitPayAccount();
    } else {
      this.bitPayCardProvider.sync(account.apiContext, err => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        }
        this.navCtrl.pop();
      });
    }
  }
}
