'use strict';

angular.module('copayApp.controllers').controller('VideoController', 
  function($scope, $rootScope, $sce) {

  $rootScope.videoInfo = {};
  
  // Cached list of copayers
  $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();

  $scope.copayersList = function() {
    return $rootScope.wallet.getRegisteredPeerIds();
  }

  $scope.hasVideo = function(copayer) {
    return $rootScope.videoInfo[copayer.peerId];
  }

  $scope.isConnected = function(copayer) {
    return $rootScope.wallet.getOnlinePeerIDs().indexOf(copayer.peerId) != -1;
  }

  $scope.isBackupReady = function(copayer) {
    return $rootScope.wallet.publicKeyRing.isBackupReady(copayer.copayerId);
  }

  $scope.getVideoURL = function(copayer) {
    if (config.disableVideo) return;

    var vi = $scope.videoInfo[copayer.peerId];
    if (!vi) return;

    if ($scope.isConnected(copayer)) {
      // peer disconnected, remove his video
      delete $rootScope.videoInfo[copayer.peerId];
      return;
    }

    var encoded = vi.url;
    var url = decodeURI(encoded);
    var trusted = $sce.trustAsResourceUrl(url);
    return trusted;
  };

});

