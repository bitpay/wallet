import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'email-component',
  templateUrl: 'email-component.html'
})
export class EmailComponent extends ActionSheetParent {
  public emailForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    super();
    this.emailForm = this.formBuilder.group({
      email: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
          )
        ])
      ]
    });
  }

  ionViewDidLoad() {
    this.emailForm.setValue({
      email: ''
    });
  }

  public optionClicked(): void {
    this.dismiss(this.emailForm.value.email);
  }
}
