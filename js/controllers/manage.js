'use strict';
angular.module('copayApp.controllers').controller('ManageController', function($scope, $rootScope, $location, controllerUtils, backupService) {
  $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

  $scope.downloadBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewBackup = function() {
    $scope.backupPlainText = backupService.profileEncrypted($rootScope.iden);
    $scope.hideViewBackup = true;
  };
});
