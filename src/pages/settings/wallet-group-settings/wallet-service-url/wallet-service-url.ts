import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// native
import { SplashScreen } from '@ionic-native/splash-screen';

// providers
import { AppProvider } from '../../../../providers/app/app';
import { ConfigProvider } from '../../../../providers/config/config';
import { Logger } from '../../../../providers/logger/logger';
import { PersistenceProvider } from '../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-wallet-service-url',
  templateUrl: 'wallet-service-url.html'
})
export class WalletServiceUrlPage {
  public success: boolean = false;
  public walletGroupId;
  public comment: string;
  public walletServiceForm: FormGroup;
  private config;
  private defaults;
  private wallets;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private app: AppProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private formBuilder: FormBuilder,
    private events: Events,
    private splashScreen: SplashScreen,
    private platformProvider: PlatformProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) {
    this.walletServiceForm = this.formBuilder.group({
      bwsurl: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletServiceUrlPage');
  }

  async ionViewWillEnter() {
    this.walletGroupId = this.navParams.data.walletGroupId;
    this.wallets = await this.profileProvider.getGroupWallets(
      this.walletGroupId
    );
    this.defaults = this.configProvider.getDefaults();
    this.config = this.configProvider.get();
    let appName = this.app.info.nameCase;
    this.comment = this.replaceParametersProvider.replace(
      this.translate.instant(
        "{{appName}} depends on Bitcore Wallet Service (BWS) for blockchain information, networking and Copayer synchronization. The default configuration points to https://bws.bitpay.com (BitPay's public BWS instance)."
      ),
      { appName }
    );
    this.walletServiceForm.value.bwsurl =
      (this.config.bwsFor &&
        this.config.bwsFor[this.wallets[0].credentials.walletId]) ||
      this.defaults.bws.url;
  }

  public resetDefaultUrl(): void {
    this.walletServiceForm.value.bwsurl = this.defaults.bws.url;
  }

  public save() {
    this.wallets.forEach(wallet => {
      this._save(wallet);
    });
    this.navCtrl.popToRoot().then(() => {
      this.reload();
    });
  }

  public _save(wallet): void {
    let bws;
    switch (this.walletServiceForm.value.bwsurl) {
      case 'prod':
      case 'production':
        bws = 'https://bws.bitpay.com/bws/api';
        break;
      case 'sta':
      case 'staging':
        bws = 'https://bws-staging.b-pay.net/bws/api';
        break;
      case 'loc':
      case 'local':
        bws = 'http://localhost:3232/bws/api';
        break;
    }
    if (bws) {
      this.logger.info('Using BWS URL Alias to ' + bws);
      this.walletServiceForm.value.bwsurl = bws;
    }

    let opts = {
      bwsFor: {}
    };
    opts.bwsFor[
      wallet.credentials.walletId
    ] = this.walletServiceForm.value.bwsurl;

    this.configProvider.set(opts);
    this.persistenceProvider.setCleanAndScanAddresses(
      wallet.credentials.walletId
    );
    this.events.publish('Local/ConfigUpdate', {
      walletId: wallet.credentials.walletId
    });
  }

  private reload(): void {
    window.location.reload();
    if (this.platformProvider.isCordova) this.splashScreen.show();
  }
}
