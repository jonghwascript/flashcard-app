const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { renderHtml } = require('./render-html.cjs');

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'html-includes-'));
  fs.mkdirSync(path.join(root,'parts'));
  fs.writeFileSync(path.join(root,'index.html'), "<main>@@include('parts/outer.html')</main>");
  fs.writeFileSync(path.join(root,'parts/outer.html'), '<section>Outer</section>');
  assert.equal(await renderHtml(path.join(root,'index.html')), '<main><section>Outer</section></main>');
  fs.writeFileSync(path.join(root,'parts/outer.html'), "<section>@@include('inner.html')</section>");
  fs.writeFileSync(path.join(root,'parts/inner.html'), '<p>Nested relative include</p>');
  assert.equal(await renderHtml(path.join(root,'index.html')), '<main><section><p>Nested relative include</p></section></main>');
  fs.writeFileSync(path.join(root,'parts/outer.html'), "@@include('missing.html')");
  await assert.rejects(renderHtml(path.join(root,'index.html')), /missing\.html/);
  const child = spawnSync(process.execPath,[path.join(__dirname,'render-html.cjs'),path.join(root,'index.html')],{encoding:'utf8'});
  assert.equal(child.status,1);
  assert.match(child.stderr,/missing\.html/);
  console.log(JSON.stringify({status:'PASS',root,checks:['single include','nested relative include','missing file rejects','CLI failure exit']}));
})().catch(error => { console.error(error); process.exitCode = 1; });
