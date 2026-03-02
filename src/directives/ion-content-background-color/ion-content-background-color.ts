import { Directive, ElementRef, Input } from '@angular/core';
import { AppProvider } from '../../providers/app/app';

@Directive({
  selector: '[ion-content-background-color]',
  host: { class: 'ion-content-background-color' }
})
export class IonContentBackgroundColor {
  @Input('ion-content-background-color')
  color: string;

  constructor(private element: ElementRef, private app: AppProvider) {}

  ngOnChanges() {
    this.setContentBackgroundColor(this.color);
  }

  setContentBackgroundColor(color: string): void {
    const ionContent = this.element.nativeElement.getElementsByClassName(
      'fixed-content'
    )[0];
    if (color) ionContent.style.setProperty('background-color', color);
    else {
      const color = this.app.info.nameCase == 'Copay' ? '#192c3a' : '#2a3f90';
      ionContent.style.setProperty('background-color', color);
    }
  }
}
