'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $version, $ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('About Copay'));

    $scope.version = $window.version;
    $scope.commit = $window.commitHash;
  });
