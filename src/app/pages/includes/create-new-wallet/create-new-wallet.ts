import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeProvider } from 'src/app/providers';

@Component({
  selector: 'create-new-wallet',
  templateUrl: 'create-new-wallet.html',
  styleUrls:[ 'create-new-wallet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateNewWalletPage {
  public currentTheme;

  constructor(
    private router: Router,
    private themeProvider: ThemeProvider
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
  }

  public goToAddWalletPage() {
    this.router.navigate(['/select-currency'], {state: {isZeroState: true}})
  }
}
