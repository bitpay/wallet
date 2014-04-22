'use strict';

angular.module('copay')
  .directive('validAddress', [function() {

    var bitcore = require('bitcore');
    var Address = bitcore.Address;

    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var validator = function(value){
          var a = new Address(value);
          ctrl.$setValidity('validAddress', a.isValid());
          return value;
        };

        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);
      }
    };
  }]);

