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
  .filter('limitAddress', function() {
    return function(elements, showAll) {
      if (elements.length <= 1 || showAll) {
        return elements;
      }

      // Show last 3 non-change addresses plus those with balance
      var addrs = elements.filter(function(e, i) {
        return (!e.isChange && i < 3) || (e.balance && e.balance > 0);
      });

      return addrs;
    };
  })
  .filter('noFractionNumber',
  [ '$filter', '$locale',
  function(filter, locale) {
    var numberFilter = filter('number');
    var formats = locale.NUMBER_FORMATS;
    return function(amount, fraction) {
      var value = numberFilter(amount, fraction);
      var sep = value.indexOf(formats.DECIMAL_SEP);
      var group = value.indexOf(formats.GROUP_SEP);
      if(amount >= 0) {
        if (group > 0) {
          return value.substring(0, sep);
        }
        else {
          value = parseFloat(value);
          if(value % 1 === 0) {
            value = value.toFixed(0);
          }
          return value;
        }
      }
      return 0;
    };
  } ]);
