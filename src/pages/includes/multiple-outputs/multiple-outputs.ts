import { Component, Input } from '@angular/core';
import * as _ from 'lodash';

// Providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { Logger } from '../../../providers/logger/logger';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-multiple-outputs',
  templateUrl: 'multiple-outputs.html'
})
export class MultipleOutputsPage {
  private _tx;

  public contactName: string;
  public showMultiplesOutputs: boolean;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private walletProvider: WalletProvider
  ) {
    this.showMultiplesOutputs = false;
  }

  @Input()
  set tx(tx) {
    this._tx = tx;

    this.tx.outputs.forEach(output => {
      output.addressToShow = this.walletProvider.getAddressView(
        this._tx.coin,
        output.toAddress
      );
    });

    this.contact();
  }

  get tx() {
    return this._tx;
  }

  private contact(): void {
    let addr = this._tx.toAddress;
    this.addressBookProvider
      .get(addr)
      .then(ab => {
        if (ab) {
          let name = _.isObject(ab) ? ab.name : ab;
          this.contactName = name;
        }
      })
      .catch(err => {
        this.logger.warn(err);
      });
  }
}
