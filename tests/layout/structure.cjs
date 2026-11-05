const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sass = require('sass');
const postcss = require('postcss');
const { project, hashes, preview, launch } = require('./helpers.cjs');
const { renderHtml } = require('./render-html.cjs');

// 소스 문자열이나 주석 대신, 앱이 생성한 실제 요소의 classList를 검사한다.
async function renderedLayoutClasses() {
  const site = await preview('structure');
  let browser;
  try {
    browser = await launch();
    const page = await browser.newPage();
    // 외부 글꼴 연결 여부가 구조 검사 결과에 영향을 주지 않도록 한다.
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });
    await page.locator('.c-grid-card').first().waitFor({ state: 'attached' });
    assert.equal(await page.locator('[data-js="load-error"]').isVisible(), false, 'Preview data failed to load');
    assert.ok(await page.locator('.c-grid-card').count() > 0, 'Generated cards are missing');
    return new Set(await page.locator('[class]').evaluateAll(elements =>
      [...new Set(elements.flatMap(element => [...element.classList]))].filter(name => name.startsWith('l-')),
    ));
  } finally {
    if (browser) await browser.close();
    await site.close();
  }
}

async function main() {
  const html = await renderHtml();
  const css = sass.compile(path.join(project, 'src/scss/style.scss')).css;
  const tree = postcss.parse(css);
  const layoutSelectors = new Set();
  tree.walkRules(rule => { for (const match of rule.selector.matchAll(/\.((?:l-)[\w-]+)/g)) layoutSelectors.add(match[1]); });
  const used = await renderedLayoutClasses();
  assert.deepEqual([...used].filter(name => !layoutSelectors.has(name)), [], 'Markup uses missing layout classes');
  // 공통 레이아웃 패턴 파일이 없으므로 전체 출력의 l- 클래스는 모두 앱 전용이다.
  const appClasses = new Set([...css.matchAll(/\.(l-[\w-]+)/g)].map(match => match[1]));
  assert.deepEqual([...appClasses].filter(name => !used.has(name)), [], 'Unused app layout class');
  const migrated = new Set(['c-app', 'c-app-header', 'c-app-header__title', 'c-view-toggle', 'c-toolbar', 'c-toolbar__filters', 'c-study', 'c-study__content', 'c-study__card-area', 'c-study__actions', 'c-study__nav', 'c-stats', 'c-stats__list', 'c-card-grid', 'c-card-grid__item', 'c-dialog', 'c-category-filter', 'c-category-filter__panel', 'c-toast']);
  tree.walkRules(rule => {
    for (const name of migrated) {
      if (!rule.selector.split(',').some(s => s.trim() === '.' + name)) continue;
      rule.nodes.filter(node => node.type === 'decl').forEach(decl => {
        const forbidden = /^(margin.*|position|inset.*|z-index)$/;
        if (forbidden.test(decl.prop)) assert.fail(`${rule.selector} still owns ${decl.prop}`);
      });
    }
  });
  assert.ok(!/style="/.test(html), 'Application added inline styles');
  if (process.env.LAYOUT_DIST_BASELINE) {
    const before = JSON.parse(fs.readFileSync(process.env.LAYOUT_DIST_BASELINE, 'utf8'));
    assert.deepEqual(hashes('dist'), before, 'dist changed since watcher was stopped');
  }
  console.log(JSON.stringify({ status: 'PASS', markupLayoutClasses: used.size, appLayoutClasses: appClasses.size }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
