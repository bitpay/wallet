/*
 * Example use
 *  Simple: *ngFor="let item of giftCards | keys"
 *	With an object with objects: *ngFor="let item of (itemsObject | keys : 'date') | orderBy : ['-order']"
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keys'
})
export class KeysPipe implements PipeTransform {
  transform(value, orderBy?: string) {
    let keys = [];
    for (let key in value) {
      keys.push({
        key,
        value: value[key],
        order: orderBy ? value[key][orderBy] : null
      });
    }
    return keys;
  }
}
