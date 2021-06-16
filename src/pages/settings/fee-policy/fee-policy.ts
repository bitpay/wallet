import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { FeeProvider } from '../../../providers/fee/fee';

// const COINS = ['btc', 'eth'];
const NETWORK = 'livenet';

export interface FeePolicyObject {
  feeLevels: object;
  currentFeeLevel: string;
  rangeValue: number;
  feePerSatByteStr: string;
}

export interface CoinFeePolicies {
  btc: FeePolicyObject;
  eth: FeePolicyObject;
}
@Component({
  selector: 'page-fee-policy',
  templateUrl: 'fee-policy.html'
})
export class FeePolicyPage {
  public coinFeePolicies: CoinFeePolicies;
  public feePolicyObjectDefault: FeePolicyObject = {
    feeLevels: {},
    currentFeeLevel: '',
    rangeValue: 0,
    feePerSatByteStr: ''
  };

  constructor(
    private logger: Logger,
    private feeProvider: FeeProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider
  ) {
    this.coinFeePolicies = {
      btc: _.cloneDeep(this.feePolicyObjectDefault),
      eth: _.cloneDeep(this.feePolicyObjectDefault)
    };
  }

  ionViewWillEnter() {
    _.each(this.coinFeePolicies, async (_, coin) => {
      try {
        this.coinFeePolicies[coin].feeLevels = await this.getFeeLevels(coin);
        this.coinFeePolicies[
          coin
        ].currentFeeLevel = this.feeProvider.getCurrentFeeLevels(coin);
        this.coinFeePolicies[coin].rangeValue = this.getRangeValue(coin);
        this.updateCurrentValues(coin);
      } catch (err) {
        this.logger.error(err);
      }
    });
  }

  private async getFeeLevels(coin: string): Promise<any> {
    try {
      const feeLevels = await this.feeProvider.getFeeLevels(coin, NETWORK);
      const feeLevelsLenght = feeLevels.levels.length;
      // The order of the array is necessary for the ion-range component
      return feeLevels.levels[0].feePerKb >
        feeLevels.levels[feeLevelsLenght - 1].feePerKb
        ? _.reverse(feeLevels.levels)
        : feeLevels.levels;
    } catch (err) {
      this.logger.error(err);
      return [];
    }
  }

  public getRangeValue(coin) {
    return _.findKey(this.coinFeePolicies[coin].feeLevels, feeLevel => {
      return feeLevel.level == this.coinFeePolicies[coin].currentFeeLevel;
    });
  }

  private updateCurrentValues(coin) {
    if (
      _.isEmpty(this.coinFeePolicies[coin].feeLevels) ||
      !this.coinFeePolicies[coin].currentFeeLevel
    )
      return;

    let value = this.getFeeLevelSelected(coin);
    if (_.isEmpty(value)) return;

    const { feeUnitAmount, feeUnit } = this.currencyProvider.getFeeUnits(coin);
    const feePerSatByte = (
      this.getFeeLevelSelected(coin).feePerKb / feeUnitAmount
    ).toFixed();
    this.coinFeePolicies[coin].feePerSatByteStr =
      coin === 'btc'
        ? `${feePerSatByte} Satoshis per byte`
        : `${feePerSatByte} ${feeUnit}`;
  }

  public getCoinName(coin: Coin) {
    return this.currencyProvider.getCoinName(coin);
  }

  public save(coin) {
    if (
      !this.coinFeePolicies[coin].currentFeeLevel ||
      this.getFeeLevelSelected(coin).level ==
        this.feeProvider.getCurrentFeeLevels(coin)
    )
      return;
    this.logger.debug(
      `New fee level (${coin.toUpperCase()}): ${
        this.getFeeLevelSelected(coin).level
      }`
    );
    this.updateCurrentValues(coin);
    this.setFee();
  }

  private getFeeLevelSelected(coin) {
    return _.find(this.coinFeePolicies[coin].feeLevels, (_, key) => {
      return key == this.coinFeePolicies[coin].rangeValue;
    });
  }

  private setFee() {
    let opts = {
      feeLevels: {
        btc: this.getFeeLevelSelected('btc').level,
        eth: this.getFeeLevelSelected('eth').level
      }
    };
    this.configProvider.set(opts);
  }
}
