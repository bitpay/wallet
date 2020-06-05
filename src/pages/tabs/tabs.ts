import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';

import { AppProvider } from '../../providers/app/app';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { ExchangeRatesProvider } from '../../providers/exchange-rates/exchange-rates';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { ProfileProvider } from '../../providers/profile/profile';
import { TabProvider } from '../../providers/tab/tab';
import { WalletProvider } from '../../providers/wallet/wallet';

import { CardsPage } from '../cards/cards';
import { HomePage } from '../home/home';
import { SettingsPage } from '../settings/settings';
import { WalletsPage } from '../wallets/wallets';

import * as _ from 'lodash';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  appName: string;
  @ViewChild('tabs')
  tabs;

  public txpsN: number;
  public cardNotificationBadgeText;
  private zone;

  constructor(
    private appProvider: AppProvider,
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private events: Events,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private tabProvider: TabProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private configProvider: ConfigProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.logger.info('Loaded: TabsPage');
    this.appName = this.appProvider.info.nameCase;

    this.events.subscribe('experimentUpdateStart', () => {
      this.tabs.select(2);
    });

    this.events.subscribe('bwsEvent', this.bwsEventHandler);
    this.events.subscribe('Local/UpdateTxps', data => {
      this.setTxps(data);
    });
    this.events.subscribe('Local/FetchWallets', () => {
      this.fetchAllWalletsStatus();
    });
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      if (status === 'enabled') {
        this.persistenceProvider
          .getCardNotificationBadge()
          .then(badgeStatus => {
            this.cardNotificationBadgeText =
              badgeStatus === 'disabled' ? null : 'New';
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
      this.setTxps(data);
    });
  }

  setTxps(data) {
    this.zone.run(() => {
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
        if (
          walletId &&
          type == eventName &&
          (type === 'NewIncomingTx' || type === 'NewOutgoingTx')
        ) {
          this.fetchAllWalletsStatus();
        }
      }
    );
  };

  private updateTotalBalance() {
    const totalBalanceAlternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';
    this.exchangeRatesProvider
      .getLastDayRates(totalBalanceAlternativeIsoCode)
      .then(lastDayRatesArray => {
        this.walletProvider
          .getTotalAmount(
            this.profileProvider.wallet,
            totalBalanceAlternativeIsoCode,
            lastDayRatesArray
          )
          .then(data => {
            this.logger.debug('Total Balance Updated');
            this.events.publish('Local/HomeBalance', data);
          });
      });
  }

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

  private fetchAllWalletsStatus = _.debounce(
    async () => {
      this._fetchAllWallets();
    },
    5000,
    {
      leading: true
    }
  );

  private _fetchAllWallets() {
    let wallets = this.profileProvider.wallet;
    if (_.isEmpty(wallets)) {
      this.events.publish('Local/HomeBalance');
      return;
    }

    this.logger.debug('Fetching All Wallets and Updating Total Balance');
    wallets = _.filter(this.profileProvider.wallet, w => {
      return !w.hidden;
    });

    let foundMessage = false;

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

          return Promise.resolve();
        })
        .catch(err => {
          this.processWalletError(wallet, err);
          return Promise.resolve();
        });
    };

    const promises = [];

    _.each(wallets, wallet => {
      promises.push(pr(wallet));
    });

    Promise.all(promises).then(() => {
      this.updateTotalBalance();
      this.updateTxps();
    });
  }

  homeRoot = HomePage;
  walletsRoot = WalletsPage;
  cardsRoot = CardsPage;
  settingsRoot = SettingsPage;
}
