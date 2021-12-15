import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../../providers/logger/logger';

// services
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'page-key-name',
  templateUrl: 'key-name.html',
  styleUrls: ['key-name.scss']
})
export class KeyNamePage {
  public walletGroup;
  public walletGroupNameForm: FormGroup;
  public description: string;
  navParamsData;

  constructor(
    private profileProvider: ProfileProvider,
    private location: Location,
    private router: Router,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private translate: TranslateService
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.walletGroupNameForm = this.formBuilder.group({
      walletGroupName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ngOnInit(){
    this.logger.info('Loaded: KeyNamePage');
  }

  ionViewWillEnter() {
    this.walletGroup = this.profileProvider.getWalletGroup(
      this.navParamsData.keyId
    );
    this.walletGroupNameForm.value.walletGroupName = this.walletGroup.name;
    this.description = this.translate.instant(
      'You can change the name displayed on this device below.'
    );
  }

  public async save() {
    this.profileProvider.setWalletGroupName(
      this.navParamsData.keyId,
      this.walletGroupNameForm.value.walletGroupName
    );
    this.location.back();
  }
}
