'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $ionicPopup, profileService) {

  $scope.goImport = function() {
    $state.go('add.import.phrase', {
      fromOnboarding: true
    });
  }

});
