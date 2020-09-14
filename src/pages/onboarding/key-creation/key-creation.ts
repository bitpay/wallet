import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { ImportWalletPage } from '../../../pages/add/import-wallet/import-wallet';
import { LockMethodPage } from '../../../pages/onboarding/lock-method/lock-method';

@Component({
  selector: 'page-key-creation',
  templateUrl: 'key-creation.html'
})
export class KeyCreationPage {
  public appName: string;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private appProvider: AppProvider
  ) {
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: KeyCreationPage');
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage, {
      isOnboardingFlow: true,
      isZeroState: true
    });
  }

  public goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: {
        isOnboardingFlow: true,
        isZeroState: true
      }
    };
    this.navCtrl.push(LockMethodPage, { nextView });
  }
}
