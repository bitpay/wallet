import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../../environments';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BitPayProvider } from '../../../providers/bitpay/bitpay';
import { BuyCryptoProvider } from '../../../providers/buy-crypto/buy-crypto';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

// Pages
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { CountrySelectorPage } from '../../../pages/buy-crypto/country-selector/country-selector';
import { CryptoCoinSelectorPage } from '../../../pages/buy-crypto/crypto-coin-selector/crypto-coin-selector';
import { CryptoOffersPage } from '../../../pages/buy-crypto/crypto-offers/crypto-offers';
import { CryptoPaymentMethodPage } from '../../../pages/buy-crypto/crypto-payment-method/crypto-payment-method';
import { AmountPage } from '../../../pages/send/amount/amount';
import { WalletDetailsPage } from '../../wallet-details/wallet-details';

@Component({
  selector: 'page-crypto-order-summary',
  templateUrl: 'crypto-order-summary.html'
})
export class CryptoOrderSummaryPage {
  private wallets: any[];
  public wallet: any;
  public walletId: any;
  public coin: string;
  public paymentMethod: any;
  public country: string;
  public currency: string;
  public amount: any;
  public address: string;
  public countryList: any[] = [];
  public selectedCountry;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private bitPayProvider: BitPayProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private errorsProvider: ErrorsProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.coin = this.navParams.data.coin;

    if (this.navParams.data.walletId) {
      this.setWallet(this.navParams.data.walletId);
    } else {
      const supportedCoins = this.buyCryptoProvider.exchangeCoinsSupported;
      // Select first available wallet
      this.wallets = this.profileProvider.getWallets({
        network: env.name == 'development' ? null : 'livenet',
        onlyComplete: true,
        coin:
          this.coin && supportedCoins.includes(this.coin)
            ? this.coin
            : supportedCoins,
        backedUp: true
      });
      if (this.wallets[0]) {
        this.logger.debug(
          'Setting wallet to deposit funds: ' +
            this.wallets[0].credentials.walletId
        );
        this.setWallet(this.wallets[0].credentials.walletId);
      } else {
        this.logger.debug('No wallets available to deposit funds.');
        const walletsGroups = this.profileProvider.orderedWalletsByGroup;

        this.errorsProvider.showNoWalletError(
          this.coin ? this.coin.toUpperCase() : null,
          option => {
            // Single seed case:
            let data;
            if (walletsGroups.length == 1 && walletsGroups[0][0]) {
              data = {
                keyId: walletsGroups[0][0].credentials.keyId
              };
            }

            if (option) {
              this.navCtrl.push(SelectCurrencyPage, data);
            }
          }
        );
      }
    }

    if (this.navParams.data.paymentMethod) {
      this.paymentMethod = this.navParams.data.paymentMethod;
    } else {
      this.logger.debug('No payment method selected. Setting to default.');
      this.setDefaultPaymentMethod();
    }

    this.persistenceProvider.getLastCountryUsed().then(lastUsedCountry => {
      if (lastUsedCountry && _.isObject(lastUsedCountry)) {
        this.selectedCountry = lastUsedCountry;
      } else {
        this.selectedCountry = {
          name: 'United States',
          phonePrefix: '+1',
          shortCode: 'US',
          threeLetterCode: 'USA'
        };
      }
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoOrderSummaryPage');
  }

  ionViewWillEnter() {
    this.persistenceProvider.getCountries().then(data => {
      if (data) {
        this.countryList = data;
      } else {
        this.bitPayProvider.get(
          '/countries',
          ({ data }) => {
            this.persistenceProvider.setCountries(data);
            this.countryList = data;
          },
          () => {}
        );
      }
    });
  }

  private setWallet(walletId): void {
    this.walletId = walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      this.address = addr;
    });
  }

  public openAmountModal() {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        fromBuyCrypto: true,
        walletId: this.walletId,
        coin: this.coin,
        useAsModal: true,
        currency: this.currency
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.amount = data.fiatAmount;
        this.currency = data.currency;
        this.checkPaymentMethod();
      }
    });
  }

  public openCryptoCoinSelectorModal() {
    let modal = this.modalCtrl.create(
      CryptoCoinSelectorPage,
      {
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.coin = data.coin;
        this.setWallet(data.walletId);
        this.checkPaymentMethod();
      }
    });
  }

  public openCountrySelectorModal() {
    let modal = this.modalCtrl.create(
      CountrySelectorPage,
      {
        countryList: this.countryList,
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.selectedCountry = data.selectedCountry;
        this.checkPaymentMethod();
      }
    });
  }

  private setDefaultPaymentMethod() {
    this.paymentMethod = this.platformProvider.isIOS
      ? this.buyCryptoProvider.paymentMethodsAvailable.applePay
      : this.buyCryptoProvider.paymentMethodsAvailable.debitCard;
  }

  private checkPaymentMethod() {
    if (
      this.paymentMethod.method == 'sepaBankTransfer' &&
      !this.selectedCountry.EUCountry
    ) {
      this.setDefaultPaymentMethod();
      this.showPaymentMethodWarning('country');
      return;
    }
    if (
      this.buyCryptoProvider.isPaymentMethodSupported(
        'simplex',
        this.paymentMethod,
        this.coin,
        this.currency
      ) ||
      this.buyCryptoProvider.isPaymentMethodSupported(
        'wyre',
        this.paymentMethod,
        this.coin,
        this.currency
      )
    ) {
      this.logger.debug(
        `Payment methods available for ${this.coin} and ${this.currency}`
      );
      return;
    } else {
      this.logger.debug(
        `No payment methods available for ${this.coin} and ${this.currency}. Show warning.`
      );
      this.setDefaultPaymentMethod();
      this.showPaymentMethodWarning('coin');
    }
  }

  private showPaymentMethodWarning(reason: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'payment-method-changed',
      {
        coin: this.coin,
        currency: this.currency,
        reason
      }
    );
    infoSheet.present();
  }

  public openCryptoPaymentMethodModal() {
    let modal = this.modalCtrl.create(
      CryptoPaymentMethodPage,
      {
        paymentMethod: this.paymentMethod.method,
        useAsModal: true,
        coin: this.coin,
        selectedCountry: this.selectedCountry,
        currency: this.currency
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.paymentMethod = data.paymentMethod;
      }
    });
  }

  public goToCryptoOffersPage() {
    const params = {
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      coin: this.coin,
      walletId: this.walletId,
      selectedCountry: this.selectedCountry
    };
    this.navCtrl.push(CryptoOffersPage, params);
  }

  public getDigitsInfo(currency: string) {
    if (!this.coin || this.coin.toUpperCase() === currency) return '';
    else return '1.2-2';
  }

  public goToCoinSelector(): void {
    this.navCtrl.push(CryptoCoinSelectorPage);
  }

  public cancelOrder() {
    this.navCtrl.popToRoot().then(_ => {
      if (!this.navParams.data.walletId) return;
      this.navCtrl.push(WalletDetailsPage, {
        walletId: this.wallet.credentials.walletId
      });
    });
  }
}
