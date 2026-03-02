import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-search-token-modal',
  templateUrl: 'confirm-add-token-modal.html'
})
export class ConfirmAddTokenModalPage {
  public token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };

  public address: string;

  constructor(private viewCtrl: ViewController) {
    this.token = this.viewCtrl.data.token;
    this.address = this.buildAddress(this.token.address);
  }

  public close(action?: string): void {
    this.viewCtrl.dismiss(action === 'add' ? { token: this.token } : null);
  }

  private buildAddress(address: string) {
    return (
      address.substring(0, 6) + '....' + address.substring(address.length - 4)
    );
  }
}
