import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';

// Providers
import { PlatformProvider } from '../../providers/platform/platform';

@Component({
  selector: 'editable-item',
  templateUrl: 'editable-item.html'
})
export class EditableItemComponent {
  public isFocused: boolean;
  public finishedFocus: boolean;
  public textInput = new FormControl('');
  public saving: boolean;
  @ViewChild('itemTextarea')
  itemTextarea;
  @ViewChild('itemTextarea', { read: ElementRef })
  moveCaret: ElementRef;
  @Output()
  valChange: EventEmitter<string> = new EventEmitter();
  @Output()
  focus: EventEmitter<boolean> = new EventEmitter();
  @Input()
  value: string;
  @Input()
  itemPlaceholder: string;

  listenerForEnsuringBlurOnIos = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };

  constructor(private platformProvider: PlatformProvider) {
    this.textInput.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(value => {
        this.value = value;
        this.saving = true;
        if (!this.value) {
          this.value = '';
        }
        this.valChange.emit(value);
        Observable.timer(2000)
          .toPromise()
          .then(() => {
            this.saving = false;
          });
      });
    this.saving = false;
    this.isFocused = false;
    this.finishedFocus = false;
  }

  ngAfterViewInit(): void {
    this.resizeTextarea();
  }

  public resizeTextarea() {
    if (!this.moveCaret) return;
    const textArea = this.moveCaret.nativeElement.getElementsByClassName(
      'text-input'
    )[0];
    textArea.style.overflow = 'hidden';
    textArea.style.minHeight = '31px';
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
  }

  public saveValueNow(): void {
    this.isFocused = false;
    this.finishedFocus = false;
    if (this.platformProvider.isCordova) {
      this.focus.emit(false);
    }
    if (!this.value) {
      this.value = '';
    }
    this.valChange.emit(this.value);
    this.disableClickBlock();
  }

  public async toggleValueUpdate(): Promise<void> {
    if (this.isFocused) return;
    if (this.platformProvider.isCordova) {
      this.focus.emit(true);
    }
    this.isFocused = true;
    await Observable.timer(150).toPromise();
    if (this.itemTextarea) {
      this.itemTextarea.setFocus();
    }
    if (this.moveCaret) {
      const elem = this.moveCaret.nativeElement.getElementsByTagName(
        'textarea'
      )[0];
      if (this.value) {
        elem.setSelectionRange(this.value.length, this.value.length);
      }
    }
    this.enableClickBlock();
    await Observable.timer(250).toPromise();
    this.finishedFocus = true;
  }

  private getIonApp() {
    return document.getElementsByTagName('ion-app')[0];
  }

  private enableClickBlock() {
    // Ensures that tapping on other clickable elements on a page
    // only blurs the textarea (and ignores any other click listeners)
    this.getIonApp().addEventListener(
      'click',
      this.listenerForEnsuringBlurOnIos,
      true
    );
  }

  private async disableClickBlock() {
    await Observable.timer(100).toPromise();
    this.getIonApp().removeEventListener(
      'click',
      this.listenerForEnsuringBlurOnIos,
      true
    );
  }
}
