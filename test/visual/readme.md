# Copay/BitPay Visual Regression Testing

As part of our continuous testing, we compare screenshots taken during our e2e testing with screenshots that have been previously reviewed by a contributor. Since we're able to comprehensively review all UI changes, we can quickly and confidently iterate on the app design.

## Approving Changes

If a screenshot taken during the e2e tests doesn't closely match it's expected version (in the `expected` folder), `test:visual` will fail. So when you make a change to the UI, you'll need to update the relevant screenshots in the visual tests.

### Option 1: Copy Screenshots from CircleCI

When you submit a PR, CircleCI will automatically try building your changes. When the build fails, you'll be able to view the `report.html` in the CircleCI Artifacts for that build.

Once you've reviewed the changes in the report, simply copy the updated images from the report to the `expected` directory locally, commit them, and push.

### Option 2: Build Screenshots Locally

To capture screenshots locally, first install [Docker](https://www.docker.com/), then run:

```
$ npm run e2e:docker
```

The first run will take longer than future runs, as it must also download the base Docker image (and has nothing cached).

New screenshots will be generated in the `latest` directory. When it's done, run:

```
$ npm run test:visual
```

If you've made changes which causes one or more generated screenshots to differ from their previous state, the test should fail. Open the generated `report.html` to view the differences.

Once you've reviewed the changed screenshots for visual defects, you can approve the changes using `reg-cli`'s `--update` flag:

```
$ npm run test:visual -- --update
```

This will automatically copy all the changed images into the `expected` directory.
