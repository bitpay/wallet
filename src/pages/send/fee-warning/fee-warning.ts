import { Component } from "@angular/core";
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-fee-warning',
  templateUrl: 'fee-warning.html'
})
export class FeeWarningPage {
  constructor(
    private viewCtrl: ViewController
  ) {}

  close() {
    this.viewCtrl.dismiss();
  }
}