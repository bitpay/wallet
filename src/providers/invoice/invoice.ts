import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EmailNotificationsProvider } from '../email-notifications/email-notifications';
import { Logger } from '../logger/logger';
import { Network, PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class InvoiceProvider {
  credentials: {
    NETWORK: Network;
    BITPAY_API_URL: string;
  } = {
    NETWORK: Network.testnet,
    BITPAY_API_URL: 'https://test.bitpay.com'
  };

  constructor(
    private emailNotificationsProvider: EmailNotificationsProvider,
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('InvoiceProvider initialized');
    this.setCredentials();
  }

  getNetwork() {
    return this.credentials.NETWORK;
  }

  setCredentials() {
    if (this.getNetwork() === Network.testnet) {
      this.credentials.BITPAY_API_URL = 'https://test.bitpay.com';
    }
  }

  public emailIsValid(email: string): boolean {
    const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );
    return validEmail;
  }

  public storeEmail(email: string): void {
    this.setUserInfo({ email });
  }

  private setUserInfo(data: any): void {
    this.persistenceProvider.setGiftCardUserInfo(JSON.stringify(data));
  }

  public getUserEmail(): Promise<string> {
    return this.persistenceProvider
      .getGiftCardUserInfo()
      .then(data => {
        if (_.isString(data)) {
          data = JSON.parse(data);
        }
        return data && data.email
          ? data.email
          : this.emailNotificationsProvider.getEmailIfEnabled();
      })
      .catch(_ => {});
  }

  public async getBitPayInvoice(id: string) {
    const res: any = await this.http
      .get(`${this.credentials.BITPAY_API_URL}/invoices/${id}`)
      .toPromise()
      .catch(err => {
        this.logger.error('BitPay Get Invoice: ERROR ' + err.error.message);
        throw err.error.message;
      });
    this.logger.info('BitPay Get Invoice: SUCCESS');
    return res.data;
  }

  public async getBitPayInvoiceData(id: string) {
    const res: any = await this.http
      .get(`${this.credentials.BITPAY_API_URL}/invoiceData/${id}`)
      .toPromise()
      .catch(err => {
        this.logger.error('BitPay Get Invoice: ERROR ' + err.error.message);
        throw err.error.message;
      });
    this.logger.info('BitPay Get Invoice: SUCCESS');
    return res;
  }

  public async setBuyerProvidedEmail(
    buyerProvidedEmail: string,
    invoiceId: string
  ) {
    const req = {
      buyerProvidedEmail,
      invoiceId
    };
    const res: any = await this.http
      .post(
        `${this.credentials.BITPAY_API_URL}/invoiceData/setBuyerProvidedEmail`,
        req
      )
      .toPromise()
      .catch(err => {
        this.logger.error(
          'BitPay Invoice Set Email: ERROR ' + err.error.message
        );
        throw err.error.message;
      });
    this.logger.info('BitPay Invoice Set Email: SUCCESS');
    return res;
  }

  public async setBuyerProvidedCurrency(
    buyerSelectedTransactionCurrency: string,
    invoiceId: string
  ) {
    const req = {
      buyerSelectedTransactionCurrency,
      invoiceId
    };
    const res: any = await this.http
      .post(
        `${
          this.credentials.BITPAY_API_URL
        }/invoiceData/setBuyerSelectedTransactionCurrency`,
        req
      )
      .toPromise()
      .catch(err => {
        this.logger.error(
          'BitPay Invoice Set Currency: ERROR ' + err.error.message
        );
        throw err.error.message;
      });
    this.logger.info('BitPay Invoice Set Currency: SUCCESS');
    return res;
  }
}
