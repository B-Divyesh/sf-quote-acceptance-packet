import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function clearProductState(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    await Promise.all(['scopestamp-local', 'demo:scopestamp-local'].map(name => new Promise<void>(resolve => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    })));
    await Promise.all((await caches.keys()).map(key => caches.delete(key)));
  });
  await page.reload();
}

async function startQuote(page: Page, title: string, lock = true): Promise<void> {
  const first = page.getByRole('button', { name: 'Start your first quote' });
  if (await first.isVisible().catch(() => false)) await first.click();
  else await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await page.getByLabel('Your business name').fill('Northline Joinery');
  await page.getByLabel('Your email').fill('owner@example.test');
  await page.getByLabel('Client name').fill('Maya Chen');
  await page.getByLabel('Project / job title').fill(title);
  await page.getByLabel('Scope summary').fill('Build and fit two oak shelving bays along the north wall.');
  await page.getByLabel('Item 1 description').fill('Oak shelving bay');
  await page.getByLabel('Item 1 quantity').fill('2');
  await page.getByLabel('Item 1 unit price').fill('875');
  await page.getByLabel('Not included').fill('Electrical work\nWall painting');
  if (lock) await page.getByRole('button', { name: 'Lock & prepare to share' }).click();
  else await page.getByRole('button', { name: 'Save draft' }).click();
}

async function createOpenDraft(page: Page, number: number): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await page.getByLabel('Project / job title').fill(`Open draft ${number}`);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.getByRole('link', { name: 'ScopeStamp' }).click();
}

async function sharedUrl(page: Page): Promise<string> {
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#review=');
  return page.evaluate(() => navigator.clipboard.readText());
}

async function serviceWorkerReady(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller && registration.active) {
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 2000);
        navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
  });
}

test('one-click sample is isolated and resettable @claim:demo-sandbox', async ({ page }) => {
  await clearProductState(page);
  await startQuote(page, 'Real workshop repair', false);
  await page.getByRole('link', { name: 'ScopeStamp' }).click();
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved to your records')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await createOpenDraft(page, 1);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Open draft 1')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'Real workshop repair' })).toBeVisible();
  await expect(page.getByText('Oak studio shelving')).toHaveCount(0);
});

test('quote locks scope, exclusions, prices, total, and fingerprint @claim:quote-packet', async ({ page, context }) => {
  await clearProductState(page);
  await startQuote(page, 'Workshop wall storage');
  await expect(page.getByText('Awaiting decision').first()).toBeVisible();
  await expect(page.getByText('Build and fit two oak shelving bays along the north wall.')).toBeVisible();
  await expect(page.getByText('Electrical work')).toBeVisible();
  await expect(page.getByText('$1,750.00').first()).toBeVisible();
  await expect(page.getByText(/SHA-256 [a-f0-9]{64}/)).toBeVisible();
  await page.getByRole('button', { name: 'Copy / share link' }).click();
  const url = await sharedUrl(page);
  expect(url).toContain('#review=');
  const client = await context.newPage();
  await client.goto(url);
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
});

test('accept and decline create named timestamped receipts @claim:decision-receipts', async ({ page, context }) => {
  await clearProductState(page);
  for (const [index, decision] of ['Accept quote', 'Decline quote'].entries()) {
    if (index) await page.getByRole('link', { name: 'ScopeStamp' }).click();
    await startQuote(page, `Decision test ${index + 1}`);
    await page.getByRole('button', { name: 'Copy / share link' }).click();
    const url = await sharedUrl(page);
    const client = await context.newPage();
    await client.goto(url);
    await client.getByLabel('Your full name').fill('Maya Chen');
    await client.getByRole('checkbox').check();
    await client.getByRole('button', { name: decision }).click();
    const download = client.waitForEvent('download');
    await client.getByRole('button', { name: 'Download receipt' }).click();
    const receiptDownload = await download;
    const receiptPath = await receiptDownload.path();
    expect(receiptPath).toBeTruthy();
    const value = JSON.parse(await readFile(receiptPath!, 'utf8'));
    expect(value.actorName).toBe('Maya Chen');
    expect(value.decision).toBe(index ? 'declined' : 'accepted');
    expect(value.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(value.timezone).toBeTruthy();
    await client.close();
  }
});

test('a scoped change decision joins the quote ledger @claim:change-history', async ({ page, context }) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await page.getByRole('button', { name: 'Share change link' }).click();
  const client = await context.newPage();
  await client.goto(await sharedUrl(page));
  await client.getByLabel('Your full name').fill('Maya Chen');
  await client.getByRole('checkbox').check();
  await client.getByRole('button', { name: 'Accept change' }).click();
  const download = client.waitForEvent('download');
  await client.getByRole('button', { name: 'Download receipt' }).click();
  await page.getByRole('button', { name: 'Import receipt' }).click();
  const receiptDownload = await download;
  const receiptPath = await receiptDownload.path();
  await page.locator('input[type=file]').setInputFiles(receiptPath!);
  await expect(page.getByText('✓ Accepted').last()).toBeVisible();
  await page.getByText(/Record details · 4 ledger entries/).click();
  await expect(page.getByText('change accepted')).toBeVisible();
});

