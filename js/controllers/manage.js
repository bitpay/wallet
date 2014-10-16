'use strict';
angular.module('copayApp.controllers').controller('ManageController', function($scope, $rootScope, $location, controllerUtils, backupService) {

  $scope.downloadBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };
});
