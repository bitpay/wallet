import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

//providers
import { LanguageProvider } from '../../../providers/language/language';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

@Component({
  selector: 'page-language',
  templateUrl: 'language.html',
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
    let url = 'https://crowdin.com/project/copay';
    let optIn = true;
    let title = this.translate.instant('Open Translation Community');
    let message = this.translate.instant('You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!');
    let okText = this.translate.instant('Open Crowdin');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public save(newLang: string): void {
    this.languageProvider.set(newLang);
    this.navCtrl.pop();
  }

}
