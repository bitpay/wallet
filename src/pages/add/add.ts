import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { JoinWalletPage } from './join-wallet/join-wallet';
import { SelectCurrencyPage } from './select-currency/select-currency';

// providers
import { KeyProvider } from '../../providers/key/key';
import { Logger } from '../../providers/logger/logger';
import { ProfileProvider } from '../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../providers/replace-parameters/replace-parameters';
import { ImportWalletPage } from './import-wallet/import-wallet';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public title: string;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams,
    private profileProvider: ProfileProvider,
    private keyProvider: KeyProvider,
    private translate: TranslateService,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    const keyId = this.keyProvider.activeWGKey;
    const addingNewAccount = this.navParam.data.addingNewAccount;
    const walletGroup = this.profileProvider.getWalletGroup(keyId);
    if (walletGroup && walletGroup.name && addingNewAccount) {
      this.title = this.replaceParametersProvider.replace(
        this.translate.instant('Add Account to {{walletGroupName}}'),
        {
          walletGroupName: walletGroup.name
        }
      );
    } else {
      this.title = this.translate.instant('Add Account');
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToSelectCurrencyPage(isShared: boolean): void {
    this.navCtrl.push(SelectCurrencyPage, {
      isShared,
      addingNewAccount: this.navParam.data.addingNewAccount
    });
  }

  public goToJoinWallet(): void {
    this.navCtrl.push(JoinWalletPage);
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
