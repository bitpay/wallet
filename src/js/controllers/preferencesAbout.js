'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('About Copay'));
  });
