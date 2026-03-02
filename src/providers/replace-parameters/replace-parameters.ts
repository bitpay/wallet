/*
 * Example of use:
 * let message = this.replaceParametersProvider.replace(this.translate.instant('A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'), { amountBelowFeeStr: amountBelowFeeStr, coin: this.tx.coin.toUpperCase() });
 */

import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable()
export class ReplaceParametersProvider {
  constructor() {}

  public replace(stringToReplace: string, params): string {
    let processedParams = [];
    for (let key in params) {
      processedParams.push({ key, value: params[key] });
    }

    processedParams.forEach(param => {
      stringToReplace = _.replace(
        stringToReplace,
        new RegExp('{{' + param.key + '}}', 'g'),
        param.value
      );
      stringToReplace = _.replace(
        stringToReplace,
        new RegExp('{{ ' + param.key + ' }}', 'g'),
        param.value
      );
    });
    return stringToReplace;
  }
}
