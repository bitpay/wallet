'use strict';

angular.module('copay.footer').controller('FooterController', function($rootScope, $sce, $scope, $http) {

    if (config.themes && Array.isArray(config.themes) && config.themes[0]) {
      $scope.themes = config.themes;
    }
    else {
      $scope.themes = ['default'];
    }

    $scope.theme = 'css/tpl-' + $scope.themes[0] + '.css';

    $scope.change_theme = function(name) {
      $scope.theme = 'css/tpl-' + name + '.css';
    };
    $scope.version = copay.version;

    $scope.getVideoURL = function(copayer) {
      var vi = $rootScope.videoInfo[copayer]
      if (!vi) return;

      if ($rootScope.wallet.getOnlinePeerIDs().indexOf(copayer) === -1) {
        // peer disconnected, remove his video
        delete $rootScope.videoInfo[copayer]
        return;
      }

      var encoded = vi.url;
      var url = decodeURI(encoded);
      var trusted = $sce.trustAsResourceUrl(url);
      return trusted;
    };
  });
