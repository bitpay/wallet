import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { PlatformProvider } from '../platform/platform';
import 'rxjs/add/operator/map';

/*
  Generated class for the ScanProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class ScanProvider {

  public text: string;
  public scannerVisible: boolean;

  constructor(public http: Http, private qrScanner: QRScanner, private platform: PlatformProvider) {
    this.scannerVisible = false;
  }

  activate(): Promise<any> {
    return new Promise(resolve => {
      if (this.platform.isCordova) {
        console.log("Cordova device");
        this.qrScanner.show();
        this.scannerVisible = true;
        // start scanning
        let scanSub = this.qrScanner.scan().subscribe((text: string) => {
          console.log('Scanned something' + text);
          this.text = text;
          resolve(this.text);
          this.scannerVisible = false;
          this.qrScanner.hide(); // hide camera preview
          scanSub.unsubscribe(); // stop scanning
        });
      } else {
        resolve("ERROR - No Cordova device");
      }
    });
  }

}
