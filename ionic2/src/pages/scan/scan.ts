import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from 'angular2-logger/core';

import { IncomingDataService } from '../../services/incoming-data.service';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html'
})
export class ScanPage {

  passthroughMode: boolean = false;

  scannerStates:any = {
    unauthorized: 'unauthorized',
    denied: 'denied',
    unavailable: 'unavailable',
    loading: 'loading',
    visible: 'visible'
  };

  currentState: any;

  scannerIsAvailable: any = false;
  scannerHasPermission: boolean = false;
  scannerIsDenied: boolean = false;
  scannerIsRestricted: boolean = false;
  canEnableLight: boolean = false;
  canChangeCamera: boolean = false;
  canOpenSettings: boolean = false;

  cameraToggleActive: boolean = false;
  lightActive: boolean = false;

  // placeholder for incomingData service for now
  // incomingData: any = {
  //   redir: () => {}
  // };

  constructor(
    public logger: Logger,
    public nav: NavController,
    public navParams: NavParams,
    public scannerService: ScannerService,
    public incomingData: IncomingDataService
  ) {
    this.passthroughMode = this.navParams.data.passthroughMode;
    this.incomingData.actionSheetObservable.subscribe((data) => {
      if(data.action === 'hide') {
        this.scannerService.resumePreview();
        this.activate();     
      }
    });
  }

  _updateCapabilities() {
    let capabilities = this.scannerService.getCapabilities();
    this.scannerIsAvailable = capabilities.isAvailable;
    this.scannerHasPermission = capabilities.hasPermission;
    this.scannerIsDenied = capabilities.isDenied;
    this.scannerIsRestricted = capabilities.isRestricted;
    this.canEnableLight = capabilities.canEnableLight;
    this.canChangeCamera = capabilities.canChangeCamera;
    this.canOpenSettings = capabilities.canOpenSettings;
  }

  _handleCapabilities() {
    // always update the view
    setTimeout(() => {
      if(!this.scannerService.isInitialized()){
        this.currentState = this.scannerStates.loading;
      } else if(!this.scannerIsAvailable){
        this.currentState = this.scannerStates.unavailable;
      } else if(this.scannerIsDenied){
        this.currentState = this.scannerStates.denied;
      } else if(this.scannerIsRestricted){
        this.currentState = this.scannerStates.denied;
      } else if(!this.scannerHasPermission){
        this.currentState = this.scannerStates.unauthorized;
      }
      this.logger.debug('Scan view state set to: ' + this.currentState);
    });
  }

  _refreshScanView() {
    this._updateCapabilities();
    this._handleCapabilities();
    if(this.scannerHasPermission) {
      this.activate();
    }
  }

  ionViewDidEnter() {
    // try initializing and refreshing status any time the view is entered
    this.scannerService.gentleInitialize(() => {
      this._refreshScanView();
    });
    this.scannerService.resumePreview();
  }

  activate(){
    this.scannerService.activate(() => {
      this._updateCapabilities();
      this._handleCapabilities();
      this.logger.debug('Scanner activated, setting to visible...');
      this.currentState = this.scannerStates.visible;
        // pause to update the view
        setTimeout(() => {
          this.scannerService.scan((err, contents) => {
          if(err){
            this.logger.debug('Scan canceled.');
          }
          else if (this.passthroughMode) {
            this.goBack();
          }
          else {
            this.handleSuccessfulScan(contents);
          }
          });
        });
    });
  }

  authorize(){
    this.scannerService.initialize(() => {
      this._refreshScanView();
    });
  }

  ionViewDidLeave() {
    this.scannerService.deactivate();
  }

  handleSuccessfulScan(contents){
    this.logger.debug('Scan returned: "' + contents + '"');
    this.scannerService.pausePreview();
    console.log('getting type for contents', contents);
    this.incomingData.getDataType(contents).then((type) => {
      console.log('type', type);
      this.incomingData.showMenu(type);
    });
    //this.incomingData.redir(contents);
  }

  // $rootScope.$on('incomingDataMenu.menuHidden', () => {
  //   this.scannerService.resumePreview();
  //   this.activate();
  // });

  openSettings() {
    this.scannerService.openSettings();
  }

  attemptToReactivate() {
    this.scannerService.reinitialize();
  }

  toggleLight(){
    this.scannerService.toggleLight((lightEnabled) => {
      this.lightActive = lightEnabled;
    });
  }

  toggleCamera(){
    this.cameraToggleActive = true;
    this.scannerService.toggleCamera((status) => {
    // (a short delay for the user to see the visual feedback)
      setTimeout(() => {
        this.cameraToggleActive = false;
        this.logger.debug('Camera toggle control deactivated.');
      }, 200);
    });
  }

  canGoBack(){
    return this.passthroughMode;
  }

  goBack(){
    this.nav.pop();
  }
}
