import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
//import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';
import { AmountPage } from '../send/amount/amount';

//import { QRScanner as QRScannerBrowser } from 'cordova-plugin-qrscanner/src/browser/src/library'

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  providers: [ScanProvider]
})
export class ScanPage {

  public text: string;
  public scannerVisible: boolean;
  public canEnableLight: boolean;
  public canChangeCamera: boolean;
  public lightActive: boolean;
  public cameraToggleActive: boolean;

  // private qrScannerBrowser: QRScannerBrowser (inside constructor)
  constructor(public navCtrl: NavController, public navParams: NavParams, private scanProvider: ScanProvider, private platform: PlatformProvider) {
    this.text = "Codigo QR";
    this.lightActive = false;
    this.canEnableLight = true;
    this.canChangeCamera = true;
    this.scannerVisible = this.platform.isCordova ? true : false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanPage');
  }

  ionViewWillEnter() {
    this.lightActive = false;
    this.scanProvider.activate()
      .then(resp => {
        this.text = resp;
        // TODO: implement incomingData
        this.navCtrl.push(AmountPage, { address: this.text });
      })
      .catch(error => {
        console.log("error: " + error);
        this.text = error;
      });
  }

  ionViewWillLeave() {
    this.scanProvider.deactivate()
      .then(resp => {
        this.lightActive = false;
      })
      .catch(error => {
        console.log("error: " + error);
        this.text = error;
      });
  }

  toggleLight() {
    this.scanProvider.toggleLight()
      .then(resp => {
        this.lightActive = resp;
      })
      .catch(error => {
        console.log("error: " + error);
        this.text = error;
      });
  };

  toggleCamera() {
    this.scanProvider.toggleCamera()
      .then(resp => {
        this.cameraToggleActive = resp;
      })
      .catch(error => {
        console.log("error: " + error);
        this.text = error;
      });
  };

}
