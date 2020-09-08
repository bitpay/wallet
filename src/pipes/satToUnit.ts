import { Pipe, PipeTransform } from '@angular/core';
import { Coin } from '../providers/currency/currency';
import { TxFormatProvider } from '../providers/tx-format/tx-format';

@Pipe({
  name: 'satToUnit',
  pure: false
})
export class SatToUnitPipe implements PipeTransform {
  constructor(private txFormatProvider: TxFormatProvider) {}
  transform(amount: number, coin: Coin) {
    return this.txFormatProvider.formatAmountStr(coin, amount);
  }
}
