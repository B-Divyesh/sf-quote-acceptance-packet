import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>(resolve => { const request = indexedDB.deleteDatabase('scopestamp-local'); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve(); }));
  await page.reload();
});

test('creates, locks, shares, decides and imports a quote receipt', async ({ page, context }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.getByRole('button', { name: 'Start a quote' }).click();
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
  await page.getByRole('button', { name: 'Start a quote' }).click();
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
