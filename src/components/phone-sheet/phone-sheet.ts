import { Component } from '@angular/core';
import { getPhoneCountryCodes } from '../../providers/phone/phone';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'phone-sheet',
  templateUrl: 'phone-sheet.html'
})
export class PhoneSheet extends ActionSheetParent {
  public countries;

  constructor() {
    super();
  }

  ngOnInit() {
    this.countries = getPhoneCountryCodes(this.params.allowedPhoneCountries);
  }

  public selectCountry(country): void {
    this.dismiss(country);
  }
}
