'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, confirmDialog, storageService, notification, profileService, isCordova, go, gettext, gettextCatalog, animationService) {
    var self = this;
    var fc = profileService.focusedClient;
    var msg = gettext('Are you sure you want to delete the backup words?');
    var successMsg = gettext('Backup words deleted');

    self.delete = function() {
      confirmDialog.show(msg,
        function(ok) {
          if (ok) {
            fc.clearMnemonic();
            profileService.updateCredentialsFC(function() {
              notification.success(successMsg);
              go.walletHome();
            });
          }
        });
    };

  });
