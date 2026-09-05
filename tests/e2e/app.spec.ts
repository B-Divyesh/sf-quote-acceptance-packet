import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => Promise.all(['scopestamp-local', 'demo:scopestamp-local'].map(name => new Promise<void>(resolve => { const request = indexedDB.deleteDatabase(name); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); }))));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('creates, locks, shares, decides and imports a quote receipt', async ({ page, context }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.getByRole('button', { name: 'Start your first quote' }).click();
  await page.getByLabel('Your business name').fill('Northline Joinery');
  await page.getByLabel('Your email').fill('owner@example.test');
  await page.getByLabel('Client name').fill('Alex Client');
  await page.getByLabel('Project / job title').fill('Built-in shelving');
  await page.getByLabel('Scope summary').fill('Build and fit two oak shelving bays.');
  await page.getByLabel('Item 1 description').fill('Oak shelving bay');
  await page.getByLabel('Item 1 quantity').fill('2');
  await page.getByLabel('Item 1 unit price').fill('750');
  await page.getByLabel('Not included').fill('Painting\nElectrical work');
  await page.getByRole('button', { name: 'Lock & prepare to share' }).click();
  await expect(page.getByText(/Awaiting decision/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Copy / share link' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#review=');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('#review=');

  const client = await context.newPage();
  client.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await client.goto(link);
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
  await client.getByLabel('Your full name').fill('Alex Client');
  await client.getByRole('checkbox').check();
  await client.getByRole('button', { name: 'Accept quote' }).click();
  await expect(client.getByText(/Accepted/).first()).toBeVisible();
  const downloadPromise = client.waitForEvent('download');
  await client.getByRole('button', { name: 'Download receipt' }).click();
  const receipt = await downloadPromise;
  const receiptPath = await receipt.path();
  expect(receiptPath).toBeTruthy();

  await page.getByRole('button', { name: 'Import client receipt' }).click();
  await page.locator('input[type=file]').setInputFiles(receiptPath!);
  await expect(page.getByText('Recorded decision')).toBeVisible();
  await expect(page.getByText(/Accepted/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Add change card' }).click();
  await page.getByLabel('Change title').fill('Add a third shelving bay');
  await page.getByLabel('What changes').fill('Build and fit one matching additional bay.');
  await page.getByLabel('Price adjustment').fill('700');
  await page.getByLabel('Schedule impact').fill('Adds two working days');
  await page.getByRole('button', { name: 'Lock change card' }).click();
  await expect(page.getByRole('heading', { name: 'Add a third shelving bay' })).toBeVisible();
  await page.getByRole('button', { name: 'Share change link' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#review=');
  const changeLink = await page.evaluate(() => navigator.clipboard.readText());
  await client.goto(changeLink);
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
  await client.getByLabel('Your full name').fill('Alex Client');
  await client.getByRole('checkbox').check();
  await client.getByRole('button', { name: 'Accept change' }).click();
  const changeDownloadPromise = client.waitForEvent('download');
  await client.getByRole('button', { name: 'Download receipt' }).click();
  const changeReceipt = await changeDownloadPromise;
  await page.getByRole('button', { name: 'Import receipt' }).click();
  await page.locator('input[type=file]').setInputFiles((await changeReceipt.path())!);
  await expect(page.getByText('✓ Accepted').last()).toBeVisible();

  // @axe-core/playwright may resolve a newer Playwright type while the worker
  // intentionally pins its browser-compatible 1.58.2 runtime.
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter(v => ['serious','critical'].includes(v.impact || ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('accepted-record.png'), fullPage: true });
});

test('installed app shell and records remain available offline', async ({ page, context }) => {
  await navigatorReady(page);
  await page.reload();
  await page.getByRole('button', { name: 'Start your first quote' }).click();
  await page.getByLabel('Project / job title').fill('Offline draft');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect.poll(() => page.evaluate(async () => {
    const keys = await caches.keys();
    if (!keys.length) return false;
    const cache = await caches.open(keys[0]);
    const request = (await cache.keys()).find(row => row.url.endsWith('.js'));
    return request ? (await (await cache.match(request))!.text()).length > 1000 : false;
  })).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Offline draft' })).toBeVisible();
  await expect(page.getByText('Offline · saved locally')).toBeVisible();
});

async function navigatorReady(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller && registration.active) {
      await new Promise<void>(resolve => {
        const timeout = setTimeout(resolve, 1500);
        navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
      });
    }
  });
}

test('keyboard navigation moves focus for skip links and routes', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Privacy', exact: true })).toBeFocused();
  await expect(page.locator('#route-live')).toHaveText('Privacy');
  await expect(page).toHaveTitle('Privacy — ScopeStamp');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Record a quote and client decision' })).toBeFocused();
});

test('demo, legal, and not-found routes have complete page structure', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — ScopeStamp');
  await expect(page.getByText('Demo — sample data, nothing is saved to your records')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);

  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — ScopeStamp');
  await expect(page.locator('h1')).toHaveCount(1);

  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — ScopeStamp');
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});

test('a first service-worker install does not announce a false update', async ({ page }) => {
  await navigatorReady(page);
  await page.waitForTimeout(500);
  await expect(page.locator('#toast-live')).not.toContainText(/update/i);
});

test('visible controls meet the touch target baseline and motion can be reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const shortTargets = await page.locator('a:visible, button:visible').evaluateAll(elements => elements
    .map(element => ({ label: (element.textContent || element.getAttribute('aria-label') || '').trim(), rect: element.getBoundingClientRect() }))
    .filter(item => item.rect.width < 44 || item.rect.height < 44)
    .map(item => ({ label: item.label, width: item.rect.width, height: item.rect.height })));
  expect(shortTargets).toEqual([]);
  const transition = await page.getByRole('button', { name: 'Start your first quote' }).evaluate(element => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.00001);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('dark treatment and the purchase dialog pass an accessibility scan', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(23, 27, 29)');
  const opener = page.getByRole('button', { name: 'View Field kit' }).first();
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy once for $39' })).toBeFocused();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))).toEqual([]);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(opener).toBeFocused();
});
