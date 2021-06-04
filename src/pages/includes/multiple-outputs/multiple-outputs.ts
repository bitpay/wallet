import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-multiple-outputs',
  templateUrl: 'multiple-outputs.html'
})
export class MultipleOutputsPage {
  public coin: string;
  private _tx;
  private _misunderstoodOutputsMsg;

  public showMultiplesOutputs: boolean;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private addressProvider: AddressProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider
  ) {
    this.showMultiplesOutputs = false;
  }

  @Output() openBlockChainEvent = new EventEmitter<string>();
  @Input()
  set tx(tx) {
    this._tx = tx;
    this._misunderstoodOutputsMsg = tx.misunderstoodOutputs
      ? this.translate.instant(
          'There are some misunderstood outputs, please view on blockchain.'
        )
      : undefined;
    this.tx.outputs.forEach(output => {
      const outputAddr = output.toAddress ? output.toAddress : output.address;
      this.coin = this._tx.coin
        ? this._tx.coin
        : this.addressProvider.getCoinAndNetwork(outputAddr, this._tx.network)
            .coin;

      const addressToShow = this.walletProvider.getAddressView(
        this.coin,
        this._tx.network,
        outputAddr
      );
      output.addressToShow =
        addressToShow == 'false' ? 'Unparsed address' : addressToShow;
      this.addressBookProvider
        .getContactName(outputAddr, this.tx.network)
        .then(contact => {
          output.contactName = contact;
        });
    });
  }

  get tx() {
    return this._tx;
  }

  get misunderstoodOutputsMsg() {
    return this._misunderstoodOutputsMsg;
  }

  viewOnBlockchain(): void {
    this.openBlockChainEvent.next();
  }
}
