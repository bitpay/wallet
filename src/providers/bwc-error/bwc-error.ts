import { Injectable } from '@angular/core';

@Injectable()
export class BwcErrorProvider {

  constructor() {
    console.log('Hello BwcErrorProvider Provider');
  }
  //TODO
  msg(err: any, prefix?: string){
    return "TODO: bwcError msg(err, prefix)";
  }

  cb(err: string, prefix?: string): Promise<any> {
    return new Promise((resolve, reject)=> {
      resolve(this.msg(err, prefix));
    });      
  };
}
