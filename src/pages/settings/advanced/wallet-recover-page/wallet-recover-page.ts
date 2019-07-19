import { Component, } from '@angular/core';
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
  public filteredProfileCredentials: any;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
  ) {
    
    var credentialsWithKeyId = [];
    
    _.forEach(this.profileProvider.walletsGroups, (credential) => {
      credentialsWithKeyId.push(credential);
    });

    this.profileProvider.getProfileLegacy().then((oldProfile) => {
      this.filteredProfileCredentials = _.filter(oldProfile.credentials, 'mnemonicEncrypted');
      this.wallets = _.intersectionWith(credentialsWithKeyId, this.filteredProfileCredentials, (value1, value2) => {
        return value1['name'] === value2['walletName'];
      });
    }); 

  }

  public openWalletMnemonicRecoverPage(name: string, keyId: string) {
    this.navCtrl.push(WalletMnemonicRecoverPage, { name, keyId });
  }
  
}
