const path = require('node:path');
const { Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const gulp = require('gulp');
const fileInclude = require('gulp-file-include');

async function renderHtml(entry = path.resolve(__dirname, '../../src/pages/index.html')) {
  const pages = [];
  await pipeline(
    gulp.src(path.resolve(entry), { allowEmpty: false }),
    fileInclude({ prefix: '@@', basepath: '@file' }),
    new Writable({
      objectMode: true,
      write(file, encoding, done) {
        pages.push(file.contents.toString('utf8'));
        done();
      },
    }),
  );
  if (pages.length !== 1) throw new Error(`Expected one HTML page, got ${pages.length}`);
  if (/@@include\s*\(/.test(pages[0])) throw new Error('Unresolved HTML include');
  return pages[0];
}

if (require.main === module) {
  renderHtml(process.argv[2]).then(html => process.stdout.write(html)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { renderHtml };
