import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// native
import { SplashScreen } from '@ionic-native/splash-screen';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { RateProvider } from '../../../providers/rate/rate';

import * as _ from 'lodash';

@Component({
  selector: 'page-alt-currency',
  templateUrl: 'alt-currency.html'
})
export class AltCurrencyPage {
  public completeAlternativeList;
  public searchedAltCurrency: string;
  public altCurrencyList;
  public loading;
  public currentCurrency;
  public lastUsedAltCurrencyList;

  private PAGE_COUNTER: number = 3;
  private SHOW_LIMIT: number = 10;
  private unusedCurrencyList;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private rate: RateProvider,
    private splashScreen: SplashScreen,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.completeAlternativeList = [];
    this.altCurrencyList = [];
    this.unusedCurrencyList = [
      {
        isoCode: 'LTL'
      },
      {
        isoCode: 'BTC'
      },
      {
        isoCode: 'BCH'
      },
      {
        isoCode: 'ETH'
      },
      {
        isoCode: 'XRP'
      },
      {
        isoCode: 'USDC'
      },
      {
        isoCode: 'GUSD'
      },
      {
        isoCode: 'PAX'
      },
      {
        isoCode: 'BUSD'
      },
      {
        isoCode: 'DAI'
      },
      {
        isoCode: 'WBTC'
      }
    ];
  }

  ionViewWillEnter() {
    this.rate
      .whenRatesAvailable('btc')
      .then(() => {
        this.completeAlternativeList = this.rate.listAlternatives(true);
        let idx = _.keyBy(this.unusedCurrencyList, 'isoCode');
        let idx2 = _.keyBy(this.lastUsedAltCurrencyList, 'isoCode');

        this.completeAlternativeList = _.reject(
          this.completeAlternativeList,
          c => {
            return idx[c.isoCode] || idx2[c.isoCode];
          }
        );
        this.altCurrencyList = this.completeAlternativeList.slice(0, 20);
      })
      .catch(err => {
        this.logger.error(err);
      });

    let config = this.configProvider.get();
    this.currentCurrency = config.wallet.settings.alternativeIsoCode;

    this.persistenceProvider
      .getLastCurrencyUsed()
      .then(lastUsedAltCurrency => {
        this.lastUsedAltCurrencyList = lastUsedAltCurrency
          ? lastUsedAltCurrency
          : [];
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public loadAltCurrencies(loading): void {
    if (this.altCurrencyList.length === this.completeAlternativeList.length) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.altCurrencyList = this.completeAlternativeList.slice(
        0,
        this.PAGE_COUNTER * this.SHOW_LIMIT
      );
      this.PAGE_COUNTER++;

      if (this.searchedAltCurrency) this.findCurrency();

      loading.complete();
    }, 300);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AltCurrencyPage');
  }

  public save(newAltCurrency): void {
    var opts = {
      wallet: {
        settings: {
          alternativeName: newAltCurrency.name,
          alternativeIsoCode: newAltCurrency.isoCode
        }
      }
    };
    if (
      _.some(this.completeAlternativeList, ['isoCode', newAltCurrency.isoCode])
    ) {
      this.configProvider.set(opts);
      this.saveLastUsed(newAltCurrency);
      this.navCtrl.popToRoot().then(() => {
        this.reload();
      });
    } else {
      // To stop showing currencies that are no longer supported
      this.showErrorAndRemoveAltCurrency(newAltCurrency);
    }
  }

  private showErrorAndRemoveAltCurrency(altCurrency): void {
    const params = {
      name: altCurrency.name,
      isoCode: altCurrency.isoCode,
      error: true
    };
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'unsupported-alt-currency',
      params
    );
    infoSheet.present();
    infoSheet.onDidDismiss(() => {
      this.lastUsedAltCurrencyList = _.reject(this.lastUsedAltCurrencyList, [
        'isoCode',
        altCurrency.isoCode
      ]);
      this.persistenceProvider
        .setLastCurrencyUsed(JSON.stringify(this.lastUsedAltCurrencyList))
        .then(() => {});
    });
  }

  private reload(): void {
    window.location.reload();
    if (this.platformProvider.isCordova) this.splashScreen.show();
  }

  private saveLastUsed(newAltCurrency): void {
    this.lastUsedAltCurrencyList.unshift(newAltCurrency);
    this.lastUsedAltCurrencyList = _.uniqBy(
      this.lastUsedAltCurrencyList,
      'isoCode'
    );
    this.lastUsedAltCurrencyList = this.lastUsedAltCurrencyList.slice(0, 3);
    this.persistenceProvider
      .setLastCurrencyUsed(JSON.stringify(this.lastUsedAltCurrencyList))
      .then(() => {});
  }

  public findCurrency(): void {
    this.altCurrencyList = _.filter(this.completeAlternativeList, item => {
      var val = item.name;
      var val2 = item.isoCode;
      return (
        _.includes(val.toLowerCase(), this.searchedAltCurrency.toLowerCase()) ||
        _.includes(val2.toLowerCase(), this.searchedAltCurrency.toLowerCase())
      );
    });
  }
}
