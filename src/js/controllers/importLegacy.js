'use strict';

angular.module('copayApp.controllers').controller('importLegacyController',
  function($rootScope, $scope, $log, $timeout, notification, legacyImportService, profileService, go, lodash) {

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
      $log.debug('Scaning: ' + ids)
      var i = 0;
      lodash.each(ids, function(id) {
        console.log('[importLegacy.js.20:id:]', id); //TODO
        $rootScope.$emit('Local/ImportStatusUpdate',
          'Scanning funds for wallet ' + id + ' ...  TODO...');

        profileService.scan(id, function(err) {
          $rootScope.$emit('Local/ImportStatusUpdate',
            '... scan for wallet ' + id + ' finished.');

          i++;
          if (i == ids.length) {
            go.walletHome();
          };
        });
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
        legacyImportService.import(username, password, serverURL, fromCloud, function(err, ids) {
          if (err || ! ids || !ids.length) {
            self.importing = false;
            self.error = err || 'Failed to import wallets';
            $rootScope.$apply();
            return;
          }
          self.scan(ids);
        });
      }, 100);
    };
    // TODO destroy event...
  });
