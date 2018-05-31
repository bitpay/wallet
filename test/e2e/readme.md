# Notes on E2E Testing

- **Don't bother `expect`ing the contents of elements on a page.** The primary E2E test should be visual difference testing, so just test the whole page with `expectPage` from `utils`.
- **Don't try too hard to target an element.** If possible, just add a class of `e2e-something-relevant` directly to the html template. Extra classes aren't seen by end users and don't harm performance - by leaving e2e "hooks" in the view, we make maintenance just a little easier.
