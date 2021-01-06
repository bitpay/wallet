import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-new-feature',
  templateUrl: 'new-feature.html'
})
export class NewFeaturePage {
  @ViewChild('newFeatureSlides') slider: Slides;
  endSlide: boolean = false;
  showFeatureList: any = [];
  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.showFeatureList.push(...this.navParams.data.featureList.features);
    this.endSlide = this.showFeatureList.length == 1;
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
