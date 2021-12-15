import { Component } from '@angular/core';
import { Router } from '@angular/router';

// providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';

@Component({
  selector: 'page-clear-encrypt-password',
  templateUrl: 'clear-encrypt-password.html'
})
export class ClearEncryptPasswordPage {
  navParamsData;

  constructor(
    private logger: Logger,
    private router: Router,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
  }

  ngOnInit(){
    this.logger.info('Loaded: ClearEncryptPasswordPage');
  }

  public reImportWallets() {
    this.router.navigate(['/import-wallet'], {
      state: {
        keyId: this.navParamsData.keyId
      }
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
