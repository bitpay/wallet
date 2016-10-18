'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope, $state) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
          $timeout(function() {
            scope.data = data.data;
            scope.type = data.type;
            scope.showMenu = true;

            console.log('data', data);
          });
        });
        scope.hide = function() {
          scope.showMenu = false;
        };
        scope.sendPaymentToAddress = function(bitcoinAddress) {
          scope.hide();
          $state.go('tabs.send');
          $timeout(function() {
            $state.transitionTo('tabs.send.amount', {toAddress: bitcoinAddress});
          }, 100);
        };
        scope.$watch('showMenu', function() {
          if(!scope.showMenu) {
            $rootScope.$broadcast('incomingDataMenu.menuHidden');
          }
        });
      }
    };
  });
