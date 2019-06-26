import { Component } from '@angular/core';
import { Events, NavController, Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

// Pages
import { AddPage } from '../../pages/add/add';

// Providers
import { KeyProvider } from '../../providers/key/key';
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  selector: 'wallet-group-selector',
  templateUrl: 'wallet-group-selector.html'
})
export class WalletGroupSelectorComponent {
  private deregisterBackButtonAction;

  public slideIn: boolean;
  public walletsGroups: any[];
  public selectedIndex: number;

  constructor(
    private events: Events,
    private platform: Platform,
    private keyProvider: KeyProvider,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider
  ) {
    this.slideIn = false;
  }

  public async present(): Promise<void> {
    // TODO: Set selected WalletGroup index to show the green check
    this.walletsGroups = _.values(
      _.mapValues(this.profileProvider.walletsGroups, (value: any, key) => {
        value.key = key;
        return value;
      })
    );
    await Observable.timer(50).toPromise();
    this.slideIn = true;
    this.overrideHardwareBackButton();
  }

  public dismiss() {
    this.slideIn = false;
    this.deregisterBackButtonAction();
  }

  overrideHardwareBackButton() {
    this.deregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => this.dismiss()
    );
  }

  ngOnDestroy() {
    this.deregisterBackButtonAction();
  }

  public setActiveWalletGroup(selectedWalletGroup): void {
    this.dismiss();
    this.keyProvider.setActiveWGKey(selectedWalletGroup.key);
    this.events.publish('Home/reloadStatus');
  }

  public goToAddPage(): void {
    this.navCtrl.push(AddPage).then(() => {
      this.dismiss();
    });
  }
}