test('the demo reloads offline after the first visit @claim:owner-offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo');
  await serviceWorkerReady(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Demo — sample data, nothing is saved to your records')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await context.close();
});

test('a warmed shared packet reloads offline @claim:client-offline', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const owner = await context.newPage();
  await owner.goto('http://127.0.0.1:4173/demo');
  await owner.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await owner.getByRole('button', { name: 'Share change link' }).click();
  const client = await context.newPage();
  await client.goto(await sharedUrl(owner));
  await serviceWorkerReady(client);
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
  await context.setOffline(true);
  await client.reload();
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
  await context.close();
});

test('records persist locally without an account @claim:local-storage', async ({ page }) => {
  await clearProductState(page);
  await startQuote(page, 'Persisted local quote', false);
  await expect(page.getByText('Draft saved on this device.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Persisted local quote' })).toBeVisible();
  expect(await page.locator('input[type=password]').count()).toBe(0);
  expect(await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))).toContain('scopestamp-local');
});

test('shared content stays in a URL fragment @claim:fragment-sharing', async ({ page, context }) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await page.getByRole('button', { name: 'Share change link' }).click();
  const shared = await sharedUrl(page);
  expect(new URL(shared).hash).toMatch(/^#review=.+/);
  const requests: string[] = [];
  const client = await context.newPage();
  client.on('request', request => requests.push(request.url()));
  await client.goto(shared);
  await expect(client.getByText('Fingerprint verified')).toBeVisible();
  expect(requests.every(url => !url.includes('#review='))).toBe(true);
});

test('the unlicensed demo makes no third-party requests @claim:no-tracking', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await page.getByText(/Record details/).click();
  expect([...new Set(requests.map(url => new URL(url).origin))]).toEqual(['http://127.0.0.1:4173']);
});

test('a packet produces a printable PDF view @claim:print-pdf', async ({ page }, testInfo) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Print / PDF' })).toBeHidden();
  const pdf = await page.pdf({ path: testInfo.outputPath('accepted-packet.pdf'), format: 'A4' });
  expect(pdf.byteLength).toBeGreaterThan(20_000);
});

test('an exported archive imports into clean real storage @claim:archive-roundtrip', async ({ page }) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive' }).click();
  const archive = await download;
  await Promise.all([page.waitForURL('http://127.0.0.1:4173/'), page.getByRole('button', { name: 'Start for real' }).click()]);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: 'Import a record' }).click();
  const archivePath = await archive.path();
  await page.locator('input[type=file]').setInputFiles(archivePath!);
  await expect(page.getByRole('heading', { name: 'Oak studio shelving' })).toBeVisible();
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await expect(page.getByText('$1,750.00').first()).toBeVisible();
});

test('changed links and archive ledgers are rejected @claim:tamper-detection', async ({ page }, testInfo) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  await page.getByRole('button', { name: 'Share change link' }).click();
  const shared = await sharedUrl(page);
  const changed = `${shared.slice(0, -1)}${shared.endsWith('A') ? 'B' : 'A'}`;
  await page.goto(changed);
  await expect(page.getByRole('heading', { name: 'This record can’t be opened' })).toBeVisible();
  await expect(page.getByText('The shared link is incomplete or has changed.')).toBeVisible();

  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive' }).click();
  const source = await (await download).path();
  expect(source).toBeTruthy();
  const archive = JSON.parse(await readFile(source!, 'utf8'));
  archive.quote.events[0].actor = 'Changed actor';
  const changedPath = testInfo.outputPath('changed-archive.json');
  await writeFile(changedPath, JSON.stringify(archive));
  await Promise.all([page.waitForURL('http://127.0.0.1:4173/'), page.getByRole('button', { name: 'Start for real' }).click()]);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: 'Import a record' }).click();
  await page.locator('input[type=file]').setInputFiles(changedPath);
  await expect(page.getByText('Archive ledger verification failed at entry 1.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Record a quote and client decision' })).toBeVisible();
});

