import { Location } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { EventManagerService } from 'src/app/providers/event-manager.service';

// Providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-addressbook-view',
  templateUrl: 'view.html',
  styleUrls: ['view.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddressbookViewPage {
  public contact;
  public address: string;
  public coin: string;
  public email: string;
  public tag?: string;
  public name: string;
  public network: string;
  navParamsData;
  
  constructor(
    private addressBookProvider: AddressBookProvider,
    private addressProvider: AddressProvider,
    private router: Router,
    private location: Location,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private events: EventManagerService
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.address = this.navParamsData.contact.address;
    if (
      !this.navParamsData.contact.coin ||
      !this.navParamsData.contact.network
    ) {
      const addrData = this.addressProvider.getCoinAndNetwork(this.address);
      if (!this.navParamsData.contact.coin) this.coin = addrData.coin; // preserve coin
      this.network = addrData.network;
    } else {
      this.coin = this.navParamsData.contact.coin;
      this.network = this.navParamsData.contact.network;
    }
    this.name = this.navParamsData.contact.name;
    this.email = this.navParamsData.contact.email;
    this.tag = this.navParamsData.contact.tag;
  }
  
  private sendTo(): void {
    this.router.navigate(['/amount'], {
      state: {
        toAddress: this.address,
        name: this.name,
        email: this.email,
        destinationTag: this.tag,
        coin: this.coin,
        recipientType: 'contact',
        network: this.network
      }
    })
  }

  send():void{
    this.router.navigate(['/amount'], {
      state: {
        toAddress: this.address,
        name: this.name,
        email: this.email,
        destinationTag: this.tag,
        coin: this.coin,
        recipientType: 'contact',
        network: this.network
      }
    })
  }

  public remove(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'delete-contact',
      { secondBtnGroup: true }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (!option) return;
      this.addressBookProvider
        .remove(this.address, this.network, this.coin)
        .then(() => {
          this.events.publish('Local/AddressBook/Changed');
          this.router.navigate(['/addressbook']); 
        })
        .catch(err => {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        });
    });
  }
}
