import { Pipe, PipeTransform } from '@angular/core';
import { TxFormatProvider } from '../providers/tx-format/tx-format';

@Pipe({ name: 'toFiat' })
export class ToFiatPipe implements PipeTransform {
  constructor(
    private txFormatProvider: TxFormatProvider
  ) {}
  transform(value: string, satoshis: number, coin: string): any {
    return this.txFormatProvider.formatAmountStr(coin, satoshis);
  }
}