import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';
import { Observable } from 'rxjs';

// Pages
// import { CreateWalletGroupPage } from '../../pages/create-wallet-group/create-wallet-group';

// Providers
// import { ProfileProvider } from '../../providers/profile/profile';
import { KeyProvider } from '../../providers/key/key';

@Component({
  selector: 'wallet-group-selector',
  templateUrl: 'wallet-group-selector.html'
})
export class WalletGroupSelectorComponent {
  private deregisterBackButtonAction;

  public slideIn: boolean;
  public walletsGroups;
  public selectedIndex: number;

  constructor(
    private events: Events,
    private platform: Platform,
    private keyProvider: KeyProvider
  ) {
    this.slideIn = false;
  }

  public async present(walletsGroups) {
    this.setWalletsGroups(walletsGroups);
    await Observable.timer(50).toPromise();
    this.slideIn = true;
    this.overrideHardwareBackButton();
  }

  public async dismiss(): Promise<void> {
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

  public setWalletsGroups(walletsGroups): void {
    this.walletsGroups = walletsGroups;
    // TODO: Set selected WalletGroup index to show the green check
    // const activeWalletGroup = this.profileProvider.activeWalletGroup;
    // this.selectedIndex = _.indexOf(this.walletsGroups, activeWalletGroup);
  }

  public setActiveWalletGroup(selectedWalletGroup): void {
    this.dismiss();
    this.keyProvider.setActiveWGKey(selectedWalletGroup.key);
    this.events.publish('Home/reloadStatus');
  }

  public goToCreateWalletGroupPage(): void {
    // this.navCtrl.push(CreateWalletGroupPage).then(() => {
    //   this.dismiss();
    // });
  }
}
