import { animate, style, transition, trigger } from '@angular/animations';
import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { TryItType } from 'src/app/providers/new-feature-data/new-feature-data';
import { ThemeProvider } from 'src/app/providers/theme/theme';
import { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore from 'swiper';

SwiperCore.use([Pagination]);
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
  ],
  styleUrls: ['./new-feature.scss']
})

export class NewFeaturePage implements OnInit {
  @ViewChild('swiper') swiper: SwiperComponent;
  config: SwiperOptions = {
    slidesPerView: 1,
    pagination: true,
    speed: 400,
    resistanceRatio: 0
  }
  endSlide: boolean = false;
  firstSlide: boolean = true;
  tryit: any;
  featureList: any = [];
  isDarkMode: boolean;
  constructor(
    private viewCtrl: ModalController,
    private navParams: NavParams,
    private themeProvider: ThemeProvider,
    private zone: NgZone
  ) {


  }
  ngOnInit(): void {
    this.zone.run(() => {
      this.featureList = [...this.navParams.data.featureList.features];
      this.endSlide = this.swiper.swiperRef.isEnd;
      this.isDarkMode = this.themeProvider.isDarkModeEnabled();
    })
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
      height: '100%'
    };
  }

  slideChanged() {
    this.zone.run(() => {
      this.endSlide = this.swiper.swiperRef.isEnd;
      this.tryit = null;
      if (
        this.swiper.swiperRef.activeIndex &&
        this.featureList[this.swiper.swiperRef.activeIndex]
      ) {
        this.tryit = this.featureList[this.swiper.swiperRef.activeIndex].tryit;
      }
    })
  }

  public close(data: TryItType): void {
    typeof data === 'function'
      ? data(this.viewCtrl)
      : this.viewCtrl.dismiss({ data, done: this.endSlide });
  }
}
