import { Pipe, PipeTransform } from '@angular/core';
import { Coin, TxFormatProvider } from '../providers';


@Pipe({
  name: 'satToUnit',
  pure: false
})
export class SatToUnitPipe implements PipeTransform {
  constructor(private txFormatProvider: TxFormatProvider) { }
  transform(amount: number, coin: Coin | any) {
    return this.txFormatProvider.formatAmountStr(coin, amount);
  }
}
