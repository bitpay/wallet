import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';
import { switchMap } from 'rxjs/operators';

import { CardPhasesProvider } from '../../../../../../providers/card-phases/card-phases';
import { OnTheList } from '../../../../../integrations/bitpay-card/bitpay-card-phases/shared/on-the-list-page/on-the-list-page';

@Component({
  selector: 'page-bitpay-phase-one-notify',
  templateUrl: './phase-one-notify-page.html'
})

export class PhaseOneCardNotify {
  public notifyForm: FormGroup;

  constructor(public navCtrl: NavController,
    private cardPhasesProvider: CardPhasesProvider
  ) {
    this.notifyForm = new FormGroup({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern(
          /^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        )
      ])),
      agreement: new FormControl(false, Validators.requiredTrue)
    });
  }

  goBack() {
    this.navCtrl.pop();
  }

  addMe() {
    const body = {
      email: this.notifyForm.get('email').value,
      created: new Date()
    };
    this.cardPhasesProvider.getSession()
      .pipe(
        switchMap((data) => this.cardPhasesProvider.notify(data['data']['csrfToken'], body))
      ).subscribe((val) => {
        if (val['data'] === 'Success') {
          this.navCtrl.push(OnTheList);
        }
      });
  }
}