'use strict';

function Identity() {
  this.version = '1.0.0';
};

Identity._headerSchema = [
  { member: 'issuer',
    type: 'text',
    label: 'Issuer Name',
    required: true,
    description: 'Creator of this idenity'},
  { member: 'iss',
    type: 'url',
    label: 'Issuer Identifier',
    description: 'Issuer Identifier for the Issuer of the response. The iss value is a case-sensitive URL using the https scheme that contains scheme, host, and optionally, port number and path components and no query or fragment components.'},
  { member: 'signature',
    type: 'text',
    label: 'Signature',
    required: true,
    description: 'Cryptographic signature for this identity'},
  { member: 'exp',
    type: 'number',
    label: 'Expiration',
    format: 'date',
    required: true,
    description: 'Expiration time on or after which the ID Token MUST NOT be accepted for processing. The processing of this parameter requires that the current date/time MUST be before the expiration date/time listed in the value. Implementers MAY provide for some small leeway, usually no more than a few minutes, to account for clock skew. Its value is a JSON [RFC7159] number representing the number of seconds from 1970-01-01T00:00:00Z as measured in UTC until the date/time. See RFC 3339 [RFC3339] for details regarding date/times in general and UTC in particular.'
  }
];

Identity._claimsSchema = [
  { member: 'sub',
    type: 'text',
    label: 'User ID at Issuer',
    description: 'Subject - Identifier for the End-User at the Issuer.',
    code: 'A' },
  { member: 'name',
    type: 'text',
    label: 'Full Name',
    description: 'End-User full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User locale and preferences.',
    code: 'B' },
  { member: 'given_name',
    type: 'text',
    label: 'First Name',
    description: 'Given name(s) or first name(s) of the End-User. Note that in some cultures, people can have multiple given names; all can be present, with the names being separated by space characters.',
    code: 'C' },
  { member: 'middle_name',
    type: 'text',
    label: 'Middle Name',
    description: 'Middle name(s) of the End-User. Note that in some cultures, people can have multiple middle names; all can be present, with the names being separated by space characters. Also note that in some cultures, middle names are not used.',
    code: 'D' },
  { member: 'family_name',
    type: 'text',
    label: 'Last Name',
    description: 'Surname(s) or last name(s) of the End-User. Note that in some cultures, people can have multiple family names or no family name; all can be present, with the names being separated by space characters.',
    code: 'E' },
  { member: 'nickname',
    type: 'text',
    label: 'Nickname',
    description: 'Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael.',
    code: 'F' },
  { member: 'preferred_username',
    type: 'text',
    label: 'Preferred Name',
    description: 'Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe. This value MAY be any valid JSON string including special characters such as @, /, or whitespace. The RP MUST NOT rely upon this value being unique, as discussed in Section 2.5.3.',
    code: 'G' },
  { member: 'profile',
    type: 'url',
    label: 'Profile URL',
    description: 'URL of the End-User profile page. The contents of this Web page SHOULD be about the End-User.',
    code: 'H' },
  { member: 'picture',
    type: 'url',
    label: 'Picture URL',
    description: 'URL of the End-User profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image. Note that this URL SHOULD specifically reference a profile photo of the End-User suitable for displaying when describing the End-User, rather than an arbitrary photo taken by the End-User.',
    code: 'I' },
  { member: 'website',
    type: 'url',
    label: 'Website URL',
    description: 'URL of the End-User Web page or blog. This Web page SHOULD contain information published by the End-User or an organization that the End-User is affiliated with.',
    code: 'J' },
  { member: 'email',
    type: 'email',
    label: 'Email address',
    description: 'End-User preferred e-mail address. Its value MUST conform to the RFC 5322 [RFC5322] addr-spec syntax. The RP MUST NOT rely upon this value being unique, as discussed in Section 2.5.3.',
    code: 'K' },
  { member: 'email_verified',
    type: 'verified',
    label: 'Email Status',
    description: 'True if the End-User e-mail address has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this e-mail address was controlled by the End-User at the time the verification was performed. The means by which an e-mail address is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating.',
    code: 'L' },
  { member: 'gender',
    type: 'text',
    label: 'Gender',
    description: 'End-User gender. Values defined by this document are female and male. Other values MAY be used when neither of the defined values are applicable.',
    code: 'M' },
  { member: 'birthdate',
    type: 'text',
    label: 'Birthday',
    description: 'End-User birthday, represented as an ISO 8601:2004 [ISO8601‑2004] YYYY-MM-DD format. The year MAY be 0000, indicating that it is omitted. To represent only the year, YYYY format is allowed. Note that depending on the underlying platform date related function, providing just year can result in varying month and day, so the implementers need to take this factor into account to correctly process the dates.',
    code: 'N' },
  { member: 'zoneinfo',
    type: 'text',
    label: 'Timezone',
    description: 'String from zoneinfo [zoneinfo] time zone database representing the End-User time zone. For example, Europe/Paris or America/Los_Angeles.',
    code: 'O' },
  { member: 'locale',
    type: 'text',
    label: 'Locale',
    description: 'End-User locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; Relying Parties MAY choose to accept this locale syntax as well.',
    code: 'P' },
  { member: 'phone_number',
    type: 'text',
    label: 'Phone',
    description: 'End-User preferred telephone number. E.164 [E.164] is RECOMMENDED as the format of this Claim, for example, +1 (425) 555-1212 or +56 (2) 687 2400. If the phone number contains an extension, it is RECOMMENDED that the extension be represented using the RFC 3966 [RFC3966] extension syntax, for example, +1 (604) 555-1234;ext=5678.',
    code: 'Q' },
  { member: 'phone_number_verified',
    type: 'verified',
    label: 'Phone Status',
    description: 'True if the End-User phone number has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this phone number was controlled by the End-User at the time the verification was performed. The means by which a phone number is verified is context specific, and dependent upon the trust framework or contractual agreements within which the parties are operating. When true, the phone_number Claim MUST be in E.164 format and any extensions MUST be represented in RFC 3966 format.',
    code: 'R' }
];

