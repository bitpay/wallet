import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { AppProvider } from 'src/app/providers/app/app';
import { ConfigProvider } from 'src/app/providers/config/config';
import { Logger } from 'src/app/providers/logger/logger';
import { PlatformProvider } from 'src/app/providers/platform/platform';
import { PopupProvider } from 'src/app/providers/popup/popup';
import { ProfileProvider } from 'src/app/providers/profile/profile';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html',
  styleUrls: ['advanced.scss']
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
  public isCopay: boolean;
  public oldProfileAvailable: boolean;
  public wallets;

  constructor(
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider,
    private router: Router,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private splashScreen: SplashScreen,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private appProvider: AppProvider
  ) {
    this.isCopay = this.appProvider.info.name === 'copay';
    this.profileProvider
      .getProfileLegacy()
      .then(oldProfile => {
        this.oldProfileAvailable = oldProfile ? true : false;
        if (!this.oldProfileAvailable) return;
        this.wallets = _.filter(oldProfile.credentials, value => {
          return value && (value.mnemonic || value.mnemonicEncrypted);
        });
      })
      .catch(err => {
        this.oldProfileAvailable = false;
        this.logger.info('Error retrieving old profile, ', err);
      });
  }

  ngOnInit(){
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

  public openWalletRecoveryPage() {
    this.router.navigate(['/WalletRecoverPage']);
  }

  public resetAllSettings() {
    const title = this.translate.instant('Reset All Settings');
    const message = this.translate.instant(
      'Do you want to reset all settings to default value?'
    );
    this.popupProvider.ionicConfirm(title, message).then(ok => {
      if (!ok) return;
      this.configProvider.reset();
      window.location.reload();
      if (this.platformProvider.isCordova) this.splashScreen.show();
    });
  }
}