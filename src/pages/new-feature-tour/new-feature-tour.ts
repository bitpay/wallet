import { Component, ViewChild } from '@angular/core';
import { Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-new-feature-tour',
  templateUrl: 'new-feature-tour.html'
})
export class NewFeatureTourPage {
  @ViewChild('newFeatureTourSlides')
  newFeatureTourSlides: Slides;

  constructor(private viewCtrl: ViewController) {}

  public nextSlide(): void {
    this.newFeatureTourSlides.slideNext();
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
