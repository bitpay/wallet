import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCurrency'
})
export class FormatCurrencyPipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {}

  transform(
    amount: number,
    currencyCode: string,
    customPrecision?: number | 'minimal'
  ) {
    const precision =
      customPrecision === 'minimal'
        ? getMinimalPrecision(amount, currencyCode)
        : typeof customPrecision === 'number'
        ? customPrecision
        : getPrecision(currencyCode);
    const numericValue = this.decimalPipe.transform(
      amount,
      getPrecisionString(precision)
    );
    const symbolMap = {
      BRL: 'R$',
      CAD: 'C$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      JPY: '¥',
      PHP: '₱',
      USD: '$'
    };
    const symbol = symbolMap[currencyCode.toUpperCase()];
    const finalValue = symbol
      ? `${symbol}${numericValue}`
      : `${numericValue} ${currencyCode}`;

    return finalValue;
  }
}

function getPrecision(currencyCode: string) {
  return currencyCode.toUpperCase() === 'JPY' ? 0 : 2;
}
function getMinimalPrecision(amount: number, currencyCode: string) {
  return Number.isInteger(amount) ? 0 : getPrecision(currencyCode);
}
function getPrecisionString(precision: number) {
  return `1.${precision}-${precision}`;
}
