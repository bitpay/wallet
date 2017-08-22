import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';
//import { QRScanner as QRScannerBrowser } from 'cordova-plugin-qrscanner/src/browser/src/library'

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  providers: [ScanProvider]
})
export class ScanPage implements OnInit {

  public text: string;
  public scannerVisible: boolean;
  public canEnableLight: boolean;
  public canChangeCamera: boolean;

  // private qrScannerBrowser: QRScannerBrowser (inside constructor)
  constructor(public navCtrl: NavController, public navParams: NavParams, private scanProvider: ScanProvider, private platform: PlatformProvider) {
    this.text = "Codigo QR";
    this.canEnableLight = true;
    this.canChangeCamera = true;
    this.scannerVisible = this.platform.isCordova ? true : false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanPage');
  }

  ngOnInit () {
    this.scanProvider.activate()
      .then(resp => {
        console.log("resp");
        console.log(resp);
        this.text = resp;
      })
      .catch(error => {
        console.log("error: " + error);
      });
  }

}
