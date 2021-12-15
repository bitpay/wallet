import { Component } from '@angular/core';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Logger } from 'src/app/providers/logger/logger';
import { ThemeProvider } from 'src/app/providers/theme/theme';

// providers

@Component({
  selector: 'page-navigation',
  templateUrl: 'navigation.html',
  styleUrls: ['navigation.scss']
})
export class NavigationPage {
  public availableNavigationTypes;
  public selectedNavigationType;

  constructor(
    private logger: Logger,
    private themeProvider: ThemeProvider,
    private events: EventManagerService
  ) {
    this.selectedNavigationType = this.themeProvider.getSelectedNavigationType();
    this.availableNavigationTypes = this.themeProvider.availableNavigationTypes;
  }

  ngOnInit(){
    this.logger.info('Loaded: NavigationPage');
  }

  public save(navigationType: string) {
    this.themeProvider.setActiveNavigationType(navigationType);
    this.events.publish('Local/UpdateNavigationType');
  }
}
