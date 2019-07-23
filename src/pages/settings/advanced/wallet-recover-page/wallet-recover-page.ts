import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
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
    private navCtrl: NavController
  ) {
    this.profileProvider
      .getProfileLegacy()
      .then(oldProfile => {
        this.wallets = _.filter(oldProfile.credentials, value => {
          return (
            value.mnemonic !== undefined ||
            value.mnemonicEncrypted !== undefined
          );
        });
      });
  }

  public openWalletMnemonicRecoverPage(name: string, credential: any) {
    this.navCtrl.push(WalletMnemonicRecoverPage, { name, credential });
  }
}