Identity._addressClaimsSchema = [
  { member: 'formatted',
    type: 'text',
    label: 'Mailing address',
    description: 'Full mailing address, formatted for display or use on a mailing label. This field MAY contain multiple lines, separated by newlines. Newlines can be represented either as a carriage return/line feed pair ("\r\n") or as a single line feed character ("\n").',
    code: 'S' },
  { member: 'street_address',
    type: 'text',
    label: 'Street',
    description: 'Full street address component, which MAY include house number, street name, Post Office Box, and multi-line extended street address information. This field MAY contain multiple lines, separated by newlines. Newlines can be represented either as a carriage return/line feed pair ("\r\n") or as a single line feed character ("\n").',
    code: 'T' },
  { member: 'locality',
    type: 'text',
    label: 'City',
    description: 'City or locality component.',
    code: 'U' },
  { member: 'region',
    type: 'text',
    label: 'State',
    description: 'State, province, prefecture, or region component.',
    code: 'V' },
  { member: 'postal_code',
    type: 'text',
    label: 'Zip code',
    description: 'Zip code or postal code component.',
    code: 'W' },
  { member: 'country',
    type: 'text',
    label: 'Country',
    description: 'Country name component.',
    code: 'X' }
];

// code Y = updated_at, would like it to appear on page at top, but
// appear in list at bottom
Identity._otherClaimsSchema = [
  { member: 'updated_at',
    type: 'number',
    label: 'Last updated',
    format: 'date',
    required: true,
    description: 'Time the End-User information was last updated. Its value is a JSON number representing the number of seconds from 1970-01-01T00:00:00Z as measured in UTC until the date/time.',
    code: 'Y' },
  { member: 'user_data',
    type: 'text',
    label: 'User-defined data',
    description: 'Extension to OpenID Connect protocol',
    code: 'Z' }
];

Identity.getFieldByCode = function(code) {
  var codeSchemas = [
    { entries: Identity._claimsSchema, prefix: '' },
    { entries: Identity._addressClaimsSchema, prefix: 'address.' },
    { entries: Identity._otherClaimsSchema, prefix: '' }
  ];
  var match;
  codeSchemas.forEach(function(schema) {
    function predicate(entry) { return (entry.code == code); };
    var entry = schema.entries.find(predicate);
    if (entry) {
      match = {
        member: schema.prefix + entry.member,
        label: entry.label
      };
      return false;
    }
  });
  return match;
};
