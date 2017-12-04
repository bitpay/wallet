import { Pipe, PipeTransform } from '@angular/core';
import { RateProvider } from '../providers/rate/rate';
import { ConfigProvider } from '../providers/config/config';
import { DecimalPipe } from '@angular/common';

@Pipe({ 
  name: 'satToFiat', 
  pure: false 
})
export class SatToFiatPipe implements PipeTransform {
  private walletSettings: any;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private decimalPipe: DecimalPipe,
  ) { 
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(amount: number, unit: string): any {
    unit = unit ? unit.toLocaleLowerCase() : this.walletSettings.unitCode;
    let amount_ = this.rateProvider.toFiat(amount / 1e8, this.walletSettings.alternativeIsoCode, unit);
    return this.decimalPipe.transform(amount_ || 0, '1.2-2') + ' ' + this.walletSettings.alternativeIsoCode;
  }
}