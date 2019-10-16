import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { CoinOpts, ConfigProvider } from '../providers/config/config';
import { RateProvider } from '../providers/rate/rate';

@Pipe({
  name: 'fiatToUnit',
  pure: false
})
export class FiatToUnitPipe implements PipeTransform {
  private walletSettings;
  private coinOpts: CoinOpts;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private decimalPipe: DecimalPipe
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
    this.coinOpts = this.configProvider.getCoinOpts();
  }
  transform(amount: number, coin: string, alternative?: string) {
    alternative = alternative
      ? alternative
      : this.walletSettings.alternativeIsoCode;
    let amount_ = this.rateProvider.fromFiat(
      amount,
      alternative,
      coin.toLowerCase()
    );
    return (
      this.decimalPipe.transform(
        amount_ / this.coinOpts[coin].unitToSatoshi || 0,
        '1.2-8'
      ) +
      ' ' +
      coin.toUpperCase()
    );
  }
}
