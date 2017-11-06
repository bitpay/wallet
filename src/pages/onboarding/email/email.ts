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
  public formData: any;
  public showConfirmForm: boolean;

  private walletId: string;
  private emailForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public actionSheet: ActionSheetController,
    private log: Logger,
    private fb: FormBuilder
  ) {
    this.walletId = this.navParams.get('walletId');
    this.formData = {
      accept: true,
      email: null,
    };
    this.showConfirmForm = false;
  }

  ngOnInit() {
    this.emailForm = this.fb.group({
      email: ['', Validators.required, this.validateEmail()],
      accept: [''],
    });
  };

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad EmailPage');
  }

  skip() {
    this.navCtrl.push(BackupRequestPage, {walletId: this.walletId});
  }

  validateEmail() {
    var regex = /^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regex.test(this.formData.email);
  }

  showActionSheet() {
    let actionSheet = this.actionSheet.create({
      buttons: [
        {
          text: 'Continue',
          role: 'destructor',
          handler: () => {
            console.log('Continue clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  showConfirm() {
    // TODO Fix form validation
    if (!this.formData.email) return;
    this.showConfirmForm = !this.showConfirmForm;
  }

  save() {
    // TODO SAVE EMAIL
    this.navCtrl.push(BackupRequestPage, {walletId: this.walletId});
  }
}
