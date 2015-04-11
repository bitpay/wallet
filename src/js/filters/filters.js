'use strict';

angular.module('copayApp.filters', [])
  .filter('amTimeAgo', ['amMoment',
    function(amMoment) {
      return function(input) {
        return amMoment.preprocessDate(input).fromNow();
      };
    }
  ])
  .filter('paged', function() {
    return function(elements) {
      if (elements) {
        return elements.filter(Boolean);
      }

      return false;
    };
  })
  .filter('removeEmpty', function() {
    return function(elements) {
      elements = elements || [];
      // Hide empty change addresses from other copayers
      return elements.filter(function(e) {
        return !e.isChange || e.balance > 0;
      });
    }
  })

.filter('noFractionNumber', ['$filter', '$locale', 'configService',
  function(filter, locale, configService) {
    var numberFilter = filter('number');
    var formats = locale.NUMBER_FORMATS;
    var config = configService.getSync().wallet.settings;
    return function(amount, n) {
      if (typeof(n) === 'undefined' && !config) return amount;

      var fractionSize = (typeof(n) !== 'undefined') ?
        n : config.unitToSatoshi.toString().length - 1;
      var value = numberFilter(amount, fractionSize);
      var sep = value.indexOf(formats.DECIMAL_SEP);
      var group = value.indexOf(formats.GROUP_SEP);
      if (amount >= 0) {
        if (group > 0) {
          if (sep < 0) {
            return value;
          }
          var intValue = value.substring(0, sep);
          var floatValue = parseFloat(value.substring(sep));
          if (floatValue === 0) {
            floatValue = '';
          } else {
            if (floatValue % 1 === 0) {
              floatValue = floatValue.toFixed(0);
            }
            floatValue = floatValue.toString().substring(1);
          }
          var finalValue = intValue + floatValue;
          return finalValue;
        } else {
          value = parseFloat(value);
          if (value % 1 === 0) {
            value = value.toFixed(0);
          }
          return value;
        }
      }
      return 0;
    };
  }
]);
