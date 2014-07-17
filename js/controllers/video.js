'use strict';

angular.module('copayApp.controllers').controller('VideoController', 
  function($scope, $rootScope, $sce) {

  $scope.getVideoURL = function(copayer) {
    if (config.disableVideo) return;

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

