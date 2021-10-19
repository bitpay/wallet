import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';
import * as moment from 'moment';

// providers
// pages
import { IABCardProvider, PersistenceProvider } from '../../../../providers';
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Network } from '../../../../providers/persistence/persistence';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ScanProvider } from '../../../../providers/scan/scan';
import { ThemeProvider } from '../../../../providers/theme/theme';
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
  public bitPayIdConnected: boolean;
  public terms: string = 'limits';
  public feeTerms: Array<{
    title: string;
    note: string;
    linkText?: string;
    linkUrl?: string;
  }>;
  public limitTerms: Array<{ title: string; note: string }>;

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
    private scanProvider: ScanProvider,
    private themeProvider: ThemeProvider
  ) {
    this.scannerHasPermission = false;
    this.updateCapabilities();
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      this.cardExperimentEnabled = status === 'enabled';
    });

    this.limitTerms = [
      {
        title: this.translate.instant('Cash Withdrawal (ATM & bank teller)'),
        note: this.translate.instant(
          '$2,000 per withdrawal, 3 withdrawals per day, $25,000 per month'
        )
      },
      {
        title: this.translate.instant('Load Limits'),
        note: this.translate.instant('$10,000 per day')
      },
      {
        title: this.translate.instant('Spending Limits'),
        note: this.translate.instant('$10,000 per day')
      },
      {
        title: this.translate.instant('Maximum Balance'),
        note: '$25,000'
      }
    ];

    this.feeTerms = [
      {
        title: this.translate.instant('Virtual Card Issuance and Replacement'),
        note: '$0.00'
      },
      {
        title: this.translate.instant('Physical Card Issuance'),
        note: '$10.00'
      },
      {
        title: this.translate.instant('Physical Card Replacement'),
        note: '$10.00'
      },
      {
        title: this.translate.instant('Monthly Fee'),
        note: '$0.00'
      },
      {
        title: this.translate.instant(
          'Cash Withdrawal Fee (ATM or Inside Financial Institution) Physical Card Only'
        ),
        note: '$2.50'
      },
      {
        title: this.translate.instant('Card Load'),
        note: this.translate.instant('No conversion fee'),
        linkText: this.translate.instant('Network and miner fees may apply'),
        linkUrl:
          'https://support.bitpay.com/hc/en-us/articles/115003393863-What-are-bitcoin-miner-fees-'
      },
      {
        title: this.translate.instant('International Currency Conversion'),
        note: '3%'
      },
      {
        title: this.translate.instant('Inactivity Fee'),
        note: this.translate.instant(
          '$5 per month after 90 days with no transactions'
        )
      }
    ];
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
    this.persistenceProvider
      .getBitPayIdPairingToken(Network.livenet)
      .then(token => (this.bitPayIdConnected = !!token));

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

  public async orderBitPayCard(path?: 'login' | 'createAccount') {
    let url = `https://bitpay.com/wallet-card?context=${path}`;

    if (this.themeProvider.isDarkModeEnabled()) {
      url += '&darkMode=true';
    }

    if (this.bitPayIdConnected) {
      const user = await this.persistenceProvider.getBitPayIdUserInfo(
        Network.livenet
      );
      url += `&email=${user.email}`;
    }

    const now = moment().unix();
    this.persistenceProvider.setBitPayCardOrderStarted(now);

    this.iabCardProvider.loadingWrapper(() => {
      this.externalLinkProvider.open(url);
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

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
