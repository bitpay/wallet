import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-success',
  templateUrl: 'success.html',
})
export class SuccessModalPage {

  public successText: string;
  public successComment: string;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private translate: TranslateService
  ) {
    this.successText = this.navParams.data.successText ? this.navParams.data.successText : this.translate.instant('Payment Sent');
    this.successComment = this.navParams.data.successComment ? this.navParams.data.successComment : '';
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
