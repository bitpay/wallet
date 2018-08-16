import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ConfigProvider } from '../providers/config/config';
import { RateProvider } from '../providers/rate/rate';

@Pipe({
  name: 'satToFiat',
  pure: false
})
export class SatToFiatPipe implements PipeTransform {
  private walletSettings;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private decimalPipe: DecimalPipe
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(amount: number, coin: string) {
    let amount_ = this.rateProvider.toFiat(
      amount,
      this.walletSettings.alternativeIsoCode,
      coin.toLowerCase()
    );
    return (
      this.decimalPipe.transform(amount_ || 0, '1.2-2') +
      ' ' +
      this.walletSettings.alternativeIsoCode
    );
  }
}
