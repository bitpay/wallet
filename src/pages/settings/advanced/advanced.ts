import { Component } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';

//providers
import { ConfigProvider } from '../../../providers/config/config';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html'
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
  public recentTransactionsEnabled: boolean;
  public useLegacyAddress: boolean;

  constructor(private configProvider: ConfigProvider, private logger: Logger) {}

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AdvancedPage');
  }

  public ionViewWillEnter() {
    const config: any = this.configProvider.get();

    this.spendUnconfirmed = config.wallet.spendUnconfirmed;
    this.recentTransactionsEnabled = config.recentTransactions.enabled;
    this.useLegacyAddress = config.wallet.useLegacyAddress;
  }

  public spendUnconfirmedChange(): void {
    const opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
  }

  public recentTransactionsChange(): void {
    const opts = {
      recentTransactions: {
        enabled: this.recentTransactionsEnabled
      }
    };
    this.configProvider.set(opts);
  }

  public useLegacyAddressChange(): void {
    const opts = {
      wallet: {
        useLegacyAddress: this.useLegacyAddress
      }
    };
    this.configProvider.set(opts);
  }
}
