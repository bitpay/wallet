import { Component, Input } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';

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

  ngOnInit() {
    if (typeof this.email === 'string') {
      this.emailHash = Md5.hashStr(this.email.toLowerCase() || '');
    }
  }
}
