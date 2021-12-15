import { Component, NgZone, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore from 'swiper';

SwiperCore.use([Pagination]);
@Component({
  selector: 'page-key-onboarding',
  templateUrl: 'key-onboarding.html',
  styleUrls: ['key-onboarding.scss']
})

export class KeyOnboardingPage {
  @ViewChild('swiper', { static: true }) swiper: SwiperComponent;
  slideEnd: boolean = false;
  config: SwiperOptions = {
    slidesPerView: 1,
    pagination: true,
    speed: 400,
    resistanceRatio: 0
  }
  zone;
  constructor(private viewCtrl: ModalController) { this.zone = new NgZone({ enableLongStackTrace: false }); }
  

  ngAfterViewInit() {
    this.swiper.swiperRef.allowSlidePrev = false;
  }

  slideChanged() {
    this.zone.run(()=>{
      this.swiper.swiperRef.update();
      if(this.swiper.swiperRef.isBeginning){
        this.swiper.allowSlidePrev = false;
      }
      this.slideEnd = this.swiper.swiperRef.isEnd;
    })
  }

  public nextSlide(): void {
    this.swiper.swiperRef.slideNext();
    this.slideEnd = this.swiper.swiperRef.isEnd;
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }
}
