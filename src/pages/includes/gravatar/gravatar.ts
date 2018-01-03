import { Component, Input, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Md5 } from 'ts-md5/dist/md5';
import { Logger } from '@nsalaun/ng-logger';

@Component({
  selector: 'gravatar',
  templateUrl: 'gravatar.html',
})
export class GravatarPage {

  private emailHash: any;

  @Input() email: string;
  @Input() name: string;
  @Input() height: number;
  @Input() width: number;

  constructor(
    private logger: Logger
  ) {
  }

  ngOnInit() {
    this.logger.info('ionViewDidLoad GravatarPage');
    if (typeof this.email === "string") {
      this.emailHash = Md5.hashStr(this.email.toLowerCase() || '');
    }
  }

}
