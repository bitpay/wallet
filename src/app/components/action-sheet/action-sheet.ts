import { Component, HostBinding, Input, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { timer } from 'rxjs';
import { DomProvider } from 'src/app/providers/dom/dom';

@Component({
  selector: 'action-sheet',
  templateUrl: 'action-sheet.html',
  styleUrls: ['action-sheet.scss'],
})
export class ActionSheetComponent {
  public maxHeight: string = '90vh';
  public minHeight: string = 'unset';
  private transitionDuration: number = 250;
  private parentComponentRef: any;
  private deregisterBackButtonAction;
  public dismissFunction: (data?: any) => void;
  @HostBinding('class.open')
  public slideIn: boolean = false;
  @Input() fromTop: boolean ;

  constructor(
    private domProvider: DomProvider,
    private platform: Platform,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.overrideHardwareBackButton();
  }

  public async present(
    componentRef: any,
    params: { maxHeight: string; minHeight: string } = {
      maxHeight: '90vh',
      minHeight: 'unset'
    }
  ) {
    this.parentComponentRef = componentRef;
    await timer(50).toPromise();
    this.zone.run(() => {
      this.maxHeight = params.maxHeight;
      this.minHeight = params.minHeight;
      this.slideIn = true;
    });
  }

  public async dismiss(data?: any): Promise<void> {
    this.zone.run(() => (this.slideIn = false));
    this.dismissFunction && this.dismissFunction(data);
    await timer(this.transitionDuration).toPromise();
    this.domProvider.removeComponent(this.parentComponentRef);
  }

  overrideHardwareBackButton() {
    this.deregisterBackButtonAction = this.platform.ready().then(() => {
      document.addEventListener("backbutton", () => { 
        () => this.dismiss()
      });
    });
  }

  ngOnDestroy() {
    this.deregisterBackButtonAction();
  }
}
