import { Component } from '@angular/core';
import { Events, NavParams } from 'ionic-angular';

// providers
import { Logger } from '../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../providers/profile/profile';

import * as _ from 'lodash';

@Component({
  selector: 'page-enabled-wallets',
  templateUrl: 'enabled-wallets.html'
})
export class EnabledWalletsPage {
  public wallets;

  private keyId: string;
  constructor(
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private logger: Logger,
    private events: Events
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: EnabledWalletsPage');
  }

  ionViewWillEnter() {
    this.keyId = this.navParams.data.keyId;
    const opts = {
      keyId: this.keyId,
      showHidden: true
    };
    this.wallets = _.clone(this.profileProvider.getWallets(opts));
  }

  public hiddenWalletChange(walletId: string): void {
    this.profileProvider.toggleHideWalletFlag(walletId);
    this.events.publish('Local/WalletListChange');
  }
}