test('the free version allows three open packets and blocks the fourth @claim:free-open-limit', async ({ page }) => {
  await clearProductState(page);
  for (let index = 1; index <= 3; index++) await createOpenDraft(page, index);
  await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock the Field kit' })).toBeVisible();
  await expect(page.getByText('Open draft 3')).toBeVisible();
});

test('accepted and declined records do not count toward the open limit @claim:completed-not-counted', async ({ page, context }) => {
  await clearProductState(page);
  await page.goto('/demo');
  await expect(page.getByText('1 packet · 1 accepted')).toBeVisible();
  for (let index = 1; index <= 3; index++) await createOpenDraft(page, index);
  await expect(page.getByText('4 packets · 1 accepted')).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock the Field kit' })).toBeVisible();

  await clearProductState(page);
  await startQuote(page, 'Declined workshop refit');
  await page.getByRole('button', { name: 'Copy / share link' }).click();
  const client = await context.newPage();
  await client.goto(await sharedUrl(page));
  await client.getByLabel('Your full name').fill('Maya Chen');
  await client.getByRole('checkbox').check();
  await client.getByRole('button', { name: 'Decline quote' }).click();
  const download = client.waitForEvent('download');
  await client.getByRole('button', { name: 'Download receipt' }).click();
  const receiptPath = await (await download).path();
  expect(receiptPath).toBeTruthy();
  await page.getByRole('button', { name: 'Import client receipt' }).click();
  await page.locator('input[type=file]').setInputFiles(receiptPath!);
  await expect(page.getByText('Declined').first()).toBeVisible();
  await client.close();

  for (let index = 1; index <= 3; index++) await createOpenDraft(page, index);
  await expect(page.getByRole('link', { name: 'Declined workshop refit', exact: true })).toBeVisible();
  for (let index = 1; index <= 3; index++) {
    await expect(page.getByRole('link', { name: `Open draft ${index}`, exact: true })).toBeVisible();
  }
  await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock the Field kit' })).toBeVisible();
});

test('a verified $39 Field kit license removes the open limit @claim:paid-field-kit', async ({ page }) => {
  await clearProductState(page);
  for (let index = 1; index <= 3; index++) await createOpenDraft(page, index);
  let verificationUrl = '';
  await page.route('https://api.sociobot.in/api/v1/products/quote-acceptance-packet/verify**', async route => {
    verificationUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.getByRole('button', { name: 'View the Field kit' }).first().click();
  await expect(page.getByRole('link', { name: 'Buy once for $39' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/quote-acceptance-packet/checkout');
  await expect(page.getByText(/Sociobot\/Dodo, the merchant of record/)).toBeVisible();
  await page.getByLabel('License token').fill('fixture_valid_license');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('Field kit unlocked on this device.')).toBeVisible();
  expect(verificationUrl).toContain('license=fixture_valid_license');
  await page.getByRole('banner').getByRole('button', { name: 'New quote' }).click();
  await expect(page.getByRole('heading', { name: 'New quote' })).toBeVisible();
});

test('export and accessible controls work without a license @claim:ungated-export-accessibility', async ({ page }) => {
  await clearProductState(page);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Oak studio shelving', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive' }).click();
  expect((await download).suggestedFilename()).toContain('scopestamp-archive.json');
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});

test('license checks send only the token and revoked licenses stay locked @claim:license-privacy-revocation', async ({ page }) => {
  await clearProductState(page);
  const requests: Array<{ method: string; url: string; body: string | null }> = [];
  await page.route('https://api.sociobot.in/api/v1/products/quote-acceptance-packet/verify**', async route => {
    const request = route.request();
    requests.push({ method: request.method(), url: request.url(), body: request.postData() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'revoked' }) });
  });
  await page.getByRole('button', { name: 'View the Field kit' }).first().click();
  await expect(page.locator('input')).toHaveCount(1);
  await page.getByLabel('License token').fill('revoked_fixture');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('That license is not active. Check the token and try again.')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe('GET');
  expect(new URL(requests[0].url).searchParams.get('license')).toBe('revoked_fixture');
  expect(requests[0].body).toBeNull();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'License inactive' })).toBeVisible();
});

test('a user can delete a quote from local storage @claim:delete-record', async ({ page }) => {
  await clearProductState(page);
  await startQuote(page, 'Quote to remove');
  await page.getByRole('button', { name: 'Delete record' }).click();
  await expect(page.getByRole('heading', { name: 'Delete “Quote to remove”?' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete record' }).last().click();
  await expect(page.getByRole('heading', { name: 'Record a quote and client decision' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Quote to remove')).toHaveCount(0);
});
