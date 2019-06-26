import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-group-name',
  templateUrl: 'wallet-group-name.html'
})
export class WalletGroupNamePage {
  public walletsGroup;
  public walletNameForm: FormGroup;

  private keyId: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private navCtrl: NavController,
    private formBuilder: FormBuilder,
    private logger: Logger
  ) {
    this.walletNameForm = this.formBuilder.group({
      walletName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.keyId = this.navParams.data.keyId;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletNamePage');
  }

  ionViewWillEnter() {
    this.walletsGroup = this.profileProvider.getWalletGroup(this.keyId);
    this.walletNameForm.value.walletName = this.walletsGroup.name;
  }

  public save(): void {
    this.profileProvider.setWalletGroupName(
      this.walletNameForm.value.walletName,
      this.keyId
    );
    this.navCtrl.pop();
  }
}
