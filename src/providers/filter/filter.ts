import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class FilterProvider {
  public formats: any;

  constructor(private decimalPipe: DecimalPipe, private logger: Logger) {
    this.logger.info('FilterProvider initialized');
    this.formats = {
      CURRENCY_SYM: '$',
      DECIMAL_SEP: '.',
      GROUP_SEP: ','
    };
  }

  formatFiatAmount(amount: number) {
    let value: any;
    let sep: any;
    let group: any;
    let intValue: any;
    let floatValue: any;
    let finalValue: any;

    value = this.decimalPipe.transform(amount);
    if (!value) return 0;
    sep = value.indexOf(this.formats.DECIMAL_SEP);
    group = value.indexOf(this.formats.GROUP_SEP);

    if (amount >= 0) {
      if (group > 0) {
        if (sep < 0) {
          return value;
        }
        intValue = value.substring(0, sep);
        floatValue = parseFloat(value.substring(sep));
        floatValue = floatValue.toFixed(2);
        floatValue = floatValue.toString().substring(1);
        finalValue = intValue + floatValue;
        return finalValue;
      } else {
        value = parseFloat(value);
        return value.toFixed(2);
      }
    }
    return 0;
  }
}
