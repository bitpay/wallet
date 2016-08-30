'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, uxLanguage, $ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('About Copay'));
    $scope.lang = uxLanguage.currentLanguage;
  });
