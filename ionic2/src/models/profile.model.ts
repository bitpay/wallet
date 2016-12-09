export class Profile {

  version = '1.0.0';

  createdOn: any = Date.now();
  credentials: any = [];
  disclaimerAccepted: boolean = false;
  checked: any = {};
  checkedUA: any = {};

  dirty: boolean = false;

  constructor(opts?) {
    opts = opts || {};

    this.createdOn = Date.now();
    this.credentials = opts.credentials || [];
    this.checked = {};
  }

  static fromObj(obj) {
    var x = new Profile();

    x.createdOn = obj.createdOn;
    x.credentials = obj.credentials;
    x.disclaimerAccepted = obj.disclaimerAccepted;
    x.checked = obj.checked || {};
    x.checkedUA = obj.checkedUA || {};

    if (x.credentials[0] && typeof x.credentials[0] != 'object')
      throw ("credentials should be an object");

    return x;
  }

  static fromString(str) {
    return Profile.fromObj(JSON.parse(str));
  };

  toObj() {
    delete this.dirty;
    return JSON.stringify(this);
  }

  hasWallet(walletId) {
    for (var i in this.credentials) {
      var c = this.credentials[i];
      if (c.walletId == walletId) return true;
    };
    return false;
  }

  isChecked(ua, walletId) {
    return !!(this.checkedUA == ua && this.checked[walletId]);
  }

  isDeviceChecked(ua) {
    return this.checkedUA == ua;
  }

  setChecked(ua, walletId) {
    if (this.checkedUA != ua) {
      this.checkedUA = ua;
      this.checked = {};
    }
    this.checked[walletId] = true;
    this.dirty = true;
  };


  addWallet(credentials) {
    if (!credentials.walletId)
      throw 'credentials must have .walletId';

    if (this.hasWallet(credentials.walletId))
      return false;

    this.credentials.push(credentials);
    this.dirty = true;
    return true;
  };

  updateWallet(credentials) {
    if (!credentials.walletId)
      throw 'credentials must have .walletId';

    if (!this.hasWallet(credentials.walletId))
      return false;

    this.credentials = this.credentials.map(function(c) {
      if(c.walletId != credentials.walletId ) {
        return c;
      } else {
        return credentials
      }
    });

    this.dirty = true;
    return true;
  };

  deleteWallet(walletId) {
    if (!this.hasWallet(walletId))
      return false;

    this.credentials = this.credentials.filter(function(c) {
      return c.walletId != walletId;
    });

    this.dirty = true;
    return true;
  };

}
