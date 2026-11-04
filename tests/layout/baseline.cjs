const fs = require('node:fs');
const path = require('node:path');
const { preview, launch, hashes } = require('./helpers.cjs');

(async () => {
  const site = await preview('baseline');
  let browser;
  try {
    browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const result = { browser: browser.version(), src: hashes('src'), dist: hashes('dist'), screens: [] };
    async function capture(name) {
      await page.screenshot({ path: path.join(site.root, name + '.png'), fullPage: true });
      result.screens.push({ name, boxes: await page.evaluate(() => Object.fromEntries(['.c-app', '.c-app-header', '.l-study', '.c-study', '.c-stats', '.c-toolbar', '.c-flashcard', '.c-card-grid', '.c-grid-card', 'dialog[open]', '.c-toast'].map(s => [s, document.querySelector(s)?.getBoundingClientRect().toJSON()])) ) });
    }
    await page.goto(site.url); await page.locator('[data-js="card-counter"]').filter({ hasText: 'of 40' }).waitFor(); await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 767, 768, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const view of ['study', 'all']) { await page.locator(`.c-view-toggle__button[data-view="${view}"]`).click(); await capture(`${view}-${width}`); }
    }
    result.overflow = [];
    await page.setViewportSize({ width: 320, height: 900 });
    for (const root of [16, 32]) {
      await page.evaluate(root => document.documentElement.style.fontSize = root + 'px', root);
      for (const view of ['study', 'all']) { await page.locator(`.c-view-toggle__button[data-view="${view}"]`).click(); result.overflow.push({ root, view, width: await page.evaluate(() => document.documentElement.scrollWidth) }); }
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '16px'); await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-scope="all"] [data-action="toggle-categories"]').click(); await capture('category-open'); await page.keyboard.press('Escape');
    await page.locator('[data-action="toggle-card-menu"]').first().click(); await capture('menu-open');
    await page.locator('[data-action="edit-card"]').first().click(); await capture('edit-open'); await page.keyboard.press('Escape');
    await page.locator('[data-action="toggle-card-menu"]').first().click(); await page.locator('[data-action="delete-card"]').first().click(); await capture('delete-open');
    await page.locator('[data-action="confirm-delete"]').click(); await capture('toast-open');
    fs.writeFileSync(path.join(site.root, 'baseline.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ root: site.root, screenshots: result.screens.length, overflow: result.overflow }));
  } finally { if (browser) await browser.close(); await site.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
