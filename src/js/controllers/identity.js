'use strict';

angular.module('copayApp.controllers').controller('identityController', 
  function($rootScope, storageService, gettextCatalog, lodash) {
    var self = this;
    var MAX_DISPLAY_LENGTH = 20; // display ellipsis if longer

    self.id = $rootScope.identityId;

    storageService.getIdentity(self.id, function(err, identity) {
      if (err) return;
      if (!identity) identity = {};
      if (!identity.claims) identity.claims = {};
      if (!identity.claims.address) identity.claims.address = {};

      var header = [
        { member: 'header', type: 'JSON object', label: 'Overview' },
        { member: 'id', type: 'string', label: 'ID', required: true, isID: true, description: 'ID assigned by Copay user to this identity'},
        { member: 'issuer', type: 'string', label: 'Issuer', required: true, description: 'Creator of this idenity'},
        { member: 'signature', type: 'string', label: 'Signature', required: true, description: 'Cryptographic signature for this identity'},
        { member: 'exp', type: 'number', label: 'Expiration', format: 'date', required: true, description: 'Expiration time on or after which the ID Token MUST NOT be accepted for processing. The processing of this parameter requires that the current date/time MUST be before the expiration date/time listed in the value. Implementers MAY provide for some small leeway, usually no more than a few minutes, to account for clock skew. Its value is a JSON [RFC7159] number representing the number of seconds from 1970-01-01T00:00:00Z as measured in UTC until the date/time. See RFC 3339 [RFC3339] for details regarding date/times in general and UTC in particular.'}
      ];

      // http://openid.net/specs/openid-connect-basic-1_0.html#StandardClaims
      // plus localizable labels and formats
      var dates = [
       { member: 'updated_at', type: 'number', label: 'Last updated', format: 'date', required: true, description: 'Time the End-User information was last updated. Its value is a JSON number representing the number of seconds from 1970-01-01T00:00:00Z as measured in UTC until the date/time.'},
      ];

      var pii = [
        { member: 'pii', type: 'JSON object', label: 'Personal Information'},
        { member: 'sub', type: 'string', label: 'User ID at Issuer', description: 'Subject - Identifier for the End-User at the Issuer.'},
        { member: 'name', type: 'string', label: 'Full Name', description: 'End-User full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User locale and preferences.'},
        { member: 'given_name', type: 'string', label: 'First Name', description: 'Given name(s) or first name(s) of the End-User. Note that in some cultures, people can have multiple given names; all can be present, with the names being separated by space characters.'},
        { member: 'middle_name', type: 'string', label: 'Middle Name', description: 'Middle name(s) of the End-User. Note that in some cultures, people can have multiple middle names; all can be present, with the names being separated by space characters. Also note that in some cultures, middle names are not used.'},
        { member: 'family_name', type: 'string', label: 'Last Name', description: 'Surname(s) or last name(s) of the End-User. Note that in some cultures, people can have multiple family names or no family name; all can be present, with the names being separated by space characters.'},
        { member: 'nickname', type: 'string', label: 'Nickname', description: 'Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael.'},
        { member: 'preferred_username', type: 'string', label: 'Preferred Name', description: 'Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe. This value MAY be any valid JSON string including special characters such as @, /, or whitespace. The RP MUST NOT rely upon this value being unique, as discussed in Section 2.5.3.'},
        { member: 'profile', type: 'string', label: 'Profile URL', description: 'URL of the End-User profile page. The contents of this Web page SHOULD be about the End-User.'},
        { member: 'picture', type: 'string', label: 'Picture URL', description: 'URL of the End-User profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image. Note that this URL SHOULD specifically reference a profile photo of the End-User suitable for displaying when describing the End-User, rather than an arbitrary photo taken by the End-User.'},
        { member: 'website', type: 'string', label: 'Website URL', description: 'URL of the End-User Web page or blog. This Web page SHOULD contain information published by the End-User or an organization that the End-User is affiliated with.'},
        { member: 'email', type: 'string', label: 'Email address', description: 'End-User preferred e-mail address. Its value MUST conform to the RFC 5322 [RFC5322] addr-spec syntax. The RP MUST NOT rely upon this value being unique, as discussed in Section 2.5.3.'},
        { member: 'email_verified', type: 'verified', label: 'Email Status', description: 'True if the End-User e-mail address has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this e-mail address was controlled by the End-User at the time the verification was performed. The means by which an e-mail address is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating.'},
        { member: 'gender', type: 'string', label: 'Gender', description: 'End-User gender. Values defined by this document are female and male. Other values MAY be used when neither of the defined values are applicable.'},
        { member: 'birthdate', type: 'string', label: 'Birthday', description: 'End-User birthday, represented as an ISO 8601:2004 [ISO8601‑2004] YYYY-MM-DD format. The year MAY be 0000, indicating that it is omitted. To represent only the year, YYYY format is allowed. Note that depending on the underlying platform date related function, providing just year can result in varying month and day, so the implementers need to take this factor into account to correctly process the dates.'},
        { member: 'zoneinfo', type: 'string', label: 'Timezone', description: 'String from zoneinfo [zoneinfo] time zone database representing the End-User time zone. For example, Europe/Paris or America/Los_Angeles.'},
        { member: 'locale', type: 'string', label: 'Locale', description: 'End-User locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; Relying Parties MAY choose to accept this locale syntax as well.'},
        { member: 'phone_number', type: 'string', label: 'Phone', description: 'End-User preferred telephone number. E.164 [E.164] is RECOMMENDED as the format of this Claim, for example, +1 (425) 555-1212 or +56 (2) 687 2400. If the phone number contains an extension, it is RECOMMENDED that the extension be represented using the RFC 3966 [RFC3966] extension syntax, for example, +1 (604) 555-1234;ext=5678.'},
        { member: 'phone_number_verified', type: 'verified', label: 'Phone Status', description: 'True if the End-User phone number has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this phone number was controlled by the End-User at the time the verification was performed. The means by which a phone number is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating. When true, the phone_number Claim MUST be in E.164 format and any extensions MUST be represented in RFC 3966 format.'},
       ];

      var address = [
        { member: 'address', type: 'JSON object', label: 'Address', description: 'End-User preferred postal address. The value of the address member is a JSON [RFC4627] structure containing some or all of the members defined in Section 2.5.1.'},
        { member: 'formatted', type: 'string', label: 'Mailing address', description: 'Full mailing address, formatted for display or use on a mailing label. This field MAY contain multiple lines, separated by newlines. Newlines can be represented either as a carriage return/line feed pair ("\r\n") or as a single line feed character ("\n").'},
        { member: 'street_address', type: 'string', label: 'Street', description: 'Full street address component, which MAY include house number, street name, Post Office Box, and multi-line extended street address information. This field MAY contain multiple lines, separated by newlines. Newlines can be represented either as a carriage return/line feed pair ("\r\n") or as a single line feed character ("\n").'},
        { member: 'locality', type: 'string', label: 'City', description: 'City or locality component.'},
        { member: 'region', type: 'string', label: 'State', description: 'State, province, prefecture, or region component.'},
        { member: 'postal_code', type: 'string', label: 'Zip code', description: 'Zip code or postal code component.'},
        { member: 'country', type: 'string', label: 'Country', description: 'Country name component.'}
      ];

      // transform and combine each schema with identity node
      function transform(schema, path, isEditable, always, never) {
        var node = lodash.get(identity, path) || identity || {};
        lodash.forEach(schema, function (s) {
          s.updateClaim = function(identity, newValue) {
            var node = lodash.get(identity, path) || identity || {};
            node[s.member] = newValue;
          };
          s.removeClaim = function(identity) {
            var node = lodash.get(identity, path) || identity || {};
            delete node[s.member];
          };

          s.label = gettextCatalog.getString(s.label);
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

      var isEditable = (identity.issuer == 'self-signed');
      transform(header, null, false, ['id'], []);
      transform(dates, 'claims', false, [], []);
      transform(pii, 'claims', isEditable, [], []);
      transform(address, 'claims.address', isEditable, [], []);

      self.identity = lodash.union(header, dates, pii, address);
      self.identity = lodash.filter(self.identity, function(i) {
        return i.isObject || i.isEditable || !i.isUndefined;
      });
      self.identity.id = identity.id;
    });

    self.editIdentityClaim = function(id, claim) {
      if (!id || !claim || !claim.isEditable) return;
      $rootScope.identityId = id;
      $rootScope.identityClaim = claim;
      $rootScope.$root.go('identityClaim');
    };
  });
