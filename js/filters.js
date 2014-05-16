'use strict';

angular.module('copay.filters', [])
	.filter('amTimeAgo', ['amMoment', function(amMoment) {
  return function(input) {
    return amMoment.preprocessDate(input).fromNow();
  };
}]);