import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCurrency'
})
export class FormatCurrencyPipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {}

  transform(amount: number, currencyCode: string) {
    const precision = this.getPrecision(currencyCode);
    const numericalValue = this.decimalPipe.transform(
      amount,
      this.getPrecisionString(precision)
    );
    const formattedValue = `${numericalValue} ${currencyCode}`;
    const finalValue =
      currencyCode.toUpperCase() === 'USD'
        ? `$${formattedValue}`
        : formattedValue;

    return finalValue;
  }
  getPrecision(currencyCode: string) {
    return currencyCode.toUpperCase() === 'JPY' ? 0 : 2;
  }
  getPrecisionString(precision: number) {
    return `1.${precision}-${precision}`;
  }
}
