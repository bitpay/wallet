import { Component, ViewEncapsulation } from "@angular/core";
import { ModalController, NavController, NavParams } from '@ionic/angular';
import _ from "lodash";

@Component({
  selector: 'token-info',
  templateUrl: 'token-info.html',
  styleUrls: ['token-info.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TokenInforPage {
  tokenInfo;
  tokenShowUi;
  constructor(
    private viewCtrl: ModalController,
    private navParams : NavParams
  ) {
    this.tokenInfo = this.navParams.data.tokenInfo;
  }

  ngOnInit() {

    this.tokenShowUi = [
      {
        name : 'Decimals',
        value: this.tokenInfo.decimals
      },
      {
        name : 'Token ID',
        value: this.tokenInfo.id
      },
      {
        name : 'Document',
        value: this.tokenInfo.documentUri
      },
      {
        name : 'Genesis',
        value: this.tokenInfo.timestamp
      },
      {
        name : 'Initial Quantity',
        value: !this.tokenInfo.initialTokenQty  ? 0 : this.tokenInfo.initialTokenQty
      }
      // {
      //   name : 'Total Burned',
      //   value:  !this.tokenInfo.totalBurned  ? 0 : this.tokenInfo.totalBurned
      // },
      // {
      //   name : 'Total Minted',
      //   value: !this.tokenInfo.totalMinted  ? 0 : this.tokenInfo.totalMinted
      // },

      // {
      //   name : 'Circulating Supply',
      //   value:  !this.tokenInfo.circulatingSupply ? 0 : this.tokenInfo.circulatingSupply
      // }
    ]
  }

  close() {
    this.viewCtrl.dismiss();
  }

}