# Copay/BitPay Wallet Statistics

### Installation
 Get the source code:

 `git clone git@github.com:bitpay/copay.git && cd copay`
 `git fetch upstream stats:stats`
 `git checkout stats`

### About Copay/BitPay Statistics

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.2.1.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Publish web on Github Pages (gh-pages)

### Install:
`npm i -g angular-cli-ghpages`

### Build:
`ng build --prod --aot=false --base-href "https://USER.github.io/APP-NAME/"`

(see base-href on your repo settings)

### To publish the web on gh-pages branch:
go to stats branch and run:
`ngh`

Successfully published!
