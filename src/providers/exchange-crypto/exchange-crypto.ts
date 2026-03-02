import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

// providers
import { ChangellyProvider } from '../changelly/changelly';
import { ConfigProvider } from '../config/config';
import { CurrencyProvider } from '../currency/currency';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';
import { OneInchProvider } from '../one-inch/one-inch';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';

@Injectable()
export class ExchangeCryptoProvider {
  public paymentMethodsAvailable;
  public exchangeCoinsSupported: string[];

  // private baseUrl: string = 'http://localhost:3232/bws/api'; // testing
  private baseUrl: string = 'https://bws.bitpay.com/bws/api';

  constructor(
    private http: HttpClient,
    private changellyProvider: ChangellyProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private oneInchProvider: OneInchProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('ExchangeCrypto Provider initialized');
    this.exchangeCoinsSupported = _.union(
      this.changellyProvider.supportedCoins
    );
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'exchangecrypto',
      title: this.translate.instant('Swap Crypto'),
      icon: 'assets/img/exchange-crypto/exchange-settings.svg',
      showIcon: true,
      logo: null,
      logoWidth: '110',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(45, 47, 51, 1) 100%)',
      page: 'CryptoSettingsPage',
      show: !!this.configProvider.get().showIntegration['exchangecrypto'],
      type: 'exchange'
    });
  }

  public checkServiceAvailability(service: string, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = this.baseUrl + '/v1/service/checkAvailability';

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      const body = {
        service,
        opts
      };

      this.logger.debug(
        'Making checkServiceAvailability request with body: ',
        body
      );

      this.http.post(url, body, { headers }).subscribe(
        (data: any) => {
          return resolve(data);
        },
        err => {
          return reject(err);
        }
      );
    });
  }

  public async getSwapTxs(): Promise<any> {
    const [changellySwapTxs, oneInchSwapTxs]: any = await Promise.all([
      this.changellyProvider.getChangelly(),
      this.oneInchProvider.getOneInch()
    ]);
    return {
      changellySwapTxs: _.values(changellySwapTxs),
      oneInchSwapTxs: _.values(oneInchSwapTxs)
    };
  }

  public verifyExcludedUtxos(coin, sendMaxInfo) {
    const warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      const amountBelowFeeStr =
        sendMaxInfo.amountBelowFee /
        this.currencyProvider.getPrecision(coin).unitToSatoshi;
      const message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'
        ),
        { amountBelowFeeStr, coin: coin.toUpperCase() }
      );
      warningMsg.push(message);
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      const amountAboveMaxSizeStr =
        sendMaxInfo.amountAboveMaxSize /
        this.currencyProvider.getPrecision(coin).unitToSatoshi;
      const message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{amountAboveMaxSizeStr}} {{coin}} were excluded. The maximum size allowed for a transaction was exceeded.'
        ),
        { amountAboveMaxSizeStr, coin: coin.toUpperCase() }
      );
      warningMsg.push(message);
    }
    return warningMsg.join('\n');
  }

  public getSpenderApprovalWhitelist(): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Asking BWS for contract approval whitelist');

      this.http
        .get(this.baseUrl + '/v1/services/dex/getSpenderApprovalWhitelist', {
          headers
        })
        .subscribe(
          (data: any) => {
            this.logger.debug('Contract approval whitelist: ', data);
            if (data) return resolve(data);
            return reject('No contract approval whitelist');
          },
          err => {
            return reject(err);
          }
        );
    });
  }
}
