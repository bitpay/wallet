import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController} from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html',
})
export class DisclaimerPage {
  public accepted: any;
  public terms: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController) {
    this.accepted = {
      first: false,
      second: false,
    };
    this.terms = {
      accepted: false,
    }
  }

  ionViewDidLoad() {
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openModal() {
    const myModal = this.modalCtrl.create('DisclaimerModalPage');
    myModal.present();
  }

  confirm() {
    // TODO accept disclaimer
    this.navCtrl.popToRoot();
  }
}
