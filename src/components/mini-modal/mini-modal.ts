import { Component, ViewChild } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { MiniModalContent, ModalCancelText } from './mini-modal-content';

@Component({
  selector: 'mini-modal',
  templateUrl: 'mini-modal.html'
})
export class MiniModalComponent {
  modal: string;

  @ViewChild(MiniModalContent) modalContent: MiniModalContent;

  constructor(private viewCtrl: ViewController, private navParams: NavParams) {
    this.modal = this.navParams.get('modal');
  }

  ngAfterViewInit() {
    this.modalContent.action.subscribe(confirm => {
      this.close(confirm);
    });
  }

  public close(confirm: boolean): void {
    this.viewCtrl.dismiss(confirm, null, { animate: false });
  }
}

export const MINI_MODAL_COMPONENTS = [
  MiniModalComponent,
  MiniModalContent,
  ModalCancelText
];
