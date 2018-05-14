import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-wallet-name',
  templateUrl: 'wallet-name.html',
})
export class WalletNamePage {

  public wallet: any;
  public walletName: string;
  public walletNameForm: FormGroup;
  public description: string;

  private config: any;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private formBuilder: FormBuilder,
    private events: Events,
    private logger: Logger,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) {
    this.walletNameForm = this.formBuilder.group({
      walletName: ['', Validators.compose([Validators.minLength(1), Validators.required])]
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletNamePage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.config = this.configProvider.get();
    let alias = this.config.aliasFor && this.config.aliasFor[this.wallet.credentials.walletId];
    this.walletNameForm.value.walletName = alias ? alias : this.wallet.credentials.walletName;
    this.walletName = this.wallet.credentials.walletName;
    this.description = this.replaceParametersProvider.replace(this.translate.instant('When this wallet was created, it was called "{{walletName}}". You can change the name displayed on this device below.'), { walletName: this.walletName });
  }

  public save(): void {
    let opts = {
      aliasFor: {}
    };
    opts.aliasFor[this.wallet.credentials.walletId] = this.walletNameForm.value.walletName;
    this.configProvider.set(opts);
    this.events.publish('wallet:updated', this.wallet.credentials.walletId);
    this.navCtrl.pop();
  }
}