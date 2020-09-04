import { Pipe, PipeTransform } from '@angular/core';
import { ConfigProvider } from '../providers/config/config';
import { Coin } from '../providers/currency/currency';
import { RateProvider } from '../providers/rate/rate';
import { TxFormatProvider } from '../providers/tx-format/tx-format';

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
