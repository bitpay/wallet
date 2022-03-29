import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'create-new-wallet',
  templateUrl: 'create-new-wallet.html',
  styleUrls:[ 'create-new-wallet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateNewWalletPage {
  constructor(private router: Router) {}

  public goToAddWalletPage() {
    this.router.navigate(['/select-currency'], {state: {isZeroState: true}})
  }
}
