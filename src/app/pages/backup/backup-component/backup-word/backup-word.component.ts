import { Component, Input, NgZone, OnInit, ViewEncapsulation } from '@angular/core';
import { BackupWordModel } from './backup-word.model';

@Component({
  selector: 'app-backup-word',
  templateUrl: './backup-word.component.html',
  styleUrls: ['./backup-word.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BackupWordComponent implements OnInit {
  @Input()
  mnemonicWords : BackupWordModel[];
  isShow = false;
  constructor() { }

  ngOnInit() {}
}
