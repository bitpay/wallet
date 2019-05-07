import { Component } from '@angular/core';

// providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html'
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
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
  }

  public spendUnconfirmedChange(): void {
    let opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
  }
}
