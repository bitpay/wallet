import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController } from 'ionic-angular';
/**
 * Generated class for the EmailPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-email',
  templateUrl: 'email.html',
})
export class EmailPage {
  public data: any;
  public showConfirmForm: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, public actionSheet: ActionSheetController) {
    this.data = {
      accept: true,
      email: '',
    };
    this.showConfirmForm = false;
  }

  skip() {
    this.navCtrl.push('BackupRequestPage');
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
    if (!this.data.email) return;
    this.showConfirmForm = !this.showConfirmForm;
  }

  save() {
    // TODO SAVE EMAIL
    this.navCtrl.push('BackupRequestPage');
  }
}
