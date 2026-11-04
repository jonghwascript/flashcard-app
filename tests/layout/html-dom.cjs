const fs = require('node:fs');
const assert = require('node:assert/strict');
const { launch } = require('./helpers.cjs');

// Include extraction must preserve the authored DOM independently of application startup.
async function snapshot(page, html) {
  await page.setContent(html);
  return page.evaluate(() => {
    function visit(node, preserveSpace = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = preserveSpace ? node.data : node.data.replace(/\s+/g, ' ').trim();
        return text ? { text } : null;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      const keep = preserveSpace || ['PRE', 'TEXTAREA', 'SCRIPT', 'STYLE'].includes(node.tagName);
      return {
        tag: node.tagName,
        attributes: Object.fromEntries([...node.attributes].sort((a,b) => a.name.localeCompare(b.name)).map(a => [a.name,a.value])),
        children: [...node.childNodes].map(child => visit(child,keep)).filter(Boolean),
      };
    }
    return { doctype: document.doctype?.name, html: visit(document.documentElement) };
  });
}

async function main() {
  const [mode, input, output] = process.argv.slice(2);
  const browser = await launch();
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    if (mode === '--capture') {
      fs.writeFileSync(output, JSON.stringify(await snapshot(page,fs.readFileSync(input,'utf8')),null,2));
    } else if (mode === '--compare') {
      const { renderHtml } = require('./render-html.cjs');
      assert.deepEqual(await snapshot(page,await renderHtml()), JSON.parse(fs.readFileSync(input,'utf8')));
      console.log('Authored DOM matches pre-split baseline');
    } else throw Error('Use --capture <html> <snapshot.json> or --compare <snapshot.json>');
  } finally { await browser.close(); }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { snapshot };
