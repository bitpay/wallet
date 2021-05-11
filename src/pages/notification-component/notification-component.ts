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
  @ViewChild('notificationSlide') slider: Slides;
  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.customButton = this.navParams.data.customButton;
    this.title = this.navParams.data.title;
    this.message = this.navParams.data.message;
  }

  dismiss(_dir, data) {
    this.viewCtrl.dismiss(data);
  }

  swipeEvent(e) {
    // Improve: get swipe direction and set animation related to that
    this.dismiss(e.direction, {});
  }
}
