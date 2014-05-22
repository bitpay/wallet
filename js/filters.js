'use strict';

angular.module('copay.filters', [])
	.filter('amTimeAgo', ['amMoment', function(amMoment) {
    return function(input) {
      return amMoment.preprocessDate(input).fromNow();
    };
  }])
  .filter('groupByAddress', function() {
    return function(inputs) {
      function reduce(dic, input) {
        if(!dic[input.addr]) dic[input.addr] = 0;
        dic[input.addr] += input.value;
        return dic;
      }

      var dic = inputs.reduce(reduce, {});
      return Object.keys(dic).map(function(key) {
        return { addr: key, value: dic[key] };
      });
    };
  })
  .filter('paged', function() {
    return function(elements) {
      return elements.filter(Boolean);
    };
  });
