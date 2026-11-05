const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { preview, launch, hashes } = require('./helpers.cjs');

async function main() {
  const distBefore = hashes('dist');
  const site = await preview('regressions');
  let browser;
  try {
    browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const starterCards = JSON.parse(fs.readFileSync('src/data.json', 'utf8')).flashcards;
    const sample = { id: 'review-1', question: 'Review question', answer: 'Review answer', category: 'Review category', knownCount: 4 };
    const ready = () => page.waitForFunction(() => document.querySelector('.c-app').getAttribute('aria-busy') === 'false');

    // 느린 첫 로딩 도중에도 폼 제출이 저장 데이터를 바꾸지 않아야 한다.
    let release;
    const blocked = new Promise(resolve => { release = resolve; });
    let requested;
    const requestStarted = new Promise(resolve => { requested = resolve; });
    await page.route('**/data.json', async route => {
      requested();
      await blocked;
      await route.fulfill({ json: { flashcards: starterCards } });
    });
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded' });
      await requestStarted;
      assert.equal(await page.locator('.c-app').evaluate(element => element.inert), true);
      await page.evaluate(() => {
        const form = document.querySelector('[data-form="create"]');
        for (const name of ['question', 'answer', 'category']) form.elements[name].value = 'During loading';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      assert.equal(await page.evaluate(() => localStorage.getItem('flashcard-app:cards')), null);
    } finally {
      release();
    }
    await ready();
    assert.equal(await page.locator('.c-app').evaluate(element => element.inert), false);
    assert.equal(await page.locator('[data-js="stat-total"]').innerText(), '40');
    await page.unroute('**/data.json');

    const all = () => page.locator('.c-view-toggle__button[data-view="all"]').click();
    const create = async () => {
      await all();
      for (const name of ['question', 'answer', 'category']) await page.locator(`#create-${name}`).fill('After loading');
      await page.locator('[data-form="create"] button[type="submit"]').click();
    };
    await create();
    assert.equal(await page.locator('[data-js="stat-total"]').innerText(), '41');
    await page.reload();
    await ready();
    assert.equal(await page.locator('[data-js="stat-total"]').innerText(), '41');

    // 로딩 실패 뒤에는 잠금이 해제되어 새 카드를 만들 수 있어야 한다.
    await page.evaluate(() => localStorage.clear());
    await page.route('**/data.json', route => route.abort());
    await page.reload();
    await ready();
    assert.equal(await page.locator('[data-js="load-error"]').isVisible(), true);
    await create();
    assert.equal(await page.locator('[data-js="stat-total"]').innerText(), '1');
    await page.unroute('**/data.json');

    async function fresh(cards) {
      await page.evaluate(cards => localStorage.setItem('flashcard-app:cards', JSON.stringify({ version: 1, cards })), cards);
      await page.reload();
      await ready();
    }

    // 마지막 학습 카드가 숨겨져도 키보드 사용자는 필터 해제 지점에 남는다.
    await fresh([sample]);
    const hideMastered = page.locator('[data-scope="study"] [data-action="toggle-hide-mastered"]');
    await hideMastered.check();
    await page.locator('[data-action="know"]').press('Enter');
    assert.equal(await page.locator('[data-js="empty-caught-up"]').isVisible(), true);
    assert.equal(await hideMastered.evaluate(element => element === document.activeElement), true);
    await hideMastered.press('Space');
    assert.equal(await page.locator('[data-js="study-content"]').isVisible(), true);

    async function editOutOfFilter(cards, targetCategory, index = 0, hideMastered = false) {
      await fresh(cards);
      await all();
      await page.locator('[data-scope="all"] [data-action="toggle-categories"]').click();
      await page.locator('[data-scope="all"] [data-action="toggle-category"][value="Review category"]').check();
      await page.keyboard.press('Escape');
      if (hideMastered) await page.locator('[data-scope="all"] [data-action="toggle-hide-mastered"]').check();
      await page.locator('[data-action="toggle-card-menu"]').nth(index).click();
      await page.locator('[data-action="edit-card"]').nth(index).click();
      await page.locator('#edit-category').fill(targetCategory);
      await page.locator('#edit-dialog button[type="submit"]').press('Enter');
      // close 이벤트의 포커스 복원까지 기다린다. open 해제만으로는 처리가 끝난 것이 아니다.
      await page.waitForFunction(() => !document.querySelector('#edit-dialog').open && document.activeElement.matches(
        '#all-cards-view [data-action="toggle-card-menu"], #all-cards-view .c-empty-state:not([hidden]) h3',
      ));
    }

    // 수정 후 목록에서 빠진 카드 대신 다음 카드 또는 이전 카드로 돌아간다.
    await editOutOfFilter([sample, { ...sample, id: 'review-2', question: 'Second question' }], 'Other category');
    assert.equal(await page.locator('[data-card-id="review-2"][data-action="toggle-card-menu"]').evaluate(element => element === document.activeElement), true);
    await editOutOfFilter([sample, { ...sample, id: 'review-2', question: 'Second question' }], 'Other category', 1);
    assert.equal(await page.locator('[data-card-id="review-1"][data-action="toggle-card-menu"]').evaluate(element => element === document.activeElement), true);

    // 필터 결과가 비면 빈 상태 제목으로 이동한다.
    await editOutOfFilter([sample, { ...sample, id: 'review-2', question: 'Mastered question', knownCount: 5 }], 'Other category', 0, true);
    assert.equal(await page.locator('[data-js="all-empty-caught-up"] h3').evaluate(element => element === document.activeElement), true);

    // 수정 후에도 보이는 카드라면 기존 메뉴 버튼으로 돌아간다.
    await fresh([sample, { ...sample, id: 'review-2', question: 'Other question', category: 'Other category', knownCount: 5 }]);
    await all();
    await page.locator('[data-scope="all"] [data-action="toggle-hide-mastered"]').check();
    await page.locator('[data-action="toggle-card-menu"]').first().click();
    await page.locator('[data-action="edit-card"]').first().click();
    await page.locator('#edit-question').fill('Still visible');
    await page.locator('#edit-dialog button[type="submit"]').press('Enter');
    await page.waitForFunction(() => document.activeElement.matches('[data-card-id="review-1"][data-action="toggle-card-menu"]'));

    assert.deepEqual(errors, []);
    assert.deepEqual(hashes('dist'), distBefore, 'dist changed during regression checks');
    console.log(JSON.stringify({ status: 'PASS', browser: browser.version(), root: site.root, checks: ['loading blocks writes', 'create after loading persists', 'load failure unlocks app', 'last mastered card focus', 'edit filtered card next/previous focus', 'edit empty state focus', 'edit visible card focus', 'dist preserved'] }));
  } finally {
    if (browser) await browser.close();
    await site.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
