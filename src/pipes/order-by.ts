/*
 * Example use
 *		Basic Array of single type: *ngFor="#todo of todoService.todos | orderBy : '-'"
 *		Multidimensional Array Sort on single column: *ngFor="#todo of todoService.todos | orderBy : ['-status']"
 *		Multidimensional Array Sort on multiple columns: *ngFor="#todo of todoService.todos | orderBy : ['status', '-title']"
 *    With an object with objects: *ngFor="let item of (itemsObject | keys : 'date') | orderBy : ['-order']"
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
  pure: false
})
export class OrderByPipe implements PipeTransform {
  static _orderByComparator(a, b): number {
    if (
      isNaN(parseFloat(a)) ||
      !isFinite(a) ||
      isNaN(parseFloat(b)) ||
      !isFinite(b)
    ) {
      // Isn't a number so lowercase the string to properly compare
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      if (a.toLowerCase() > b.toLowerCase()) return 1;
    } else {
      // Parse strings as numbers to compare properly
      if (parseFloat(a) < parseFloat(b)) return -1;
      if (parseFloat(a) > parseFloat(b)) return 1;
    }

    return 0; // equal each other
  }

  transform(input, [config = '+']) {
    if (!Array.isArray(input)) return input;

    if (
      !Array.isArray(config) ||
      (Array.isArray(config) && config.length == 1)
    ) {
      var propertyToCheck: string = !Array.isArray(config) ? config : config[0];
      var desc = propertyToCheck.substr(0, 1) == '-';

      // Basic array
      if (
        !propertyToCheck ||
        propertyToCheck == '-' ||
        propertyToCheck == '+'
      ) {
        return !desc ? input.sort() : input.sort().reverse();
      } else {
        var property: string =
          propertyToCheck.substr(0, 1) == '+' ||
          propertyToCheck.substr(0, 1) == '-'
            ? propertyToCheck.substr(1)
            : propertyToCheck;

        return input.sort((a, b) => {
          if (a[property] && b[property]) {
            return !desc
              ? OrderByPipe._orderByComparator(a[property], b[property])
              : -OrderByPipe._orderByComparator(a[property], b[property]);
          } else if (a.value[property] && b.value[property]) {
            return !desc
              ? OrderByPipe._orderByComparator(
                  a.value[property],
                  b.value[property]
                )
              : -OrderByPipe._orderByComparator(
                  a.value[property],
                  b.value[property]
                );
          } else return 0;
        });
      }
    } else {
      // Loop over property of the array in order and sort
      return input.sort((a, b) => {
        for (var i: number = 0; i < config.length; i++) {
          let comparison = 0;
          var desc = config[i].substr(0, 1) == '-';
          var property =
            config[i].substr(0, 1) == '+' || config[i].substr(0, 1) == '-'
              ? config[i].substr(1)
              : config[i];

          if (a[property] && b[property]) {
            comparison = !desc
              ? OrderByPipe._orderByComparator(a[property], b[property])
              : -OrderByPipe._orderByComparator(a[property], b[property]);
          } else if (a.value[property] && b.value[property]) {
            comparison = !desc
              ? OrderByPipe._orderByComparator(
                  a.value[property],
                  b.value[property]
                )
              : -OrderByPipe._orderByComparator(
                  a.value[property],
                  b.value[property]
                );
          }

          // Don't return 0 yet in case of needing to sort by next property
          if (comparison != 0) return comparison;
        }

        return 0; // equal each other
      });
    }
  }
}
