import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

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
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.currentLanguage = this.languageProvider.getCurrent();
    this.languages = this.languageProvider.getAvailables();
  }

  public openExternalLink(): void {
    let url = 'https://crowdin.com/project/copay';
    let optIn = true;
    let title = 'Open Translation Community'; //TODO gettextcatalog
    let message = 'You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!'; //TODO gettextcatalog
    let okText = 'Open Crowdin'; //TODO gettextcatalog
    let cancelText = 'Go Back'; //TODO gettextcatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public save(newLang: string): void {
    this.languageProvider.set(newLang);
    this.navCtrl.pop();
  }

}
