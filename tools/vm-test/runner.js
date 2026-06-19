// ============================================================
// Relic Caravan — VM 視覺測試工具 (headless render + 自動操作 + 截圖)
//
// 用途：在無頭 Chromium 中載入遊戲、依腳本自動點擊、截圖回來檢視。
// 因為遊戲用 CDN 載入 Phaser，而沙盒網路擋掉 CDN，這裡用「請求攔截」
// 把本機 npm 安裝的同版 phaser.min.js 餵進去（不需修改遊戲檔案）。
//
// 用法：
//   node runner.js <gameRoot> <steps.json> [logFile]
//   例：node runner.js ../../ steps.json runner.log
//
// 相依套件（安裝在執行目錄，通常是 outputs 暫存區）：
//   npm install @sparticuz/chromium@123 puppeteer-core@22 phaser@3.80.1
//
// steps.json 範例（依序執行）：
//   [ {"wait":1500},
//     {"click":[503,616]},           // 在 1000x660 視窗座標點擊
//     {"key":"Enter"},
//     {"shot":"01.png"} ]
// ============================================================
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const GAME_ROOT = path.resolve(process.argv[2] || '.');
const STEPS_FILE = process.argv[3] || 'steps.json';
const LOG_FILE   = process.argv[4] || 'runner.log';
const GAME = 'file://' + path.join(GAME_ROOT, 'index.html');

// 找出本機已安裝的 phaser.min.js（在幾個常見位置找）
function findPhaser() {
  const cands = [
    path.resolve('node_modules/phaser/dist/phaser.min.js'),
    path.resolve(__dirname, 'node_modules/phaser/dist/phaser.min.js'),
  ];
  for (const p of cands) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  throw new Error('找不到 phaser.min.js，請先 `npm install phaser@3.80.1`');
}
const PHASER = findPhaser();
const log = (m) => { fs.appendFileSync(LOG_FILE, m + '\n'); console.log(m); };

(async () => {
  fs.writeFileSync(LOG_FILE, '');
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--allow-file-access-from-files'],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 660, deviceScaleFactor: 1 });

  // 攔截 phaser CDN 請求，改用本機檔案
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().includes('phaser')) {
      req.respond({ status: 200, contentType: 'application/javascript', body: PHASER });
    } else req.continue();
  });
  page.on('console',  m => log('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => log('[pageerror] ' + e.message));

  await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 20000 })
            .catch(e => log('[goto] ' + e.message));
  await new Promise(r => setTimeout(r, 4000)); // 等 Phaser 啟動 + 開場場景

  // 注意：每次執行都是全新遊戲（從公會大廳開始），要到深層場景
  // 必須在同一份 steps.json 裡把前面所有點擊一起重放。
  const steps = JSON.parse(fs.readFileSync(STEPS_FILE, 'utf8'));
  for (const s of steps) {
    if (s.wait)  await new Promise(r => setTimeout(r, s.wait));
    if (s.click) { await page.mouse.click(s.click[0], s.click[1]); log('click ' + s.click); }
    if (s.key)   { await page.keyboard.press(s.key); log('key ' + s.key); }
    if (s.shot)  { await page.screenshot({ path: s.shot }); log('shot ' + s.shot); }
  }
  await browser.close();
  log('DONE');
})().catch(e => { fs.appendFileSync(LOG_FILE, 'FATAL ' + e.stack + '\n'); console.error(e); process.exit(1); });
