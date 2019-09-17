import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { ImportWalletPage } from '../../add/import-wallet/import-wallet';
import { CreateWalletPage } from '../create-wallet/create-wallet';

// providers
import {
  BwcErrorProvider,
  Logger,
  OnGoingProcessProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  WalletProvider
} from '../../../providers';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public title: string;
  public coin: string;
  public isOnboardingFlow: boolean;
  public coinsSelected;

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
    private popupProvider: PopupProvider
  ) {
    this.coinsSelected = {
      btc: true,
      bch: false
    };
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.isOnboardingFlow = this.navParam.data.isOnboardingFlow;
    this.title = this.isOnboardingFlow
      ? this.translate.instant('Select currencies')
      : this.translate.instant('Select currency');
  }

  public goToCreateWallet(coin: string): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.navParam.data.isShared,
      coin,
      keyId: this.navParam.data.keyId
    });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public createWallet(coins: string[]): void {
    coins = _.keys(_.pickBy(this.coinsSelected));
    const opts = {
      coin: coins[0]
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
              coin
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
