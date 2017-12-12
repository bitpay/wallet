import { Injectable } from '@angular/core';
import * as _ from "lodash";

@Injectable()
export class FilterProvider {

  public formats: any;

  constructor() {
    console.log('Hello Filter Provider');
    this.formats = {
      CURRENCY_SYM: "$",
      DECIMAL_SEP: ".",
      GROUP_SEP: ","
    }
  }

  formatFiatAmount(amount: number) {
    var value: any;
    var sep: any;
    var group: any;
    var intValue: any;
    var floatValue: any;
    var finalValue: any;

    var fractionSize = 2;
    value = _.round(amount, fractionSize).toString();
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
