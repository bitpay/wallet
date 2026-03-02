import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'memo-component',
  templateUrl: 'memo-component.html'
})
export class MemoComponent extends ActionSheetParent {
  public memoForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    super();
    this.memoForm = this.formBuilder.group({
      memo: ['']
    });
  }

  ngOnInit() {
    this.memoForm.setValue({
      memo: this.params.memo || ''
    });
  }

  public optionClicked(): void {
    this.dismiss(this.memoForm.value.memo);
  }
}
