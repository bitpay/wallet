import { FormControl } from '@angular/forms';
import { BwcProvider } from '../providers/bwc/bwc';

export class AddressValidator {

  public static bitcore: BwcProvider;

  constructor(bwc: BwcProvider) {
    AddressValidator.bitcore = bwc;
  }

  public isValid(control: FormControl): any {

    const b = AddressValidator.bitcore.getBitcore();
    const c = AddressValidator.bitcore.getBitcoreCash();

    const URI = b.URI;
    const Address = b.Address;
    const URICash = c.URI;
    const AddressCash = c.Address;

    // Regular url
    if (/^https?:\/\//.test(control.value)) {
      return null;
    }

    // Bip21 uri
    let uri, isAddressValidLivenet, isAddressValidTestnet;
    if (/^bitcoin:/.test(control.value)) {
      const isUriValid = URI.isValid(control.value);
      if (isUriValid) {
        uri = new URI(control.value);
        isAddressValidLivenet = Address.isValid(uri.address.toString(), 'livenet')
        isAddressValidTestnet = Address.isValid(uri.address.toString(), 'testnet')
      }
      if (isUriValid && (isAddressValidLivenet || isAddressValidTestnet)) {
        return null;
      }
    } else if (/^bitcoincash:/.test(control.value)) {
      const isUriValid = URICash.isValid(control.value);
      if (isUriValid) {
        uri = new URICash(control.value);
        isAddressValidLivenet = AddressCash.isValid(uri.address.toString(), 'livenet')
      }
      if (isUriValid && isAddressValidLivenet) {
        return null;
      }
    }

    // Regular Address: try Bitcoin and Bitcoin Cash
    const regularAddressLivenet = Address.isValid(control.value, 'livenet');
    const regularAddressTestnet = Address.isValid(control.value, 'testnet');
    const regularAddressCashLivenet = AddressCash.isValid(control.value, 'livenet');
    if (regularAddressLivenet || regularAddressTestnet || regularAddressCashLivenet) {
      return null;
    }

    return {
      "Invalid Address": true
    };
  }
}
