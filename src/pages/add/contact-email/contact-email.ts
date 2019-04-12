import { Component } from '@angular/core';
import axios from 'axios';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

// providers
import { ConfigProvider } from '../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

// pages
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';

@Component({
  selector: 'page-contact-email',
  templateUrl: 'contact-email.html'
})
export class ContactEmailPage {
  public emailForm: FormGroup;
  public coin: string;
  private testStr: string;
  private invoiceId: string;
  constructor(
    private logger: Logger,
    private navParam: NavParams,
    private formBuilder: FormBuilder,
    private incomingDataProvider: IncomingDataProvider,
    private configProvider: ConfigProvider,
    private emailProvider: EmailNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService
  ) {
    this.testStr = this.navParam.data.testStr;
    this.invoiceId = this.navParam.data.invoiceId;
    this.coin = this.navParam.data.coin;
    this.emailForm = formBuilder.group({
      email: [
        '',
        Validators.compose([
          Validators.pattern(
            /^(?:[\w!#$%&'*-=?^`{|}~]+\.)*[\w!#$%&'*\-=?^`{|}~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])]))$/
          ),
          Validators.required
        ])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: Contact Email Page');
    this.updateConfig();
  }

  private updateConfig() {
    const config = this.configProvider.get();
    this.emailForm.setValue({
      email: this.emailProvider.getEmailIfEnabled(config) || ''
    });
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Policy');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  async setBuyerProvidedEmail() {
    // Need to add BCH testnet bchtest: payProUrl
    const payProBitcoinUrl: string = `bitcoin:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;
    const payProBitcoinCashUrl: string = `bitcoincash:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;
    const payProUrl =
      this.coin === 'btc' ? payProBitcoinUrl : payProBitcoinCashUrl;

    try {
      await axios.post(
        `https://${this.testStr}bitpay.com/invoiceData/setBuyerProvidedEmail`,
        {
          buyerProvidedEmail: this.emailForm.value.email,
          invoiceId: this.invoiceId
        }
      );
      this.incomingDataProvider.redir(payProUrl);
    } catch (err) {
      this.logger.error(err, 'Cannot Set Buyer Provided Email');
      this.incomingDataProvider.redir(payProUrl);
    }
  }
}
