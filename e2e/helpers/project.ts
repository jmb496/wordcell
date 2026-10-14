import { test } from '@playwright/test';

// AD-17 project gates for `test.beforeEach(onAndroid)` / `test.beforeEach(onDesktop)` (ticket 5.14
// S1): touch flows run on the `android` project, mouse and keyboard flows on `desktop`.
export const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch flows run on android');
export const onDesktop = () =>
  test.skip(test.info().project.name !== 'desktop', 'mouse flows run on desktop');
