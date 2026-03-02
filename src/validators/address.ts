import { FormControl } from '@angular/forms';

// Providers
import { AddressProvider } from '../providers/address/address';

export class AddressValidator {
  static addressProvider: AddressProvider;

  constructor(addressProvider: AddressProvider) {
    AddressValidator.addressProvider = addressProvider;
  }

  isValid(control: FormControl) {
    return AddressValidator.addressProvider.isValid(control.value)
      ? null
      : { 'Invalid Address': true };
  }
}
