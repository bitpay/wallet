import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { ImportWalletPage } from '../../add/import-wallet/import-wallet';
import { WalletGroupOnboardingPage } from '../../settings/wallet-group-settings/wallet-group-onboarding/wallet-group-onboarding';
import { CreateWalletPage } from '../create-wallet/create-wallet';

// providers
import {
  BwcErrorProvider,
  Logger,
  OnGoingProcessProvider,
  PersistenceProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  WalletProvider
} from '../../../providers';
import { UTXO_COINS } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  private showKeyOnboarding: boolean;

  public title: string;
  public coin: string;
  public coinsSelected;
  public isOnboardingFlow: boolean;
  public isZeroState: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private events: Events,
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private persistenceProvider: PersistenceProvider
  ) {
    this.coinsSelected = {
      btc: true,
      bch: true,
      eth: true
    };
    this.shouldShowKeyOnboarding();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.isOnboardingFlow = this.navParam.data.isOnboardingFlow;
    this.isZeroState = this.navParam.data.isZeroState;
    this.title = this.isZeroState
      ? this.translate.instant('Select currencies')
      : this.translate.instant('Select currency');
  }

  private shouldShowKeyOnboarding() {
    this.persistenceProvider.getKeyOnboardingFlag().then(value => {
      if (!value) {
        this.showKeyOnboarding = true;
        const wallets = this.profileProvider.getWallets();
        const walletsGroups = _.values(_.groupBy(wallets, 'keyId'));
        walletsGroups.forEach((walletsGroup: any) => {
          if (walletsGroup[0].canAddNewAccount) this.showKeyOnboarding = false;
        });
      } else {
        this.showKeyOnboarding = false;
      }
    });
  }

  private showKeyOnboardingSlides(coins: string[]) {
    this.logger.debug('Showing key onboarding');
    const modal = this.modalCtrl.create(WalletGroupOnboardingPage, null, {
      showBackdrop: false,
      enableBackdropDismiss: false
    });
    modal.present();
    modal.onDidDismiss(() => {
      this._createWallet(coins);
    });
    this.persistenceProvider.setKeyOnboardingFlag();
  }

  public goToCreateWallet(coin: string): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.navParam.data.isShared,
      coin,
      keyId: this.navParam.data.keyId,
      showKeyOnboarding: this.showKeyOnboarding
    });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public createWallet(coins: string[]): void {
    if (this.showKeyOnboarding) {
      this.showKeyOnboardingSlides(coins);
      return;
    }
    this._createWallet(coins);
  }

  private _createWallet(coins: string[]): void {
    coins = _.keys(_.pickBy(this.coinsSelected));
    const opts = {
      coin: coins[0],
      singleAddress: UTXO_COINS[coins[0].toUpperCase()] ? false : true
    };
    this.onGoingProcessProvider.set('creatingWallet');
    this.createDefaultWallet(false, opts)
      .then(wallet => {
        if (coins.length === 1) this.endProcess(wallet);
        else {
          const promises = [];
          const keyId = wallet.credentials.keyId;
          coins.slice(1).forEach(coin => {
            const opts = {
              keyId,
              coin,
              singleAddress: UTXO_COINS[coin.toUpperCase()] ? false : true
            };
            promises.push(this.createDefaultWallet(true, opts));
          });
          Promise.all(promises)
            .then(wallets =>
              wallets.forEach(wallet => {
                this.endProcess(wallet);
              })
            )
            .catch(err => this.showError(err));
        }
      })
      .catch(err => this.showError(err));
  }

  private createDefaultWallet(addingNewWallet, opts) {
    return this.profileProvider.createDefaultWallet(addingNewWallet, opts);
  }

  private showError(err) {
    this.onGoingProcessProvider.clear();
    if (
      err &&
      err.message != 'FINGERPRINT_CANCELLED' &&
      err.message != 'PASSWORD_CANCELLED'
    ) {
      this.logger.error('Create: could not create wallet', err);
      const title = this.translate.instant('Error');
      err = this.bwcErrorProvider.msg(err);
      this.popupProvider.ionicAlert(title, err);
    }
    return;
  }

  private endProcess(wallet) {
    this.walletProvider.updateRemotePreferences(wallet);
    this.pushNotificationsProvider.updateSubscription(wallet);
    this.onGoingProcessProvider.clear();
    this.navCtrl.popToRoot().then(() => {
      this.events.publish('Local/WalletListChange');
    });
  }
}
