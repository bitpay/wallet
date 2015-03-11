'use strict';

angular.module('copayApp.controllers').controller('EmailConfirmationController', function($scope, $rootScope, $location) {
  $rootScope.fromEmailConfirmation = true;
  $location.path('/');
});
