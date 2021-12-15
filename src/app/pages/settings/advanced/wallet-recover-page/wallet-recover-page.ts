import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

@Component({
  selector: 'wallet-recover-page',
  templateUrl: 'wallet-recover-page.html',
  styleUrls: ['wallet-recover-page.scss']
})
export class WalletRecoverPage {
  public wallets: any;

  constructor(
    private profileProvider: ProfileProvider,
    private router: Router,
    private logger: Logger
  ) {}

  ionViewWillEnter() {
    this.profileProvider.getProfileLegacy().then(oldProfile => {
      if (!oldProfile) return;
      this.logger.debug(`Legacy profile exist. Typeof: ${typeof oldProfile}`);
      if (_.isString(oldProfile)) {
        oldProfile = JSON.parse(oldProfile);
      }
      this.wallets = _.filter(oldProfile.credentials, value => {
        return value && (value.mnemonic || value.mnemonicEncrypted);
      });
      this.logger.debug(
        `${this.wallets.length} wallets with mnemonics found in legacy profile`
      );
    });
  }

  public openWalletMnemonicRecoverPage(name: string, credential: any) {
    this.router.navigate(['/wallet-mnemonic-recover'], {
      state: {
        name: name, 
        credential: credential
      }
    })
  }
}
