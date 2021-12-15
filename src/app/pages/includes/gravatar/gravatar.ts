import { Component, Input } from '@angular/core';

@Component({
  selector: 'gravatar',
  templateUrl: 'gravatar.html',
  styleUrls: ['gravatar.scss']
})
export class GravatarPage {
  @Input()
  email: string;
  @Input()
  name: string;
  @Input()
  height: number;
  @Input()
  width: number;
  @Input()
  coin: string;
  @Input()
  network: string;

  constructor() {}
}
