import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-name',
  templateUrl: 'wallet-name.html'
})
export class WalletNamePage {
  public walletGroup;
  public walletName: string;
  public walletNameForm: FormGroup;
  public description: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private logger: Logger
  ) {
    this.walletNameForm = this.formBuilder.group({
      walletName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletNamePage');
  }

  async ionViewWillEnter() {
    this.walletGroup = await this.profileProvider.getWalletGroup(
      this.navParams.data.walletGroupId
    );
    this.walletNameForm.controls['walletName'].setValue(this.walletGroup.name);
  }

  public save(): void {
    this.walletGroup.name = this.walletNameForm.value.walletName;
    this.profileProvider.storeWalletGroup(this.walletGroup);
    this.navCtrl.pop();
  }
}
