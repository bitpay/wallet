/*
* Example of use:
* let message = this.customTranslateProvider.translate(this.translate.instant('A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'), { amountBelowFeeStr: amountBelowFeeStr, coin: this.tx.coin.toUpperCase() });
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable()
export class CustomTranslateProvider {

  constructor() {
  }

  public translate(stringToTranslate: string, params: any): string {
    let processedParams = [];
    for (let key in params) {
      processedParams.push({ key, value: params[key] });
    }

    processedParams.forEach(param => {
      stringToTranslate = _.replace(stringToTranslate, '{{' + param.key + '}}', param.value);
      stringToTranslate = _.replace(stringToTranslate, '{{ ' + param.key + ' }}', param.value);
    });
    return stringToTranslate;
  }

}
