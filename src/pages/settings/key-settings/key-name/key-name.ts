import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-key-name',
  templateUrl: 'key-name.html'
})
export class KeyNamePage {
  public walletGroup;
  public walletGroupNameForm: FormGroup;
  public description: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private translate: TranslateService
  ) {
    this.walletGroupNameForm = this.formBuilder.group({
      walletGroupName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: KeyNamePage');
  }

  ionViewWillEnter() {
    this.walletGroup = this.profileProvider.getWalletGroup(
      this.navParams.data.keyId
    );
    this.walletGroupNameForm.value.walletGroupName = this.walletGroup.name;
    this.description = this.translate.instant(
      'You can change the name displayed on this device below.'
    );
  }

  public async save() {
    this.profileProvider.setWalletGroupName(
      this.navParams.data.keyId,
      this.walletGroupNameForm.value.walletGroupName
    );
    this.navCtrl.pop();
  }
}
