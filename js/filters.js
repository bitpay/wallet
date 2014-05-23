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
  })
  .filter('limitAddress', function() {
    return function(elements, showAll) {
      var addrs = [];
      if (elements.length > 0) {
        if (showAll) {
          return elements;
        }
        if (elements.length == 1) {
          return elements;
        }
        else {
          for (var i=0;i<elements.length;i++) {
            if (!elements[i].isChange && (!elements[i].balance || elements[i].balance == 0)) {
              addrs.push(elements[i]);
              break;
            }
          }
          
          for (var i=0;i<elements.length;i++) {
            if (elements[i].balance && elements[i].balance > 0) {
              addrs.push(elements[i]);
            }
          }
          return addrs; 
        }
      }
    };
  })
  .filter('withoutFunds', function() {
    return function(elements) {
      var len = 0;
      for (var i=0;i<elements.length;i++) {
        if (!elements[i].balance || elements[i].balance == 0) {
          len++;
        }
      }
      return len;
    };
  })
;
