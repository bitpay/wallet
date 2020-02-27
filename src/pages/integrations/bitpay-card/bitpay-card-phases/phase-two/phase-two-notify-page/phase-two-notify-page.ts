import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';

import { CardPhasesProvider } from '../../../../../../providers/card-phases/card-phases';
import { OnTheList } from '../../../../../integrations/bitpay-card/bitpay-card-phases/shared/on-the-list-page/on-the-list-page';

@Component({
  selector: 'page-bitpay-phase-two-notify',
  templateUrl: './phase-two-notify-page.html'
})
export class PhaseTwoCardNotifyPage {
  public notifyForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    private cardPhasesProvider: CardPhasesProvider
  ) {
    this.notifyForm = new FormGroup({
      email: new FormControl(
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
          )
        ])
      ),
      agreement: new FormControl(false, Validators.requiredTrue)
    });
  }

  goBack() {
    this.navCtrl.pop();
  }

  addMe() {
    this.cardPhasesProvider.getSession().subscribe(data => {
      const csrf = data['data']['csrfToken'];
      const body = {
        email: this.notifyForm.get('email').value,
        created: new Date()
      };
      this.cardPhasesProvider.notify(csrf, body).subscribe(val => {
        if (val['data'] === 'Success') {
          this.navCtrl.push(OnTheList);
        }
      });
    });
  }
}
