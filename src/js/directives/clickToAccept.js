'use strict';

angular.module('copayApp.directives')
  .directive('clickToAccept', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/clickToAccept.html',
      transclude: true,
      scope: {
        sendStatus: '=clickSendStatus',
        isDisabled: '=isDisabled',
      },
      link: function(scope, element, attrs) {
        scope.$watch('sendStatus', function() {
          if (scope.sendStatus !== 'success') {
            scope.displaySendStatus = scope.sendStatus;
          }
        });
      }
    };
  });
