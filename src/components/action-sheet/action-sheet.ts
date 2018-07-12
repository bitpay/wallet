import { Component, HostBinding } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import { DomProvider } from '../../providers/dom/dom';

@Component({
  selector: 'action-sheet',
  templateUrl: 'action-sheet.html'
})
export class ActionSheetComponent {
  private transitionDuration: number = 250;
  private parentComponentRef: any;
  private deregisterBackButtonAction;
  @HostBinding('class.open') public slideIn: boolean = false;

  constructor(private domProvider: DomProvider, private platform: Platform) {}

  ngOnInit() {
    this.overrideHardwareBackButton();
  }

  public async present(componentRef: any) {
    this.parentComponentRef = componentRef;
    await Observable.timer(50).toPromise();
    this.slideIn = true;
  }

  public async dismiss(): Promise<void> {
    this.slideIn = false;
    await Observable.timer(this.transitionDuration).toPromise();
    this.domProvider.removeComponent(this.parentComponentRef);
  }

  overrideHardwareBackButton() {
    this.deregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => this.dismiss()
    );
  }

  ngOnDestroy() {
    this.deregisterBackButtonAction();
  }
}
