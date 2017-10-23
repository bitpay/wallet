import { Component } from '@angular/core';
import { NavController, NavParams} from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

import { TermsOfUsePage } from '../../settings/about/terms-of-use/terms-of-use';
import { TabsPage } from '../../tabs/tabs';

@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html',
})
export class DisclaimerPage {
  public accepted: any;
  public terms: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private log: Logger
  ) {
    this.accepted = {
      first: false,
      second: false,
    };
    this.terms = {
      accepted: false,
    }
  }

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad DisclaimerPage');
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openDisclaimer() {
    this.navCtrl.push(TermsOfUsePage);
  }

  confirm() {
    // TODO accept disclaimer
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot();
  }
}
