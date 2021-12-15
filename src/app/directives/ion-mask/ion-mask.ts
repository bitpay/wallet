import { Directive, Input } from '@angular/core';
import { IonInput } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createTextMaskInputElement } from 'text-mask-core';

@Directive({
  selector: '[ionMask]',
  providers: [IonInput]
})
export class IonMask {
  @Input('ionMask')
  private mask: any[] = [];
  private clearInputListeners: Subject<void> = new Subject<void>();

  constructor(public ionInput: IonInput) {}

  public ngOnInit() {
    this.configureInput();
  }

  ngOnChanges() {
    this.clearInputListeners.next();
    if (this.mask) this.configureInput();
  }

  public ngOnDestroy() {
    this.clearInputListeners.next();
  }

  public async configureInput() {
    const input = await this.ionInput.getInputElement();
    const maskedInput = createTextMaskInputElement({
      inputElement: input,
      mask: this.mask,
      guide: false
    });
    maskedInput.update(this.ionInput.value);
    this.ionInput.value = input.value;
    this.ionInput.ionChange
      .pipe(takeUntil(this.clearInputListeners))
      .subscribe((event: any) => {
        const { value } = event;
        maskedInput.update(value);
        this.ionInput.value = input.value;
      });
  }
}
