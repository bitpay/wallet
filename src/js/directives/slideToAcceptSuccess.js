'use strict';

angular.module('copayApp.directives')
  .directive('slideToAcceptSuccess', function($timeout, platformInfo) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/slideToAcceptSuccess.html',
      transclude: true,
      scope: {
        isShown: '=slideSuccessShow',
        onConfirm: '&slideSuccessOnConfirm',
        hideOnConfirm: '=slideSuccessHideOnConfirm'
      },
      link: function(scope, element, attrs) {

        scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

        var elm = element[0];
        elm.style.display = 'none';
        scope.$watch('isShown', function() {
          if (scope.isShown) {
            elm.style.display = 'flex';
            $timeout(function() {
              scope.fillScreen = true;
            }, 10);
          }
        });
        scope.onConfirmButtonClick = function() {
          scope.onConfirm();
          if (scope.hideOnConfirm) {
            scope.fillScreen = false;
            elm.style.display = 'none';
          }
        };
      }
    };
  });
