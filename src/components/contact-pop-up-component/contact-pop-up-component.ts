import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'contact-pop-up-component',
  templateUrl: 'contact-pop-up-component.html'
})
export class ContactPopUpComponent extends ActionSheetParent {
  public contactForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    super();
    this.contactForm = this.formBuilder.group({
      name: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ngOnInit() {
   
  }

  public optionClicked(): void {
    this.dismiss(this.contactForm.value.name);
  }
}
