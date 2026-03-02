import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';

// providers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { LanguageProvider } from '../../../providers/language/language';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-language',
  templateUrl: 'language.html'
})
export class LanguagePage {
  public currentLanguage;
  public languages;

  constructor(
    private navCtrl: NavController,
    private languageProvider: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private translate: TranslateService
  ) {
    this.currentLanguage = this.languageProvider.getCurrent();
    this.languages = this.languageProvider.getAvailables();
  }

  public openExternalLink(): void {
    let url = 'https://crowdin.com/project/copay';
    let optIn = true;
    let title = this.translate.instant('Open Translation Community');
    let message = this.translate.instant(
      'You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!'
    );
    let okText = this.translate.instant('Open Crowdin');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public save(newLang: string): void {
    this.languageProvider.set(newLang);
    this.navCtrl.pop();
    setTimeout(() => {
      const opts = {
        showHidden: true
      };
      let wallets = this.profileProvider.getWallets(opts);
      this.walletProvider.updateRemotePreferences(wallets);
    }, 1000);
  }
}
