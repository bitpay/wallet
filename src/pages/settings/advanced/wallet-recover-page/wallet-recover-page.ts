import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { WalletMnemonicRecoverPage } from './wallet-mnemonic-recover-page/wallet-mnemonic-recover-page';

@Component({
  selector: 'wallet-recover-page',
  templateUrl: 'wallet-recover-page.html'
})
export class WalletRecoverPage {
  public wallets: any;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
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
    this.navCtrl.push(WalletMnemonicRecoverPage, { name, credential });
  }
}
