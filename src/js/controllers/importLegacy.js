'use strict';

angular.module('copayApp.controllers').controller('importLegacyController',
  function($rootScope, $scope, $log, $timeout, notification, legacyImportService, profileService, go, lodash, bitcore, gettext, gettextCatalog) {

    var self = this;
    self.messages = [];
    self.fromCloud = true;
    self.server = "https://insight.bitpay.com:443/api/email";


    $rootScope.$on('Local/ImportStatusUpdate', function(event, status) {
      $timeout(function() {
        $log.debug(status);

        self.messages.unshift({
          message: status,
        });

        var op = 1;
        lodash.each(self.messages, function(m) {
          if (op < 0.1) op = 0.1;
          m.opacity = op;
          op = op - 0.15;
        });
      }, 100);
    });

    self.scan = function(ids) {
      $log.debug('### Scaning: ' + ids)
      var i = 0;
      lodash.each(ids, function(id) {
        $rootScope.$emit('Local/WalletImported', id);
        if (++i == ids.length) {
          go.walletHome();
        };
      });
    };


    self.import = function(form) {
      var username = form.username.$modelValue;
      var password = form.password.$modelValue;
      var serverURL = form.server.$modelValue;
      var fromCloud = form.fromCloud.$modelValue;

      self.error = null;
      self.importing = true;
      $timeout(function() {
        legacyImportService.import(username, password, serverURL, fromCloud, function(err, ids, toScanIds) {
          if (err || !ids || !ids.length) {
            self.importing = false;
            self.error = err || gettext('Failed to import wallets');
            return;
          }

          notification.success( gettextCatalog.getString('{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance', {len: ids.length}));
          self.scan(toScanIds);
        });
      }, 100);
    };
    // TODO destroy event...
  });
