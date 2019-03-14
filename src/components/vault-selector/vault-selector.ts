import { Component } from '@angular/core';
import { Events, NavController, Platform } from 'ionic-angular';
import { Observable } from 'rxjs';

// Pages
import { CreateVaultPage } from '../../pages/create-vault/create-vault';

// Providers
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  selector: 'vault-selector',
  templateUrl: 'vault-selector.html'
})
export class VaultSelectorComponent {
  private deregisterBackButtonAction;

  public slideIn: boolean;
  public vaults;
  public selectedIndex: number;

  constructor(
    private events: Events,
    private navCtrl: NavController,
    private platform: Platform,
    private profileProvider: ProfileProvider
  ) {
    this.slideIn = false;
  }

  public async present(vaults) {
    this.setVaults(vaults);
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

  public setVaults(vaults): void {
    this.vaults = vaults;
    // TODO: Set selected vault index to show the green check
    // const activeVault = this.profileProvider.activeVault;
    // this.selectedIndex = _.indexOf(this.vaults, activeVault);
  }

  public setActiveVault(selectedVault): void {
    this.dismiss();
    this.profileProvider.setActiveVault(selectedVault).then(() => {
      this.events.publish('Home/reloadStatus');
    });
  }

  public goToCreateVaultPage(): void {
    this.navCtrl.push(CreateVaultPage).then(() => {
      this.dismiss();
    });
  }
}
