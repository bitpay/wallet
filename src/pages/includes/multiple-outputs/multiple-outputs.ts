import { Component, Input } from '@angular/core';
import * as _ from 'lodash';

// Providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
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
    private addressProvider: AddressProvider,
    private logger: Logger,
    private walletProvider: WalletProvider
  ) {
    this.showMultiplesOutputs = false;
  }

  @Input()
  set tx(tx) {
    this._tx = tx;
    this.tx.outputs.forEach(output => {
      const outputAddr = output.toAddress ? output.toAddress : output.address;
      const coin = this._tx.coin
        ? this._tx.coin
        : this.addressProvider.getCoin(outputAddr);

      output.addressToShow = this.walletProvider.getAddressView(
        coin,
        this._tx.network,
        outputAddr
      );
    });

    this.contact();
  }

  get tx() {
    return this._tx;
  }

  private contact(): void {
    const addr = this._tx.toAddress;
    this.addressBookProvider
      .get(addr)
      .then(ab => {
        if (ab) {
          const name = _.isObject(ab) ? ab.name : ab;
          this.contactName = name;
        }
      })
      .catch(err => {
        this.logger.warn(err);
      });
  }
}
