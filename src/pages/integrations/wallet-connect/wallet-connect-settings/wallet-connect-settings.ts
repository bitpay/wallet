import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
// Providers
import {
  ActionSheetProvider,
  ExternalLinkProvider,
  HomeIntegrationsProvider,
  PlatformProvider,
  ProfileProvider,
  WalletConnectProvider
} from '../../../../providers';

import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { ScanPage } from '../../../scan/scan';
import { WalletConnectPage } from '../wallet-connect';
@Component({
  selector: 'page-wallet-connect-settings',
  templateUrl: 'wallet-connect-settings.html'
})
export class WalletConnectSettingsPage {
  private serviceName: string = 'newWalletConnect';
  public showInHome;
  public service;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private walletConnectProvider: WalletConnectProvider,
    private translate: TranslateService,
    private platformProvider: PlatformProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public showWallets(): void {
    const wallets = this.profileProvider.getWallets({
      coin: 'eth',
      onlyComplete: true,
      backedUp: true,
      m: 1,
      n: 1
    });

    const params = {
      wallets,
      selectedWalletId: null,
      title: this.translate.instant('Select a wallet')
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private async onSelectWalletEvent(wallet): Promise<void> {
    if (!_.isEmpty(wallet)) {
      await this.walletConnectProvider.setAccountInfo(wallet);

      let params = {
        fromWalletConnect: true,
        walletId: wallet.credentials.walletId,
        fromSettings: true
      };

      this.platformProvider.isCordova
        ? await this.navCtrl.push(ScanPage, params, { animate: false })
        : await this.navCtrl.push(WalletConnectPage, params);
    }
  }
}
