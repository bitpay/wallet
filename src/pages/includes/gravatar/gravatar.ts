import { Component, Input } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'gravatar',
  templateUrl: 'gravatar.html'
})
export class GravatarPage {
  public emailHash: any;

  @Input() public email: string;
  @Input() public name: string;
  @Input() public height: number;
  @Input() public width: number;

  constructor(private logger: Logger) {}

  public ngOnInit() {
    this.logger.info('ionViewDidLoad GravatarPage');
    if (typeof this.email === 'string') {
      this.emailHash = Md5.hashStr(this.email.toLowerCase() || '');
    }
  }
}
