'use strict';

angular.module('copayApp.directives')
  .directive('contactSelector', function($timeout, addressbookService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/contactSelector.html',
      transclude: true,
      scope: {
        title: '=',
        show: '=',
        selectedContact: '=',
        onSelect: '='
      },
      link: function(scope, element, attrs) {
        addressbookService.list(function(err, contacts) {
          scope.contacts = contacts;
        });

        scope.hide = function() {
          scope.show = false;
        };

        scope.selectContact = function(contact) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(contact);
        };
      }
    };
  });
