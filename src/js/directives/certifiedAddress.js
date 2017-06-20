'use strict';

angular.module('copayApp.directives')
  .directive('certifiedAddress', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/certifiedAddress.html',
      transclude: true,
      scope: {
        address: '=address',
        verified: '=verified',
        unverifiedAccepted: '=unverifiedAccepted',
        showVerification: '=showVerification'
      }
    };
  });
