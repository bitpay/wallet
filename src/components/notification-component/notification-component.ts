import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, ViewController } from 'ionic-angular';

@Component({
  selector: 'notification-component',
  templateUrl: 'notification-component.html'
})
export class NotificationComponent {
  customButton: any;
  title: string;
  message: string;
  @ViewChild('notificationSlide') notificationSlide: Slides;
  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.customButton = this.navParams.data.customButton;
    this.title = this.navParams.data.title;
    this.message = this.navParams.data.message;
  }

  ionViewDidLoad() {
    if (this.notificationSlide) this.notificationSlide.lockSwipeToPrev(true);
    setTimeout(() => {
      this.dismiss({});
    }, 5000);
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }
}
