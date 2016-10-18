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
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
        scope.sendPaymentToAddress = function(bitcoinAddress) {
          scope.showMenu = false;
          $state.go('tabs.send');
          $timeout(function() {
            $state.transitionTo('tabs.send.amount', {toAddress: bitcoinAddress});
          }, 100);
        };
        scope.addToAddressBook = function(bitcoinAddress) {
          scope.showMenu = false;
          $timeout(function() {
            $state.go('tabs.send');
            $timeout(function() {
              $state.transitionTo('tabs.send.addressbook', {addressbookEntry: bitcoinAddress});
            });
          }, 100);
        };
      }
    };
  });
