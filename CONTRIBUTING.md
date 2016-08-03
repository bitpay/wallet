
# Contributing to Copay

Please take a moment to review this document in order to make the contribution
process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project. In return,
they should reciprocate that respect in addressing your issue or assessing
patches and features.


## Using the issue tracker

The issue tracker is the preferred channel for [bug reports](#bugs),
[features requests](#features), support requests (#support) and [submitting pull
requests](#pull-requests), but please respect the following restrictions:

* Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others.


<a name="bugs"></a>
## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
   latest `master` or development branch in the repository.

3. **Isolate the problem** &mdash; create a [reduced test
   case](http://css-tricks.com/reduced-test-cases/) and a live example.

A good bug report shouldn't leave others needing to chase you up for more
information. Please try to be as detailed as possible in your report. What is
your environment? What steps will reproduce the issue? What browser(s) and OS
experience the problem? What would you expect to be the outcome? All these
details will help people to fix any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If
> suitable, include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the reduced test case
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).


<a name="features"></a>
## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.

<a name="support"></a>
## Support requests

If you are having particular problem with your Copay instalation, please first [search older 
issues](https://github.com/bitpay/copay/issues) in order to learn if the issue is already reported. It could be fixed already. 

Please also check our [FAQ](https://github.com/bitpay/copay/wiki/COPAY---FAQ).

When requesting support describe the issue as much in detail as possible. Consider to
provide the following information:

 - Which platform are you using? (Which device and operating system)
 - Which version of Copay are you using? (Check Copay version on the side menu)
 - Please import your wallet on a different platform. Does the problem persist?
 - What type of wallet are you using? (multisig or singlesig)
 - When the wallet was created? On which device / operating system
 - Please check Copay logs (General Settings -> About Copay -> Session Logs). Look for 
 any errors reported there (errors are shown in red)
 - If possible, please provide a screenshot of the error / issue.
 
If you need to provide personal / sensitive data to solve the issue (like the Wallet Id), do not use Github Issues. 
We will provide a better channel (like an BitPay email address) so you can send the information. If possible, please
encrypt your emails using GnuPG.

To open an issue go to [Github Issues](https://github.com/bitpay/copay/issues).

<a name="pull-requests"></a>
## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

Please adhere to the coding conventions used throughout Copay (indentation, tests, etc.)

**IMPORTANT**: By submitting a patch, you agree to allow the project owner to
license your work under the same license as that used by the project.

===


This file is based on @necolas's https://github.com/necolas/issue-guidelines/blob/master/CONTRIBUTING.md
