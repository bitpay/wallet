import { Component } from '@angular/core';

// providers
import { AppProvider, ConfigProvider, Logger } from '../../../providers';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html'
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
  public allowMultiplePrimaryWallets: boolean;
  public isCopay: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private appProvider: AppProvider
  ) {
    this.isCopay = this.appProvider.info.name === 'copay';
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AdvancedPage');
  }

  ionViewWillEnter() {
    let config = this.configProvider.get();

    this.spendUnconfirmed = config.wallet.spendUnconfirmed;
    this.allowMultiplePrimaryWallets = config.allowMultiplePrimaryWallets;
  }

  public spendUnconfirmedChange(): void {
    let opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
  }
  public allowMultiplePrimaryWalletsChange(): void {
    let opts = {
      allowMultiplePrimaryWallets: this.allowMultiplePrimaryWallets
    };
    this.configProvider.set(opts);
  }
}
