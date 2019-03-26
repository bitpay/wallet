import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { JoinWalletPage } from './join-wallet/join-wallet';
import { SelectCurrencyPage } from './select-currency/select-currency';

// providers
import { AppProvider } from '../../providers/app/app';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { Logger } from '../../providers/logger/logger';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public showBitpayCardGetStarted: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private appProvider: AppProvider
  ) {
    // Show integrations
    const integrations = _.filter(this.homeIntegrationsProvider.get(), {
      show: true
    }).filter(i => i.name !== 'debitcard');
    const isLinked = integrations[0].linked ? true : false;

    const isShownInHome = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );

    const isAvailable = this.appProvider.info._enabledExtensions.debitcard
      ? true
      : false;

    if (!isShownInHome && isAvailable && !isLinked) {
      this.showBitpayCardGetStarted = true;
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToSelectCurrencyPage(isShared: boolean, nextPage: string): void {
    this.navCtrl.push(SelectCurrencyPage, { isShared, nextPage });
  }

  public goToJoinWallet(): void {
    this.navCtrl.push(JoinWalletPage);
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }
}
