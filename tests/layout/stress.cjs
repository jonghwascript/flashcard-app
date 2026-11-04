const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { preview, launch } = require('./helpers.cjs');

(async () => {
  const site = await preview('stress'); let browser;
  const results = [];
  try {
    browser = await launch();
    const page = await browser.newPage({ viewport: { width: 375, height: 700 }, reducedMotion: 'reduce' });
    await page.goto(site.url); await page.locator('[data-js="stat-total"]').filter({hasText:'40'}).waitFor();
    await page.locator('.c-view-toggle [data-view="all"]').click();
    for (const width of [320,667]) for (const root of [16,32]) {
      await page.setViewportSize({width,height:375}); await page.evaluate(root=>document.documentElement.style.fontSize=root+'px',root);
      const toggle=page.locator('[data-action="toggle-card-menu"]').first();
      await toggle.click(); await page.locator('[data-action="edit-card"]').first().click();
      const edit=await page.locator('#edit-dialog').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),scroll:e.firstElementChild.scrollHeight,height:e.firstElementChild.clientHeight,width:e.firstElementChild.clientWidth,scrollWidth:e.firstElementChild.scrollWidth,bodyOverflow:getComputedStyle(document.body).overflow}));
      assert.ok(edit.rect.x>=0 && edit.rect.right<=width+1); assert.equal(edit.bodyOverflow,'hidden'); assert.ok(edit.scroll>=edit.height); assert.ok(edit.scrollWidth<=edit.width+1);
      await page.keyboard.press('Escape'); await page.waitForTimeout(80); assert.equal(await toggle.evaluate(e=>e===document.activeElement),true);
      await toggle.click(); await page.locator('[data-action="delete-card"]').first().click();
      const outside=await page.locator('#delete-dialog button').evaluateAll(els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()})));
      assert.deepEqual(outside,[],'Delete dialog buttons extend outside viewport');
      await page.locator('#delete-dialog [data-action="close-dialog"]').press('Enter');
      results.push({width,root,edit,deleteButtons:'inside viewport'});
    }
    await page.setViewportSize({width:320,height:800});
    await page.evaluate(()=>document.documentElement.style.fontSize='32px');
    for(const [name,value]of Object.entries({question:'Q'.repeat(300),answer:'A'.repeat(500),category:'Category'.repeat(15)}))await page.locator(`[data-form="create"] [name="${name}"]`).fill(value);
    await page.locator('[data-form="create"] [type="submit"]').click();
    await page.locator('[data-js="toast-message"]').evaluate(e=>e.textContent='LongMessage'.repeat(40));
    const toast=await page.locator('[data-js="toast"]').boundingBox();assert.ok(toast.x>=0&&toast.x+toast.width<=321);assert.ok(toast.y>=0&&toast.y+toast.height<=801);
    await page.locator('[data-action="dismiss-toast"]').press('Space');
    for(const view of ['study','all']){await page.locator(`.c-view-toggle [data-view="${view}"]`).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);}
    const category=page.locator('[data-scope="all"] [data-action="toggle-categories"]');await category.click();await page.locator('h1').click();assert.equal(await category.getAttribute('aria-expanded'),'false');
    const menu=page.locator('[data-action="toggle-card-menu"]').first();await menu.click();await page.locator('h1').click();assert.equal(await menu.getAttribute('aria-expanded'),'false');
    await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
    assert.equal(await page.locator('.c-flashcard__face').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    fs.writeFileSync(path.join(site.root,'stress.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({status:'PASS',root:site.root,cases:results.length,longContentRoot32:true}));
  }finally{if(browser)await browser.close();await site.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
