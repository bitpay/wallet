'use strict';

angular.module('copayApp.controllers').controller('identityClaimController', 
  function($scope, $rootScope, gettextCatalog, storageService) {
    var self = this;

    delete self.error;
    self.id = $rootScope.identityId;
    self.claim = $rootScope.identityClaim;

    self.updateClaim = function() {
      delete self.error;
      var form = $scope.claimForm;
      if (form && form.claimValue) {
        var newValue = form.claimValue.$modelValue;
        if (newValue != self.claim.value) {
          storageService.getIdentity(self.id, function(err, identity) {
            if (err) {
              self.error = err;
            } else if (identity) {
              self.claim.updateClaim(identity, newValue);
              storageService.setIdentity(self.id, identity, function(err) {
                if (err) {
                  self.error = err;
                } else {
                  self.claim.value = newValue;
                  $rootScope.$root.go('identity');
                }
              });
            }
          });
        }
      }
    };

    self.removeClaim = function() {
      delete self.error;
      if (self.claim.required) {
        self.error = gettextCatalog('Cannot remove');
      } else {
        storageService.getIdentity(self.id, function(err, identity) {
          if (err) {
            self.error = err;
          } else if (identity) {
            self.claim.removeClaim(identity);
            storageService.setIdentity(self.id, identity, function(err) {
              if (err) {
                self.error = err;
              } else {
                delete self.claim;
                $rootScope.$root.go('identity');
              }
            });
          }
        });
      }
    };
  });
