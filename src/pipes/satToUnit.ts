import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ConfigProvider } from '../providers/config/config';

@Pipe({ name: 'satToUnit' })
export class SatToUnitPipe implements PipeTransform {
  private walletSettings: any;
  
  constructor(
    private configProvider: ConfigProvider,
    private decimalPipe: DecimalPipe,
  ) {
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(amount: number, unit?: string): any {
    amount = amount || 0;
    unit = unit ? unit : this.walletSettings.unitCode;
    return this.decimalPipe.transform(amount / 1e8, '1.2-6') + ' ' + unit.toUpperCase();
  }
}