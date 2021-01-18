import { Component } from '@angular/core';

// providers
import {
  IABCardProvider,
  Logger,
  PlatformProvider,
  ThemeProvider
} from '../../../providers';

@Component({
  selector: 'page-local-theme',
  templateUrl: 'local-theme.html'
})
export class LocalThemePage {
  public availableThemes;
  public selectedTheme;
  private autoDetectedTheme: string;
  constructor(
    private logger: Logger,
    private themeProvider: ThemeProvider,
    private iabCardProvider: IABCardProvider,
    private platformProvider: PlatformProvider
  ) {
    this.selectedTheme = this.themeProvider.getSelectedTheme();
    this.availableThemes = this.themeProvider.availableThemes;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: LocalThemePage');
    this.themeProvider.getDetectedSystemTheme().then(theme => {
      this.autoDetectedTheme = theme;
    });
  }

  public save(theme: string) {
    this.themeProvider.setActiveTheme(theme, this.autoDetectedTheme);
    if (this.platformProvider.isCordova) {
      this.iabCardProvider.setTheme();
    }
  }
}
