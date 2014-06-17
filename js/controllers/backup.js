'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, $location, $window, $timeout, $modal, backupService) {
    $scope.title = 'Backup';

    $scope.download = function() {
      backupService.download($rootScope.wallet);
    };

    $scope.openModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'backupModal.html',
        controller: ModalInstanceCtrl,
      });

      modalInstance.result.then(function(email) {
        backupService.sendEmail(email, $rootScope.wallet);
      });
    };

  });

var ModalInstanceCtrl = function($scope, $modalInstance) {

  $scope.submit = function(form) {
    $modalInstance.close($scope.email);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };
};
