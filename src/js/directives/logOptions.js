'use strict';

angular.module('copayApp.directives')
  .directive('logOptions', function($timeout, platformInfo) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/logOptions.html',
      transclude: true,
      scope: {
        show: '=logOptionsShow',
        options: '=logOptions',
        fillClass: '=logOptionsFillClass',
        onSelect: '=logOptionsOnSelect',
        onCopy: '=logOptionsOnCopy',
        onSend: '=logOptionsOnSend'
      },
      link: function(scope, element, attrs) {
        scope.isCordova = platformInfo.isCordova;

        scope.hide = function() {
          scope.show = false;
        };

        scope.getFillClass = function(index) {
          scope.onSelect(index);
        };
      }
    };
  });
