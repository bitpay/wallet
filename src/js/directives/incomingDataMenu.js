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
            scope.coin = data.coin;
            scope.showMenu = true;
            scope.https = false;

            if (scope.type === 'url') {
              if (scope.data.indexOf('https://') === 0) {
                scope.https = true;
              }
            }
          });
        });
        scope.hide = function() {
          scope.showMenu = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
        scope.goToUrl = function(url) {
          externalLinkService.open(url);
        };
        scope.sendPaymentToAddress = function(bitcoinAddress, coin) {
          scope.showMenu = false;
          $state.go('tabs.send').then(function() {
            $timeout(function() {
              $state.transitionTo('tabs.send.amount', {
                toAddress: bitcoinAddress,
                coin: coin || 'btc',
              });
            }, 50);
          });
        };
        scope.addToAddressBook = function(bitcoinAddress) {
          scope.showMenu = false;
          $timeout(function() {
            $state.go('tabs.send').then(function() {
              $timeout(function() {
                $state.transitionTo('tabs.send.addressbook', {
                  addressbookEntry: bitcoinAddress
                });
              });
            });
          }, 100);
        };
        scope.scanPaperWallet = function(privateKey) {
          scope.showMenu = false;
          $state.go('tabs.home').then(function() {
            $timeout(function() {
              $state.transitionTo('tabs.home.paperWallet', {
                privateKey: privateKey
              });
            }, 50);
          });
        };
      }
    };
  });
