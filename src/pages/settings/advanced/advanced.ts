import { Component } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// providers
import {
  AppProvider,
  ConfigProvider,
  Logger,
  PlatformProvider,
  PopupProvider,
  ProfileProvider
} from '../../../providers';
import { WalletRecoverPage } from './wallet-recover-page/wallet-recover-page';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html'
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
  public isCopay: boolean;
  public oldProfileAvailable: boolean;
  public wallets;

  constructor(
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
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

  public openWalletRecoveryPage() {
    this.navCtrl.push(WalletRecoverPage);
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
