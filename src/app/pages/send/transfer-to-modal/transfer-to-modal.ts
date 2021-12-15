import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileProvider } from 'src/app/providers/profile/profile';

@Component({
  selector: 'page-transfer-to-modal',
  templateUrl: 'transfer-to-modal.html'
})
export class TransferToModalPage {
  public search: string = '';
  public wallet;
  public fromSelectInputs: boolean;
  public fromMultiSend: boolean;
  navPramss;
  constructor(
    private router: Router,
    private profileProvider: ProfileProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.fromSelectInputs = this.navPramss.fromSelectInputs;
    this.fromMultiSend = this.navPramss.fromMultiSend;
  }
}
