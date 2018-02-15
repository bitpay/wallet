import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';

//providers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { LanguageProvider } from '../../../providers/language/language';

@Component({
  selector: 'page-language',
  templateUrl: 'language.html'
})
export class LanguagePage {
  public currentLanguage: any;
  public languages: any;

  constructor(
    private navCtrl: NavController,
    private languageProvider: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService
  ) {
    this.currentLanguage = this.languageProvider.getCurrent();
    this.languages = this.languageProvider.getAvailables();
  }

  public openExternalLink(): void {
    const url = 'https://crowdin.com/project/copay';
    const optIn = true;
    const title = this.translate.instant('Open Translation Community');
    const message = this.translate.instant(
      'You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!'
    );
    const okText = this.translate.instant('Open Crowdin');
    const cancelText = this.translate.instant('Go Back');
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
  }
}
