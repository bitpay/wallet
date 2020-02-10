import { Component, ViewChild } from '@angular/core';
import { Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-new-design-tour',
  templateUrl: 'new-design-tour.html'
})
export class NewDesignTourPage {
  @ViewChild('newDesignTourSlides')
  newDesignTourSlides: Slides;

  constructor(private viewCtrl: ViewController) {}

  public nextSlide(): void {
    this.newDesignTourSlides.slideNext();
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
