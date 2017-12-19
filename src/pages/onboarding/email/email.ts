import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';

import { BackupRequestPage } from '../backup-request/backup-request';

@Component({
  selector: 'page-email',
  templateUrl: 'email.html',
})
export class EmailPage {
  public showConfirmForm: boolean;

  private walletId: string;
  private emailForm: FormGroup;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private actionSheet: ActionSheetController,
    private logger: Logger,
    private fb: FormBuilder
  ) {
    this.walletId = this.navParams.data.walletId;
    let regex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    this.emailForm = this.fb.group({
      email: [null, [Validators.required, Validators.pattern(regex)]],
      accept: [true],
    });
    this.showConfirmForm = false;
  }

  ngOnInit() {
  };

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad EmailPage');
  }

  skip() {
    this.navCtrl.push(BackupRequestPage, { walletId: this.walletId });
  }

  showActionSheet() {
    let actionSheet = this.actionSheet.create({
      buttons: [
        {
          text: 'Continue',
          role: 'destructor',
          handler: () => {
            this.logger.debug('Continue clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  showConfirm() {
    // TODO Fix form validation
    if (!this.emailForm.value.email) return;
    this.showConfirmForm = !this.showConfirmForm;
  }

  save() {
    // TODO SAVE EMAIL
    this.navCtrl.push(BackupRequestPage, { walletId: this.walletId });
  }
}
