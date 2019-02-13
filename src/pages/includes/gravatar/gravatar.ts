import { Component, Input } from '@angular/core';

@Component({
  selector: 'gravatar',
  templateUrl: 'gravatar.html'
})
export class GravatarPage {
  public emailHash;

  @Input()
  email: string;
  @Input()
  name: string;
  @Input()
  height: number;
  @Input()
  width: number;

  constructor() {}
}
