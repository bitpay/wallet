import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'satToUnit',
  pure: false
})
export class SatToUnitPipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {}
  transform(amount: number, coin: string): any {
    return (
      this.decimalPipe.transform(amount / 1e8, '1.2-6') +
      ' ' +
      coin.toUpperCase()
    );
  }
}
