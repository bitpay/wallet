import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { AddWalletPage } from '../add-wallet/add-wallet';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { JoinWalletPage } from '../add/join-wallet/join-wallet';
import { SelectCurrencyPage } from '../add/select-currency/select-currency';

// providers
import { Logger } from '../../providers';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public allowMultiplePrimaryWallets: boolean;
  public keyId: string;
  public isOnboardingFlow: boolean;
  public isZeroState: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParams: NavParams
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
    this.keyId = this.navParams.data.keyId;
    this.isOnboardingFlow = this.navParams.data.isOnboardingFlow;
    this.isZeroState = this.navParams.data.isZeroState;
  }

  public goToAddWalletPage(
    isShared: boolean,
    isJoin: boolean,
    isCreate: boolean
  ): void {
    if (isCreate) {
      if (this.navParams.data.isMultipleSeed) {
        this.navCtrl.push(AddWalletPage, {
          isCreate,
          isMultipleSeed: true,
          url: this.navParams.data.url
        });
      } else {
        this.navCtrl.push(SelectCurrencyPage, {
          isShared,
          isOnboardingFlow: this.isOnboardingFlow,
          isZeroState: this.isZeroState && !isShared,
          keyId: this.keyId
        });
      }
    } else if (isJoin) {
      this.navCtrl.push(JoinWalletPage, {
        keyId: this.keyId,
        url: this.navParams.data.url
      });
    }
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
