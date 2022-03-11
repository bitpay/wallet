import { Location } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AppProvider } from 'src/app/providers';
import { Logger } from 'src/app/providers/logger/logger';


@Component({
  selector: 'page-add',
  templateUrl: 'add.html',
  styleUrls: ['add.scss'],
  encapsulation: ViewEncapsulation.None

})
export class AddPage {
  public keyId: string;
  public isZeroState: boolean;
  navParamsData: any;
  currentTheme;

  constructor(
    private appProvider: AppProvider,
    private router: Router,
    private logger: Logger,
    private location: Location
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: AddPage');
    this.keyId = this.navParamsData.keyId;
    this.isZeroState = this.navParamsData.isZeroState;
  }

  public goToAddWalletPage(isShared?: boolean, isJoin?: boolean): void {
    if (this.navParamsData.isMultipleSeed) {
      this.router.navigate(['/add-wallet'], {
        state: {
          isCreate: true,
          isMultipleSeed: true,
          isShared,
          url: this.navParamsData.url
        }
      });
    } else {
      this.router.navigate(['/select-currency'], {
        state: {
          isShared,
          isJoin,
          isZeroState: this.isZeroState && !isShared,
          keyId: this.keyId,
          url: this.navParamsData.url
        }
      });
    }
  }

  public goToImportWallet(): void {
    this.router.navigate(['/import-wallet']);
  }

  public goBack(): void {
    this.location.back();
  }
}
