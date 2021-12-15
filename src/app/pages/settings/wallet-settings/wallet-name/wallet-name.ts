import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../../providers/logger/logger';

// services
import { ConfigProvider } from '../../../../providers/config/config';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
@Component({
  selector: 'page-wallet-name',
  templateUrl: 'wallet-name.html',
  styleUrls: ['wallet-name.scss']
})
export class WalletNamePage {
  public wallet;
  public walletName: string;
  public walletNameForm: FormGroup;
  public description: string;
  navParamsData;
  private config;

  constructor(
    private profileProvider: ProfileProvider,
    private router: Router,
    private configProvider: ConfigProvider,
    private formBuilder: FormBuilder,
    private events: EventManagerService,
    private logger: Logger,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService,
    private location: Location,
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.walletNameForm = this.formBuilder.group({
      walletName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ngOnInit(){
    this.logger.info('Loaded: WalletNamePage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
    this.config = this.configProvider.get();
    let alias =
      this.config.aliasFor &&
      this.config.aliasFor[this.wallet.credentials.walletId];
    this.walletNameForm.value.walletName = alias
      ? alias
      : this.wallet.credentials.walletName;
    this.walletName = this.wallet.credentials.walletName;
    this.description = this.replaceParametersProvider.replace(
      this.translate.instant(
        'When this wallet was created, it was called "{{walletName}}". You can change the name displayed on this device below.'
      ),
      { walletName: this.walletName }
    );
  }

  public save(): void {
    let opts = {
      aliasFor: {}
    };
    opts.aliasFor[
      this.wallet.credentials.walletId
    ] = this.walletNameForm.value.walletName;
    this.configProvider.set(opts);
    this.events.publish('Local/ConfigUpdate', {
      walletId: this.wallet.credentials.walletId
    });
    this.profileProvider.setOrderedWalletsByGroup();
    this.location.back(); 
  }
}
