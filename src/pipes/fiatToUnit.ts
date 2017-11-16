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
  transform(value: string, amount: number): any {
    let amount_ = this.rateProvider.fromFiat(amount, this.walletSettings.alternativeIsoCode, this.walletSettings.unitCode);
    return this.decimalPipe.transform(amount_, '1.2-8') + ' ' + this.walletSettings.unitCode.toUpperCase();
  }
}