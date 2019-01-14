import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';
// providers
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';

import * as _ from 'lodash';

@Component({
  selector: 'page-vault-delete',
  templateUrl: 'vault-delete.html'
})
export class VaultDeletePage {
  public wallet;

  constructor(
    public profileProvider: ProfileProvider,
    public navCtrl: NavController,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private logger: Logger,
    private events: Events,
    private translate: TranslateService,
    private persistenceProvider: PersistenceProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: VaultDeletePage');
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Warning!');
    const message = this.translate.instant(
      'Are you sure you want to delete this vault?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteVault();
    });
  }

  public async deleteVault() {
    const vault = await this.persistenceProvider.getVault();
    const wallets = this.profileProvider.getWallets();
    const vaultWallets = _.filter(wallets, (x: any) => {
      return vault && vault.walletIds.includes(x.credentials.walletId);
    });

    this.onGoingProcessProvider.set('deletingVault');
    this.profileProvider
      .deleteVaultWallets(vaultWallets)
      .then(() => {
        this.events.publish('status:updated');
        vaultWallets.forEach(wallet => {
          this.pushNotificationsProvider.unsubscribe(wallet);
        });
        this.onGoingProcessProvider.clear();
        this.navCtrl.pop();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error('Deleting vault err', err);
        this.popupProvider.ionicAlert(
          this.translate.instant('Error'),
          this.translate.instant('Could not delete Vault')
        );
      });
  }
}
