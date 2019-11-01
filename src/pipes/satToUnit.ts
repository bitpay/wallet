import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { Coin, CurrencyProvider } from '../providers/currency/currency';

@Pipe({
  name: 'satToUnit',
  pure: false
})
export class SatToUnitPipe implements PipeTransform {
  constructor(
    private decimalPipe: DecimalPipe,
    private currencyProvider: CurrencyProvider
  ) {}
  transform(amount: number, coin: Coin) {
    const { unitToSatoshi } = this.currencyProvider.getPrecision(coin);
    return (
      this.decimalPipe.transform(amount / unitToSatoshi, '1.2-6') +
      ' ' +
      coin.toUpperCase()
    );
  }
}
