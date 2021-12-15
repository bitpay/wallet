import { Component, ViewChild } from '@angular/core';
import { IonSlides, ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'notification-component',
  templateUrl: 'notification-component.html',
  styleUrls: ['notification-component.scss'],
})
export class NotificationComponent {
  customButton: any;
  title: string;
  message: string;
  @ViewChild('notificationSlide') notificationSlide: IonSlides;
  constructor(private viewCtrl: ModalController, private navParams: NavParams) {
    this.customButton = this.navParams.data.customButton;
    this.title = this.navParams.data.title;
    this.message = this.navParams.data.message;
  }

  ngOnInit(){
    if (this.notificationSlide) this.notificationSlide.lockSwipeToPrev(true);
    setTimeout(() => {
      this.dismiss({});
    }, 10000);
  }

  dismiss(data) {
    this.viewCtrl.dismiss(data);
  }
}
