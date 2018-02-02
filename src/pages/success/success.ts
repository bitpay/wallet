import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

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
