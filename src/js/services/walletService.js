'use strict';

angular.module('copayApp.services').factory('walletService',
  function($rootScope, profileService) {
    var root = {};

    var updateStatus = function(cb) {
      profileService.focusedClient.getStatus(function(err, walletStatus) {
        $rootScope.$emit('newFocusedWallet', walletStatus);
        return cb();
      });
    };

    root.createAddress = function(cb) {
      profileService.focusedClient.createAddress(function(err, res) {
        return cb(err, res);
      });
    };

    root.getMainAddresses = function(cb) {
      profileService.focusedClient.getMainAddresses({}, function(err, res) {
        return cb(err, res);
      });
    };

    root.sendTransaction = function(tx, cb) {
      profileService.focusedClient.sendTransaction(tx, function(err, res) {
        updateStatus(function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.signTransaction = function(txp, cb) {
      profileService.focusedClient.signTransaction(txp, function(err, res) {
        updateStatus(function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.rejectTransaction = function(txp, cb) {
      profileService.focusedClient.rejectTransaction(txp, function(err, res) {
        updateStatus(function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.broadcastTransaction = function(txp, cb) {
      profileService.focusedClient.broadcastTransaction(txp, function(err, res) {
        updateStatus(function(e, r) {
          return cb(err, res);
        });
      });
    };

    root.getHistory = function(cb) {
      profileService.focusedClient.getHistory(function(err, res) {
        return cb(err, res);
      });
    };

    root.getBalance = function(cb) {
      profileService.focusedClient.getBalance(function(err, res) {
        updateStatus(function(e, r) {
          return cb(err, res);
        });
      })
    };

    return root;
  });
