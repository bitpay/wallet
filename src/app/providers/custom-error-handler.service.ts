import { Injectable } from '@angular/core';
import { ErrorHandler } from '@angular/core';

/**
 * Error handler that extends default Ionic functionality to show error messages as
 * toast popups in addition to logging to the console.
 */
@Injectable({
  providedIn: 'root'
})

export class CustomErrorHandler implements ErrorHandler {
    handleError(error) {
      // do something with the exception
    }
  }