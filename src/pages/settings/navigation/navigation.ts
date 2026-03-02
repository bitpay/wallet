import { Component } from '@angular/core';
import { Events } from 'ionic-angular';

// providers
import { Logger, ThemeProvider } from '../../../providers';

@Component({
  selector: 'page-navigation',
  templateUrl: 'navigation.html'
})
export class NavigationPage {
  public availableNavigationTypes;
  public selectedNavigationType;

  constructor(
    private logger: Logger,
    private themeProvider: ThemeProvider,
    private events: Events
  ) {
    this.selectedNavigationType = this.themeProvider.getSelectedNavigationType();
    this.availableNavigationTypes = this.themeProvider.availableNavigationTypes;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: NavigationPage');
  }

  public save(navigationType: string) {
    this.themeProvider.setActiveNavigationType(navigationType);
    this.events.publish('Local/UpdateNavigationType');
  }
}
