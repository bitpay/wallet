import { Component } from '@angular/core';
import { Events, Platform, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { KeyProvider } from '../../providers/key/key';
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  selector: 'page-wallet-group-selector',
  templateUrl: 'wallet-group-selector.html'
})
export class WalletGroupSelectorPage {
  private deregisterBackButtonAction;

  public walletsGroups: any[];
  public selectedIndex: number;
  public selectedWalletGroup;

  constructor(
    private viewCtrl: ViewController,
    private events: Events,
    private platform: Platform,
    private keyProvider: KeyProvider,
    private profileProvider: ProfileProvider
  ) {
    this.selectedWalletGroup = this.profileProvider.getWalletGroup(
      this.keyProvider.activeWGKey
    );

    const walletsGroups = _.values(
      _.mapValues(this.profileProvider.walletsGroups, (value: any, key) => {
        value.key = key;
        return value;
      })
    );
    this.walletsGroups = _.sortBy(walletsGroups, 'order');
    this.overrideHardwareBackButton();
  }

  overrideHardwareBackButton() {
    this.deregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => this.close()
    );
  }

  ngOnDestroy() {
    this.deregisterBackButtonAction();
  }

  public setActiveWalletGroup(selectedWalletGroup): void {
    this.close();
    this.keyProvider.setActiveWGKey(selectedWalletGroup.key);
    this.events.publish('Local/WalletListChange');
  }

  public goToAddWalletPage(): void {
    this.close(true);
  }

  public close(goToAddWallet?: boolean): Promise<any> {
    this.deregisterBackButtonAction();
    return this.viewCtrl.dismiss(goToAddWallet);
  }
}
