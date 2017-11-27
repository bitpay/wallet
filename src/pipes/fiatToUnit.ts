import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RateProvider } from '../providers/rate/rate';
import { ConfigProvider } from '../providers/config/config';

@Pipe({ name: 'fiatToUnit' })
export class FiatToUnitPipe implements PipeTransform {
  private walletSettings: any;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private decimalPipe: DecimalPipe,
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(amount: number, unit: string): any {
    amount = amount || 0;
    unit = unit ? unit.toLocaleLowerCase() : this.walletSettings.unitCode;
    let amount_ = this.rateProvider.fromFiat(amount, this.walletSettings.alternativeIsoCode, unit);
    return this.decimalPipe.transform(amount_, '1.2-8') + ' ' + unit.toUpperCase();
  }
}