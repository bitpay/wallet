import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../../../providers/logger/logger';

// native
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

// services
import env from '../../../../../../environments';
import { AppProvider } from '../../../../../providers/app/app';
import { ConfigProvider } from '../../../../../providers/config/config';
import { PersistenceProvider } from '../../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../../providers/platform/platform';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../../providers/replace-parameters/replace-parameters';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';

@Component({
  selector: 'page-wallet-service-url',
  templateUrl: 'wallet-service-url.html',
  styleUrls: ['wallet-service-url.scss']
})
export class WalletServiceUrlPage {
  public success: boolean = false;
  public wallet;
  public comment: string;
  public walletServiceForm: FormGroup;
  private config;
  private defaults;
  navParamsData;

  constructor(
    private profileProvider: ProfileProvider,
    private router: Router,
    private configProvider: ConfigProvider,
    private app: AppProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private formBuilder: FormBuilder,
    private events: EventManagerService,
    private splashScreen: SplashScreen,
    private platformProvider: PlatformProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.walletServiceForm = this.formBuilder.group({
      bwsurl: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ngOnInit(){
    this.logger.info('Loaded:  WalletServiceUrlPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
    this.defaults = this.configProvider.getDefaults();
    this.config = this.configProvider.get();
    let appName = this.app.info.nameCase;
    this.comment = this.replaceParametersProvider.replace(
      this.translate.instant(
        "{{appName}} depends on AbcPros Wallet Service (AWS) for blockchain information, networking and Copayer synchronization. The default configuration points to https://aws.abcpay.cash (AbcPros's public AWS instance)."
      ),
      { appName }
    );
    this.walletServiceForm.value.bwsurl =
      (this.config.bwsFor &&
        this.config.bwsFor[this.wallet.credentials.walletId]) ||
      this.defaults.bws.url;
  }

  public resetDefaultUrl(): void {
    this.walletServiceForm.value.bwsurl = this.defaults.bws.url;
  }

  public save(): void {
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
		bws = env.awsUrl;
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
      this.wallet.credentials.walletId
    ] = this.walletServiceForm.value.bwsurl;

    this.configProvider.set(opts);
    this.persistenceProvider.setCleanAndScanAddresses(
      this.wallet.credentials.walletId
    );
    this.events.publish('Local/ConfigUpdate', {
      walletId: this.wallet.credentials.walletId
    });
    this.router.navigate(['']).then(() => {
      this.reload();
    });
  }

  private reload(): void {
    window.location.reload();
    if (this.platformProvider.isCordova) this.splashScreen.show();
  }
}
