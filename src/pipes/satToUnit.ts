import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ConfigProvider } from '../providers/config/config';

@Pipe({ name: 'satToUnit' })
export class SatToUnitPipe implements PipeTransform {
  private unitCode: string;
  
  constructor(
    private configProvider: ConfigProvider,
    private decimalPipe: DecimalPipe,
  ) {
    this.unitCode = this.configProvider.get().wallet.settings.unitCode;
  }
  transform(value: string, amount: number): any {
    return this.decimalPipe.transform(amount / 1e8, '1.2-6') + ' ' + this.unitCode.toUpperCase();
  }
}