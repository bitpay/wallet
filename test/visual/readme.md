# Copay/BitPay Visual Regression Testing

As part of our continuous testing, we compare screenshots taken during our e2e testing with screenshots that have been previously reviewed by a contributor. Since we're able to comprehensively review all UI changes, we can confidently iterate on the app design while avoiding visual defects making it to users.

To run all tests, capture screenshots for the current state of the app, and run the visual regression test, simply run:

```
$ npm test
```

If you've made changes which causes one or more generated screenshots to differ from their previous state, the test should fail. Open the generated `report.html` to view the differences.

Once you've reviewed the changed screenshots for visual defects, you can approve the changes using `reg-cli`'s `--update` flag:

```
$ npm run test:visual -- --update
```
