// @ts-check
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import puppeteer from 'puppeteer';
import { sharedUiCandidate } from './shared-ui-candidate.mjs';

const RESOURCE_LINKS = [
  ['GitHub', 'https://github.com/tyemirov/ctx'],
  ['Docs', 'https://github.com/tyemirov/ctx#readme'],
  ['Changelog', 'https://github.com/tyemirov/ctx/blob/master/CHANGELOG.md'],
  ['Community', 'https://mprlab.com'],
];
const TRIGGER = 'mpr-footer [data-mpr-dropdown="trigger"]';
let browser;
let server;
let origin;
let assets;
before(async () => {
  assets = await sharedUiCandidate();
  const html = await readFile(new URL('../docs/index.html', import.meta.url));
  server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
for (const width of [390, 1280]) {
  test(`I001: real documentation footer at ${width}px`, { timeout: 20000 }, async () => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    try {
      await page.setViewport({ width, height: 900 });
      page.setDefaultTimeout(3000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const sharedRequests = [];
      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        const name = url.pathname.split('/').at(-1);
        if (url.hostname === 'cdn.jsdelivr.net' && assets.has(name)) {
          sharedRequests.push(url.href);
          await request.respond({ status: 200, contentType: name.endsWith('.css') ? 'text/css' : 'application/javascript', body: assets.get(name) });
        } else if (url.origin === origin) await request.continue();
        else await request.respond({ status: 200, contentType: 'application/javascript', body: '' });
      });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(TRIGGER, { visible: true });
      assert.equal(await page.$eval(`${TRIGGER} span:first-child`, node => node.textContent.trim()), 'Resources');
      await page.focus(TRIGGER);
      await page.keyboard.press('Enter');
      await page.waitForFunction(selector => document.querySelector(selector).getAttribute('aria-expanded') === 'true', {}, TRIGGER);
      const links = await page.$$eval('mpr-footer [data-mpr-dropdown="panel"] a', nodes => nodes.map(node => [node.textContent.trim(), node.getAttribute('href')]));
      assert.deepEqual(links, RESOURCE_LINKS);
      const bounds = await page.$eval('mpr-footer [data-mpr-dropdown="panel"]', node => node.getBoundingClientRect().toJSON());
      assert.ok(bounds.left >= 0 && bounds.right <= width);
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval(TRIGGER, node => node === document.activeElement && node.getAttribute('aria-expanded') === 'false'), true);
      const privacy = 'mpr-footer [data-mpr-footer="privacy-link"]';
      await page.click(privacy);
      await page.waitForSelector('[role="dialog"]', { visible: true });
      assert.match(await page.$eval('[data-mpr-footer="privacy-modal-content"]', node => node.textContent), /MIT License — ctx/);
      await page.keyboard.press('Escape');
      assert.equal((await page.$$('[data-mpr-theme-toggle="control"]')).length, 0);
      assert.equal(await page.$eval('mpr-footer [data-mpr-footer="prefix"]', node => node.textContent.trim()), 'ctx — context for humans and agents.');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector(TRIGGER, { visible: true });
      assert.ok(sharedRequests.length >= 2);
      assert.ok(sharedRequests.every(url => url.includes('/mpr-ui@latest/')));
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
}
