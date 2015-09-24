'use strict';

angular.module('copayApp.controllers').controller('createIdentityController',
  function($rootScope, storageService, gettext, lodash) {

    var self = this;

    self.init = function() {
      delete self.id;
      delete self.error;
      storageService.getIdentityIDs(function(err, idlist) {
        if (err) {
          self.error = err;
        } else {
          self.id = '' + Date.now();
          var idBase = gettext('Shipping address');
          for (var iter = 1; iter < 10; iter++) {
            var id = idBase + (iter > 1 ? ' ' + iter : '');
            if (!lodash.includes(idlist, id)) {
              self.id = id;
              return;
            }
          }
        }
      });
    };

    self.create = function(form) {
      var self = this;
      if (form && form.$invalid) {
        self.error = gettext('Please enter a new identity ID');
        return;
      }
      var id = form.identityID.$modelValue;
      var emptyIdentity = {
        issuer: gettext('self'),
        signature: '44ec786135ac047d4dd6d011f79157e21c4dbd4d',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        claims: {
          sub: gettext('self'),
          updated_at: Math.floor(Date.now() / 1000),
        }
      };
      storageService.getIdentityIDs(function(err, idlist) {
        if (err) {
          self.error = err;
        } else if (idlist && lodash.includes(idlist, id)) {
          self.error = gettext('ID already exists')
        } else {
          storageService.setIdentity(id, emptyIdentity, function(err) {
            if (err) {
              self.error = err;
            } else {
              $rootScope.identityID = id;
              $rootScope.$root.go('identity');
            }
          });
        }
      });
    };
  });
