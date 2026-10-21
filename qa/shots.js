#!/usr/bin/env node
// QA: скриншоты ключевых экранов на 3 вьюпортах + автопроверки.
// Любая JS-ошибка на странице, наезд тач-кнопок или неверный layout — фейл CI.
'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8099';
const OUT = __dirname + '/shots';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720, mobile: false },
  { name: 'phone-portrait', width: 390, height: 700, mobile: true },
  { name: 'phone-landscape', width: 740, height: 420, mobile: true },
];
const SCENES = ['menu', 'game', 'wave', 'interstitial', 'pause'];

let failures = 0;
const fail = msg => { console.log('  ✗ ' + msg); failures++; };
const ok = msg => console.log('  ✓ ' + msg);

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  for (const vp of VIEWPORTS) {
    console.log('\n[' + vp.name + ' ' + vp.width + 'x' + vp.height + ']');
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e).slice(0, 120)));

    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: OUT + '/' + vp.name + '-menu.png' });

    // старт соло-игры
    await page.evaluate(() => { document.getElementById('mStart').click(); });
    await new Promise(r => setTimeout(r, 1800));
    const gameState = await page.evaluate(() => window.G ? G.state : 'no-G');
    if (gameState !== 'playing') fail('после старта state=' + gameState + ' (ожидался playing)');
    else ok('игра запустилась');
    await page.screenshot({ path: OUT + '/' + vp.name + '-game.png' });

    // живая волна
    await page.evaluate(() => {
      G.waveState = 'active'; G.wave = 2; startWave();
      const p = G.players[0]; p.inv = 999; p.burnout = 5;
    });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: OUT + '/' + vp.name + '-wave.png' });

    // layout тач-кнопок (только с touch)
    if (vp.mobile) {
      const overlap = await page.evaluate(() => {
        enableTouch();
        const btns = [...document.querySelectorAll('.tbtn')]
          .filter(b => !b.classList.contains('hidden'))
          .map(b => ({ id: b.id, r: b.getBoundingClientRect() }));
        for (let i = 0; i < btns.length; i++)
          for (let j = i + 1; j < btns.length; j++) {
            const a = btns[i].r, b = btns[j].r;
            const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            if (x > 6 && y > 6) return btns[i].id + ' × ' + btns[j].id;
          }
        return null;
      });
      if (overlap) fail('кнопки пересекаются: ' + overlap);
      else ok('тач-кнопки не пересекаются');
      const inside = await page.evaluate(() => {
        const r = document.getElementById('burnout').getBoundingClientRect();
        const out = [];
        for (const b of document.querySelectorAll('.tbtn')) {
          if (b.classList.contains('hidden')) continue;
          const t = b.getBoundingClientRect();
          if (t.top < r.top || t.bottom > r.bottom || t.left < r.left || t.right > r.right)
            out.push(b.id + ' вылезает за экран');
        }
        return out;
      });
      if (inside.length) fail(inside.join(', '));
      else ok('все тач-кнопки внутри экрана');
    }

    // интерстишл
    await page.evaluate(() => {
      G.mobs.length = 0; G.spawnQ.length = 0; G.boss = null;
      G.interStats = { w: 2, ki: 9, kd: 3, okr: 4, co: 120 };
      G.nextTheme = 'Ретро-архив';
    });
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: OUT + '/' + vp.name + '-interstitial.png' });
    const btnRect = await page.evaluate(() => window.__nextBtnRect ? 1 : 0);
    if (!btnRect) fail('хит-зона кнопки следующего спринта не создана');
    else ok('кнопка следующего спринта отрисована');

    // пауза
    await page.evaluate(() => { G.waveState = 'calm'; G.waveT = 9; togglePause(); });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: OUT + '/' + vp.name + '-pause.png' });
    const paused = await page.evaluate(() => G.state);
    if (paused !== 'paused') fail('пауза не открылась: ' + paused);
    else ok('пауза работает');

    if (pageErrors.length) fail('JS-ошибки: ' + pageErrors.slice(0, 3).join(' | '));
    else ok('JS-ошибок нет');
    await page.close();
  }

  await browser.close();
  const total = VIEWPORTS.length * SCENES.length;
  console.log('\nскриншотов: ' + total + ' → ' + OUT);
  if (failures) { console.log('QA: ✗ ' + failures + ' проблем'); process.exit(1); }
  console.log('QA: ✓ всё чисто');
})().catch(e => { console.error('QA упал:', e); process.exit(1); });
