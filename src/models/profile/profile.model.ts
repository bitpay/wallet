export class Profile {
  public version: string;
  public createdOn: number;
  public credentials;
  public disclaimerAccepted: boolean;
  public onboardingCompleted: boolean;
  public checked;
  public checkedUA?;
  public dirty: boolean;

  constructor() {
    this.version = '1.0.0';
  }

  public create(opts?): Profile {
    opts = opts ? opts : {};
    let x = new Profile();
    x.createdOn = Date.now();
    x.credentials = opts.credentials || [];
    x.disclaimerAccepted = false;
    x.onboardingCompleted = false;
    x.checked = {};
    return x;
  }

  public fromObj(obj): Profile {
    let x = new Profile();

    x.createdOn = obj.createdOn;
    x.credentials = obj.credentials;
    x.disclaimerAccepted = obj.disclaimerAccepted;
    x.onboardingCompleted = obj.onboardingCompleted;
    x.checked = obj.checked || {};
    x.checkedUA = obj.checkedUA || {};

    if (x.credentials[0] && typeof x.credentials[0] != 'object')
      throw new Error('credentials should be an object');
    return x;
  }

  public fromString(str: string): Profile {
    return this.fromObj(JSON.parse(str));
  }

  public toObj(): string {
    delete this.dirty;
    return JSON.stringify(this);
  }

  public hasWallet(walletId: string): boolean {
    for (let i in this.credentials) {
      let c = this.credentials[i];
      if (c.walletId == walletId) return true;
    }
    return false;
  }

  public isChecked(ua, walletId: string): boolean {
    return !!(this.checkedUA == ua && this.checked[walletId]);
  }

  public isDeviceChecked(ua): boolean {
    return this.checkedUA == ua;
  }

  public setChecked(ua, walletId: string): void {
    if (this.checkedUA != ua) {
      this.checkedUA = ua;
      this.checked = {};
    }
    this.checked[walletId] = true;
    this.dirty = true;
  }

  public addWallet(credentials): boolean {
    if (!credentials.walletId)
      throw new Error('credentials must have .walletId');

    if (this.hasWallet(credentials.walletId)) return false;

    this.credentials.push(credentials);
    this.dirty = true;
    return true;
  }

  public updateWallet(credentials): boolean {
    if (!credentials.walletId)
      throw new Error('credentials must have .walletId');

    if (!this.hasWallet(credentials.walletId)) return false;

    this.credentials = this.credentials.map(c => {
      if (c.walletId != credentials.walletId) {
        return c;
      } else {
        return credentials;
      }
    });

    this.dirty = true;
    return true;
  }

  public deleteWallet(walletId: string): boolean {
    if (!this.hasWallet(walletId)) return false;

    this.credentials = this.credentials.filter(c => {
      return c.walletId != walletId;
    });

    this.dirty = true;
    return true;
  }
}
