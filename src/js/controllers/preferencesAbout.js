'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, $ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('About Copay'));

    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;
  });
