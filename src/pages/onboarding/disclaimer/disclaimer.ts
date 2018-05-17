import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

import { TermsOfUsePage } from '../../settings/about/terms-of-use/terms-of-use';
import { TabsPage } from '../../tabs/tabs';

import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html',
})
export class DisclaimerPage {
  public accepted: any;
  public terms: any;
  public hasEmail: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private emailProvider: EmailNotificationsProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.hasEmail = this.emailProvider.getEmailIfEnabled() ? true : false;
    this.accepted = {
      first: false,
      second: false,
      third: this.hasEmail ? false : true
    };
    this.terms = {
      accepted: false,
    }
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad DisclaimerPage');
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openDisclaimer() {
    this.navCtrl.push(TermsOfUsePage);
  }

  confirm() {
    this.persistenceProvider.setDisclaimerAccepted();
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot({ animate: false });
  }
}
