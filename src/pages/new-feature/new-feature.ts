import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';
import { ThemeProvider } from '../../providers/theme/theme';
@Component({
  selector: 'page-new-feature',
  templateUrl: 'new-feature.html'
})
export class NewFeaturePage {
  @ViewChild('newFeatureSlides') slider: Slides;
  endSlide: boolean = false;
  featureList: any = [];
  isDarkMode: boolean;
  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private themeProvider: ThemeProvider
  ) {
    this.featureList.push(...this.navParams.data.featureList.features);
    this.endSlide = this.featureList.length == 1;
    this.isDarkMode = this.themeProvider.isDarkModeEnabled();
  }

  getImage(imagePath: string): string {
    if (this.isDarkMode) {
      var pointIndex = imagePath.lastIndexOf('.');
      var output = [
        imagePath.slice(0, pointIndex),
        '-dark',
        imagePath.slice(pointIndex)
      ].join('');
      return output;
    } else {
      return imagePath;
    }
  }

  slideChanged() {
    this.endSlide = this.slider.isEnd();
  }

  public nextSlide(): void {
    this.slider.slideNext();
  }

  public close(data: any): void {
    this.viewCtrl.dismiss(data);
  }
}
