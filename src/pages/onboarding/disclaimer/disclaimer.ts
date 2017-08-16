import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ToastController} from 'ionic-angular';

/**
 * Generated class for the DisclaimerPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-disclaimer',
  templateUrl: 'disclaimer.html',
})
export class DisclaimerPage {
  public accepted: any;
  public terms: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController, private toastCtrl: ToastController) {
    this.accepted = {
      first: false,
      second: false,
    };
    this.terms = {
      accepted: false,
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DisclaimerPage');
  }

  selectTerms() {
    this.terms.accepted = !this.terms.accepted;
  }

  openModal() {
    const myModal = this.modalCtrl.create('DisclaimerModalPage');
    myModal.present();
  }

  confirm() {
    // TODO accept displaimer
    this.navCtrl.parent.select(0);
  }
}
