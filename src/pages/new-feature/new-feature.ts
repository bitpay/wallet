import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';
import { TryItType } from '../../providers/new-feature-data/new-feature-data';
import { ThemeProvider } from '../../providers/theme/theme';
@Component({
  selector: 'page-new-feature',
  templateUrl: 'new-feature.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateX(3px)',
          opacity: 0
        }),
        animate('200ms')
      ]),
      transition(':leave', [
        animate(
          '200ms',
          style({
            transform: 'translateX(3px)',
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class NewFeaturePage {
  @ViewChild('newFeatureSlides') slider: Slides;
  endSlide: boolean = false;
  firstSlide: boolean = true;
  tryit: any;
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

  setBGImgHeader(imagePath: string) {
    return {
      'background-image': 'url(' + imagePath + ')',
      'background-repeat': 'no-repeat',
      'background-position': 'bottom',
      'background-color': '#F4F6FF',
      height: '100%'
    };
  }

  slideChanged() {
    this.endSlide = this.slider.isEnd();
    this.firstSlide = this.slider.isBeginning();
    this.slider.lockSwipeToNext(this.endSlide);
    this.slider.lockSwipeToPrev(this.firstSlide);
    this.tryit = null;
    if (
      this.slider._activeIndex &&
      this.featureList[this.slider._activeIndex]
    ) {
      this.tryit = this.featureList[this.slider._activeIndex].tryit;
    }
  }

  public nextSlide(): void {
    this.slider.slideNext();
  }

  public close(data: TryItType): void {
    typeof data === 'function'
      ? data(this.viewCtrl)
      : this.viewCtrl.dismiss({ data, done: this.endSlide });
  }
}
