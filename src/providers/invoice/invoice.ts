import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ImageLoader } from 'ionic-image-loader';
import { ConfigProvider } from '../config/config';
import { EmailNotificationsProvider } from '../email-notifications/email-notifications';
import { GiftCardProvider } from '../gift-card/gift-card';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { TimeProvider } from '../time/time';

@Injectable()
export class InvoiceProvider extends GiftCardProvider {
  constructor(
    public configProvider: ConfigProvider,
    public imageLoader: ImageLoader,
    public emailNotificationsProvider: EmailNotificationsProvider,
    public http: HttpClient,
    public logger: Logger,
    public homeIntegrationsProvider: HomeIntegrationsProvider,
    public persistenceProvider: PersistenceProvider,
    public timeProvider: TimeProvider
  ) {
    super(
      configProvider,
      emailNotificationsProvider,
      http,
      imageLoader,
      logger,
      homeIntegrationsProvider,
      persistenceProvider,
      timeProvider
    );
    this.logger.debug('InvoiceProvider initialized');
    this.setCredentials();
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
