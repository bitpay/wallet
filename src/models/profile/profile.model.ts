export class Profile {
  public version: string;
  public createdOn: number;
  public credentials: any[];
  public disclaimerAccepted: boolean;
  public onboardingCompleted: boolean;
  public checked;
  public checkedUA?;
  public dirty: boolean;

  constructor() {
    this.version = '1.0.0';
  }

  public getObj() {
    return {
      version: this.version,
      createdOn: this.createdOn,
      credentials: this.credentials,
      disclaimerAccepted: this.disclaimerAccepted,
      onboardingCompleted: this.onboardingCompleted,
      checked: this.checked,
      checkedUA: this.checkedUA,
      dirty: this.dirty
    };
  }

  public create(opts?) {
    opts = opts ? opts : {};
    this.createdOn = Date.now();
    this.credentials = opts.credentials || [];
    this.disclaimerAccepted = false;
    this.onboardingCompleted = false;
    this.checked = {};
  }

  public fromObj(obj) {
    obj = obj ? obj : {};
    this.createdOn = obj.createdOn;
    this.credentials = obj.credentials || [];
    this.disclaimerAccepted = obj.disclaimerAccepted || false;
    this.onboardingCompleted = obj.onboardingCompleted || false;
    this.checked = obj.checked || {};
    this.checkedUA = obj.checkedUA;

    if (this.credentials[0] && typeof this.credentials[0] != 'object')
      throw new Error('credentials should be an array of objects');
  }

  public toObj(): string {
    delete this.dirty;
    return JSON.stringify(this.getObj());
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
