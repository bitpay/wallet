import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../logger/logger';
import { Network } from '../persistence/persistence';

@Injectable()
export class InvoiceProvider {
  credentials: {
    NETWORK: Network;
    BITPAY_API_URL: string;
  } = {
    NETWORK: Network.testnet,
    BITPAY_API_URL: 'https://test.bitpay.com'
  };

  constructor(private http: HttpClient, private logger: Logger) {
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
