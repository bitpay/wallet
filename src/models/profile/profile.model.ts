export class Profile {
  public version: string;
  public createdOn: number;
  public credentials: any;
  public disclaimerAccepted: boolean;
  public checked;
  public checkedUA?;
  public dirty: boolean;

  constructor() {
    this.version = '2.0.0';
  }

  static create(): Profile {
    let x = new Profile();
    x.createdOn = Date.now();
    x.credentials = [];
    x.disclaimerAccepted = false;
    x.checked = {};
    return x;
  }

  static fromObj(obj): Profile {
    if (!obj || typeof obj != 'object') {
      throw new Error('Wrong params at Profile.fromObj: ' + obj);
    }
    let x = new Profile();
    x.createdOn = obj.createdOn;
    x.credentials = obj.credentials || [];
    x.disclaimerAccepted = obj.disclaimerAccepted || false;
    x.checked = obj.checked || {};
    x.checkedUA = obj.checkedUA;

    if (x.credentials[0] && typeof x.credentials[0] != 'object')
      throw new Error('credentials should be an array of objects');
    return x;
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

  public acceptDisclaimer(): void {
    this.disclaimerAccepted = true;
    this.dirty = true;
  }
}
