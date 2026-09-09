# ISSUES

## BugFixes

## Improvements

- [!] [I001] (P1) Adopt the current shared footer contract
  Goal: The CTX documentation page uses the current mpr-ui footer menu.
  Requirements:
  - Preserve the four resource links and the MIT license content.
  - Keep literal `@latest` shared asset URLs.
  - Verify the real shared candidate at mobile and desktop widths.
  Validation:
  - Record a failing browser regression before the markup change.
  - Verify menu navigation, keyboard controls, page reload, and license content.
  - Run final `make ci` and inspect hosted CI.
  - Complete shared publication, cache transition, and public acceptance before activation.
  Results:
  - Both browser regressions failed before the footer change and passed after it.
  - Final local CI passed formatting, Go vet, Go tests, and both browser checks.
  Blocked:
  - Hosted CI remains pending.
  - Publication preparation requires the Pages resource, release identity, and maintenance artifact.
  - Shared publication, cache transition, and public acceptance remain pending.


## Maintenance

## Features

## Planning
