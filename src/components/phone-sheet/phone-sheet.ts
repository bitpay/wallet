import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { getPhoneCountryCodes } from '../../providers/phone/phone';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'phone-sheet',
  templateUrl: 'phone-sheet.html'
})
export class PhoneSheet extends ActionSheetParent {
  public countries;
  public searchQuery: string = '';
  public searchQuerySubject: Subject<string> = new Subject<string>();

  constructor() {
    super();
    this.searchQuerySubject.pipe(debounceTime(300)).subscribe(query => {
      this.searchQuery = query as string;
      this.updateCountryList();
    });
  }

  ngOnInit() {
    this.updateCountryList();
  }

  public onSearch(query: string) {
    this.searchQuerySubject.next(query);
  }

  public selectCountry(country): void {
    this.dismiss(country);
  }

  private updateCountryList() {
    const allCountries = getPhoneCountryCodes(
      this.params.allowedPhoneCountries
    );
    this.countries = this.searchQuery
      ? allCountries.filter(country =>
          country.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : allCountries;
  }
}
