import { Pipe, PipeTransform } from '@angular/core';
import { RateProvider } from '../providers/rate/rate';
import { ConfigProvider } from '../providers/config/config';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'unitToFiat' })
export class UnitToFiatPipe implements PipeTransform {
  private walletSettings: any;

  constructor(
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private decimalPipe: DecimalPipe,
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(value: string, amount: number): any {
    let amount_ = this.rateProvider.toFiat(amount, this.walletSettings.alternativeIsoCode, this.walletSettings.unitCode);
    return this.decimalPipe.transform(amount, '1.2-2') + ' ' + this.walletSettings.alternativeIsoCode;
  }
}