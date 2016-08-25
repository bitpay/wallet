'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $state, $log, $ionicModal, profileService) {

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home');
      }
    });
  };

  this.openModal = function() {

    $ionicModal.fromTemplateUrl('views/modals/addressbook.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addressbookModal = modal;
      $scope.addressbookModal.show();
    });
  };

});
