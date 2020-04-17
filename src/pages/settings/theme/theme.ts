import { Component } from '@angular/core';

// providers
import { Logger, ThemeProvider } from '../../../providers';

@Component({
  selector: 'page-theme',
  templateUrl: 'theme.html'
})
export class ThemePage {
  public availableThemes;
  public selectedTheme;
  private autoDetectedTheme: string;
  constructor(private logger: Logger, private themeProvider: ThemeProvider) {
    this.selectedTheme = this.themeProvider.getSelectedTheme();
    this.availableThemes = this.themeProvider.availableThemes;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ThemePage');
    this.themeProvider.getDetectedSystemTheme().then(theme => {
      this.autoDetectedTheme = theme;
    });
  }

  public save(theme: string) {
    this.themeProvider.setActiveTheme(theme, this.autoDetectedTheme);
  }
}
