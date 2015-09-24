'use strict';

angular.module('copayApp.controllers').controller('identityController', 
  function($rootScope, storageService, gettext, lodash) {
    var self = this;
    var MAX_DISPLAY_LENGTH = 20; // display ellipsis if longer

    self.id = $rootScope.identityID;
    storageService.getIdentity(self.id, function(err, identity) {
      if (err) return;

      // add display-oriented members to schema
      var header = [
          { member: 'header', type: 'JSON object', label: 'Header' }
        ].concat(Identity._headerSchema);
      var pii = [
          { member: 'pii', type: 'JSON object', label: 'Personal Information'}
        ].concat(Identity._claimsSchema);
      var address = [
          { member: 'address', type: 'JSON object', label: 'Address' }
        ].concat(Identity._addressClaimsSchema);
      var other = [
        { member: 'other', type: 'JSON object', label: 'Other'}
      ].concat(Identity._otherClaimsSchema);

      // transform and combine each schema with identity node
      function transform(schema, path, isEditable, always, never) {
        var node = lodash.get(identity, path) || identity || {};
        lodash.forEach(schema, function (s) {
          s.updateClaim = function(obj, newValue) {
            self.initIdentity(obj);
            var node = lodash.get(obj, path) || obj || {};
            node[s.member] = newValue;
          };
          s.removeClaim = function(obj) {
            var node = lodash.get(obj, path) || obj || {};
            delete node[s.member];
          };

          s.label = gettext(s.label);
          s.value = node[s.member];
          if (s.format == 'date') {
            if (s.value) {
              s.value = (new Date(s.value * 1000)).toLocaleDateString();
            } else {
              s.value = undefined;
            }
          }

          s.isObject = (s.type == 'JSON object');
          s.isVerificationStatus = (s.type == 'verified');
          s.isUndefined = (typeof s.value == 'undefined');

          if (s.isObject) s.isEditable = false;
          else if (lodash.includes(always, s.member)) s.isEditable = true;
          else if (lodash.includes(never, s.member)) s.isEditable = false;
          else s.isEditable = isEditable;

          if (s.value && s.value.length > MAX_DISPLAY_LENGTH) {
            s.value = s.value.substring(0, MAX_DISPLAY_LENGTH - 1) + '...';
          }
        });
      };

      var isEditable = (identity.issuer == gettext('self'));
      transform(header, null, false, ['id'], []);
      transform(pii, 'claims', isEditable, [], []);
      transform(address, 'claims.address', isEditable, [], []);
      transform(other, 'claims', isEditable, [], []);

      self.identity = lodash.union(header, pii, address, other);
      self.identity = lodash.filter(self.identity, function(i) {
        return i.isObject || i.isEditable || !i.isUndefined;
      });
      self.identity.id = identity.id;
    });

    self.initIdentity = function(identity) {
      if (!identity) identity = {};
      if (!identity.claims) identity.claims = {};
      if (!identity.claims.address) identity.claims.address = {};
    };

    self.editIdentityClaim = function(id, claim) {
      if (!id || !claim || !claim.isEditable) return;
      $rootScope.identityId = id;
      $rootScope.identityClaim = claim;
      $rootScope.$root.go('identityClaim');
    };

    self.removeIdentity = function(id) {
      storageService.removeIdentity(id, function(err) {
        if (err) {
          self.error = err;
        } else {
          $rootScope.$root.go('identities');
        }
      });
    };
  });
