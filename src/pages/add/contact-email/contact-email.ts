import { Component, Input, ViewChild } from '@angular/core';
import axios from 'axios';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages

import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';

@Component({
  selector: 'page-contact-email',
  templateUrl: 'contact-email.html'
})
export class ContactEmailPage {
  public coin: string;
  private testStr: string;
  private invoiceId: string;

  savingBuyerProvidedEmail: boolean = false;
  focusInput: boolean = false;
  emailAddressFormSubmitted: boolean = false;
  setBuyerProvidedEmailServerError: boolean = false;
  buyerProvidedEmail: string;

  emailRegex = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

  @Input() invoice: any;
  @ViewChild('emailAddressForm') emailAddressForm;

  constructor(
    private logger: Logger,
    private navParam: NavParams,
    private incomingDataProvider: IncomingDataProvider
  ) {
    this.testStr = this.navParam.data.testStr;
    this.invoiceId = this.navParam.data.invoiceId;
    this.coin = this.navParam.data.coin;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: Contact Email Page');
  }

  async setBuyerProvidedEmail() {
    if (this.buyerProvidedEmailAlreadySet()) {
      this.savingBuyerProvidedEmail = true;
      return;
    }

    this.emailAddressFormSubmitted = true;
    if (this.emailAddressForm.invalid) {
      return;
    }

    this.savingBuyerProvidedEmail = true;

    axios
      .post(
        `https://${this.testStr}bitpay.com/invoiceData/setBuyerProvidedEmail`,
        {
          buyerProvidedEmail: this.buyerProvidedEmail,
          invoiceId: this.invoiceId
        }
      )
      .then(() => {
        this.setBuyerProvidedEmailServerError = false;
        this.savingBuyerProvidedEmail = false;
      })
      .catch(err => {
        this.logger.error(err, 'Cannot Set Buyer Provided Email');
        this.setBuyerProvidedEmailServerError = true;
        this.savingBuyerProvidedEmail = false;
      });

    // Need to add BCH testnet bchtest: payProUrl
    const payProBitcoinUrl: string = `bitcoin:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;
    const payProBitcoinCashUrl: string = `bitcoincash:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;

    const payProUrl =
      this.coin === 'btc' ? payProBitcoinUrl : payProBitcoinCashUrl;
    this.incomingDataProvider.redir(payProUrl);
  }

  focusEmailInput() {
    this.focusInput = true;
    setTimeout(() => {
      this.focusInput = false;
    }, 100);
  }

  buyerProvidedEmailAlreadySet() {
    return !this.emailAddressFormSubmitted;
  }

  wrongEmail() {
    return this.logger.error('Wrong Email');
  }
}
