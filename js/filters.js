'use strict';

angular.module('copayApp.filters', [])
	.filter('amTimeAgo', ['amMoment', function(amMoment) {
    return function(input) {
      return amMoment.preprocessDate(input).fromNow();
    };
  }])
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
;
