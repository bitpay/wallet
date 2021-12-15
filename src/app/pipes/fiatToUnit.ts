import { Pipe, PipeTransform } from '@angular/core';
import { Coin, ConfigProvider, RateProvider, TxFormatProvider } from '../providers';

@Pipe({
  name: 'fiatToUnit',
  pure: false
})
export class FiatToUnitPipe implements PipeTransform {
  private walletSettings;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private txFormatProvider: TxFormatProvider
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(amount: number, coin: Coin, alternative?: string) {
    alternative = alternative
      ? alternative
      : this.walletSettings.alternativeIsoCode;
    let amount_ = this.rateProvider.fromFiat(amount, alternative, coin);
    return this.txFormatProvider.formatAmountStr(coin, amount_, true);
  }
}
