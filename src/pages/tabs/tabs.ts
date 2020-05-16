import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';

import { AppProvider } from '../../providers/app/app';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeRatesProvider } from '../../providers/exchange-rates/exchange-rates';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { ProfileProvider } from '../../providers/profile/profile';
import { RateProvider } from '../../providers/rate/rate';
import { TabProvider } from '../../providers/tab/tab';
import { WalletProvider } from '../../providers/wallet/wallet';

import { CardsPage } from '../cards/cards';
import { HomePage } from '../home/home';
import { SettingsPage } from '../settings/settings';
import { WalletsPage } from '../wallets/wallets';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  appName: string;
  @ViewChild('tabs')
  tabs;

  public txpsN: number;
  public cardNotificationBadgeText;
  private totalBalanceAlternative = '0';
  private totalBalanceAlternativeIsoCode = 'USD';
  private averagePrice = 0;
  private lastDayRatesArray;

  constructor(
    private appProvider: AppProvider,
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private events: Events,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private tabProvider: TabProvider
  ) {
    this.logger.info('Loaded: TabsPage');
    this.appName = this.appProvider.info.nameCase;
    this.totalBalanceAlternativeIsoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
    this.events.subscribe('Local/FetchWallets', () => {
      this.fetchAllWalletsStatus();
    });
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      if (status === 'enabled') {
        this.cardNotificationBadgeText = 'New';
        this.persistenceProvider
          .getCardNotificationBadge()
          .then(badgeStatus => {
            if (badgeStatus === 'disabled') {
              this.cardNotificationBadgeText = null;
            }
          });
      }
    });
  }

  ngOnInit() {
    this.tabProvider.prefetchCards().then(data => {
      // [0] BitPay Cards
      // [1] Gift Cards
      this.events.publish('Local/FetchCards', data[0]);
    });
  }

  disableCardNotificationBadge() {
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      if (status === 'enabled') {
        this.cardNotificationBadgeText = null;
        this.persistenceProvider.setCardNotificationBadge('disabled');
      }
    });
  }

  updateTxps() {
    this.profileProvider.getTxps({ limit: 3 }).then(data => {
      this.txpsN = data.n;
    });
  }

  private bwsEventHandler: any = (walletId: string, type: string) => {
    _.each(
      [
        'TxProposalRejectedBy',
        'TxProposalAcceptedBy',
        'transactionProposalRemoved',
        'TxProposalRemoved',
        'NewOutgoingTx',
        'UpdateTx',
        'NewIncomingTx'
      ],
      (eventName: string) => {
        if (walletId && type == eventName) {
          setTimeout(() => {
            type === 'NewIncomingTx' || type === 'NewOutgoingTx'
              ? this.fetchAllWalletsStatus()
              : this.updateTxps();
          }, 2000);
        }
      }
    );
  };

  private processWalletError(wallet, err): void {
    wallet.error = wallet.errorObj = null;

    if (!err || err == 'INPROGRESS') return;

    wallet.cachedStatus = null;
    wallet.errorObj = err;

    if (err.message === '403') {
      this.events.publish('Local/AccessDenied');
      wallet.error = this.translate.instant('Access denied');
    } else if (err === 'WALLET_NOT_REGISTERED') {
      wallet.error = this.translate.instant('Wallet not registered');
    } else {
      wallet.error = this.bwcErrorProvider.msg(err);
    }
    this.logger.warn(
      this.bwcErrorProvider.msg(
        wallet.error,
        'Error updating status for ' + wallet.id
      )
    );
  }

  private getWalletTotalBalanceAlternative(
    balanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(balanceSat, this.totalBalanceAlternativeIsoCode, coin)
      .toFixed(2);
  }

  private getLastDayRates(): Promise<any> {
    const today = moment();
    const availableChains = this.currencyProvider.getAvailableChains();
    const ts = today.subtract(23, 'hours').unix() * 1000;
    return new Promise(resolve => {
      let ratesByCoin = {};
      for (const unitCode of availableChains) {
        this.exchangeRatesProvider
          .getHistoricalRates(unitCode, this.totalBalanceAlternativeIsoCode)
          .subscribe(
            response => {
              ratesByCoin[unitCode] = _.find(response, d => {
                return d.ts < ts;
              }).rate;
            },
            err => {
              this.logger.error('Error getting current rate:', err);
              return resolve();
            }
          );
      }
      return resolve(ratesByCoin);
    });
  }

  private getWalletTotalBalanceAlternativeLastDay(
    balanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(balanceSat, this.totalBalanceAlternativeIsoCode, coin, {
        customRate: this.lastDayRatesArray[coin]
      })
      .toFixed(2);
  }

  private calcTotalAmount(statusWallet, wallet) {
    let walletTotalBalanceAlternative = 0;
    let walletTotalBalanceAlternativeLastDay = 0;
    if (statusWallet.wallet.network === 'livenet' && !wallet.hidden) {
      const balance =
        statusWallet.wallet.coin === 'xrp'
          ? statusWallet.availableBalanceSat
          : statusWallet.totalBalanceSat;
      walletTotalBalanceAlternativeLastDay = parseFloat(
        this.getWalletTotalBalanceAlternativeLastDay(balance, wallet.coin)
      );
      if (statusWallet.wallet.coin === 'xrp') {
        walletTotalBalanceAlternative = parseFloat(
          this.getWalletTotalBalanceAlternative(
            statusWallet.availableBalanceSat,
            'xrp'
          )
        );
      } else {
        walletTotalBalanceAlternative = parseFloat(
          statusWallet.totalBalanceAlternative.replace(/,/g, '')
        );
      }
    }
    return {
      walletTotalBalanceAlternative,
      walletTotalBalanceAlternativeLastDay
    };
  }

  private async fetchAllWalletsStatus() {
    this.logger.debug('Fetching All Wallets and calculate Total Amount');
    const wallets = this.profileProvider.getWallets();
    if (_.isEmpty(wallets)) {
      this.events.publish('Local/HomeBalance');
      return;
    }

    let foundMessage = false;
    this.lastDayRatesArray = await this.getLastDayRates();

    const pr = wallet => {
      return this.walletProvider
        .fetchStatus(wallet, {})
        .then(async status => {
          wallet.cachedStatus = status;
          wallet.error = wallet.errorObj = null;
          const balance =
            wallet.coin === 'xrp'
              ? wallet.cachedStatus.availableBalanceStr
              : wallet.cachedStatus.totalBalanceStr;

          this.persistenceProvider.setLastKnownBalance(wallet.id, balance);

          this.events.publish('Local/WalletUpdate', {
            walletId: wallet.id,
            finished: true
          });

          if (!foundMessage && !_.isEmpty(status.serverMessages)) {
            foundMessage = true;
            this.events.publish('Local/ServerMessage', {
              serverMessages: status.serverMessages
            });
          }

          return Promise.resolve(this.calcTotalAmount(status, wallet));
        })
        .catch(err => {
          this.processWalletError(wallet, err);
          return Promise.resolve();
        });
    };

    const promises = [];

    _.each(this.profileProvider.wallet, wallet => {
      promises.push(pr(wallet));
    });

    Promise.all(promises).then(balanceAlternativeArray => {
      this.totalBalanceAlternative = _.sumBy(
        _.compact(balanceAlternativeArray),
        b => b.walletTotalBalanceAlternative
      ).toFixed(2);
      const totalBalanceAlternativeLastDay = _.sumBy(
        _.compact(balanceAlternativeArray),
        b => b.walletTotalBalanceAlternativeLastDay
      ).toFixed(2);
      const difference =
        parseFloat(this.totalBalanceAlternative.replace(/,/g, '')) -
        parseFloat(totalBalanceAlternativeLastDay.replace(/,/g, ''));
      this.averagePrice =
        (difference * 100) /
        parseFloat(this.totalBalanceAlternative.replace(/,/g, ''));

      const data = {
        totalBalanceAlternative: this.totalBalanceAlternative,
        totalBalanceAlternativeIsoCode: this.totalBalanceAlternativeIsoCode,
        averagePrice: this.averagePrice
      };

      // Publish event
      this.events.publish('Local/HomeBalance', data);
      this.updateTxps();
    });
  }

  homeRoot = HomePage;
  walletsRoot = WalletsPage;
  cardsRoot = CardsPage;
  settingsRoot = SettingsPage;
}
