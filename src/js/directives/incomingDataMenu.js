'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope, $state, externalLinkService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
          $timeout(function() {
            scope.data = data.data;
            scope.type = data.type;
            scope.showMenu = true;

            console.log('scope.type', scope.type);
            if(scope.type === 'url') {
              console.log('scope.data', scope.data);
              console.log('scope.data.indexOf("https://")', scope.data.indexOf('https://'));
              if(scope.data.indexOf('https://') === 0) {
                scope.https = true;
              }
            }

            console.log('data', data);
          });
        });
        scope.hide = function() {
          scope.showMenu = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
        scope.goToUrl = function(url){
          externalLinkService.open(url);
        };
        scope.sendPaymentToAddress = function(bitcoinAddress) {
          scope.showMenu = false;
          $state.go('tabs.send').then(function() {
            $timeout(function() {
              $state.transitionTo('tabs.send.amount', {toAddress: bitcoinAddress});
            }, 50);
          });
        };
        scope.addToAddressBook = function(bitcoinAddress) {
          scope.showMenu = false;
          $timeout(function() {
            $state.go('tabs.send').then(function() {
              $timeout(function() {
                $state.transitionTo('tabs.send.addressbook', {addressbookEntry: bitcoinAddress});
              });
            });
          }, 100);
        };
      }
    };
  });
