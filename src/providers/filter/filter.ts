import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class FilterProvider {
  public formats;

  constructor(private decimalPipe: DecimalPipe, private logger: Logger) {
    this.logger.debug('FilterProvider initialized');
    this.formats = {
      CURRENCY_SYM: '$',
      DECIMAL_SEP: '.',
      GROUP_SEP: ','
    };
  }

  formatFiatAmount(amount: number): string {
    let value: string;
    let sep: number;
    let group: number;
    let intValue: string;
    let floatValueNumber: number;
    let floatValueString: string;
    let finalValue: string;

    value = this.decimalPipe.transform(amount);
    if (!value) return '0';
    sep = value.indexOf(this.formats.DECIMAL_SEP);
    group = value.indexOf(this.formats.GROUP_SEP);

    if (amount >= 0) {
      if (group > 0) {
        if (sep < 0) {
          return value;
        }
        intValue = value.substring(0, sep);
        floatValueNumber = parseFloat(value.substring(sep));
        floatValueString = floatValueNumber.toFixed(2);
        floatValueString = floatValueString.substring(1);
        finalValue = intValue + floatValueString;
        return finalValue;
      } else {
        value = parseFloat(value).toFixed(2).toString();
        return value;
      }
    }
    return '0';
  }
}
