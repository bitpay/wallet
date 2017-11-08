import { Pipe, PipeTransform } from '@angular/core';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { ConfigProvider } from '../providers/config/config';

@Pipe({ name: 'toUnit' })
export class ToUnitPipe implements PipeTransform {
  private unitCode: string;
  
  constructor(
    private configProvider: ConfigProvider,
    private txFormatProvider: TxFormatProvider
  ) {
    this.unitCode = this.configProvider.get()['wallet']['settings'].unitCode;
  }
  transform(value: string, satoshis: number): any {
    return this.txFormatProvider.formatAmountStr(this.unitCode, satoshis);
  }
}