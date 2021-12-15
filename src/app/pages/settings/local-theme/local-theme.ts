import { Component } from '@angular/core';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Logger } from 'src/app/providers/logger/logger';
import { ThemeProvider } from 'src/app/providers/theme/theme';

@Component({
  selector: 'page-local-theme',
  templateUrl: 'local-theme.html',
  styleUrls: ['local-theme.scss']
})
export class LocalThemePage {
  public availableThemes;
  public selectedTheme;
  private autoDetectedTheme: string;
  constructor(
    private logger: Logger,
    private themeProvider: ThemeProvider,
    private events: EventManagerService
  ) {
    this.selectedTheme = this.themeProvider.getSelectedTheme();
    this.availableThemes = this.themeProvider.availableThemes;
  }

  ngOnInit() {
    this.logger.info('Loaded: LocalThemePage');
    this.themeProvider.getDetectedSystemTheme().then(theme => {
      this.autoDetectedTheme = theme;
    });
  }

  ionViewDidEnter() {
    setTimeout(() => {
      let element = document.getElementsByTagName('page-local-theme');
      element[0].classList.add('theme-transition');
    }, 150);
  }

  public save(theme: string) {
    this.themeProvider.setActiveTheme(theme, this.autoDetectedTheme);
    this.events.publish('Local/UpdateActiveThem');
  }
}
