'use strict';
const { load } = require('./stub');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓', name); passed++; }
  catch (e) { console.error('  ✗', name, '\n    ', e.message); failed++; }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }

// ---------- utils ----------
load('src/utils.js');
console.log('utils:');
test('clamp', () => { eq(clamp(5, 0, 3), 3); eq(clamp(-1, 0, 3), 0); eq(clamp(2, 0, 3), 2); });
test('dist/angTo', () => {
  eq(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  eq(Math.round(angTo({ x: 0, y: 0 }, { x: 1, y: 0 })), 0);
});
test('angDiff зацикливание', () => {
  eq(Math.abs(angDiff(Math.PI * 1.9, -Math.PI * 1.9)) < 0.7, true);
});
test('LCG rnd детерминирован', () => {
  _seed = 42; const a = rnd(); _seed = 42; const b = rnd();
  eq(a, b);
});
test('genCode: 5 символов из алфавита', () => {
  const c = genCode();
  eq(c.length, 5);
  ok(/^[a-z0-9]+$/.test(c));
});

// ---------- data ----------
load('src/data.js');
console.log('data:');
test('CLS: 4 класса × 4 приёма с именами и кулдаунами', () => {
  const need = ['mgr', 'dev', 'mkt', 'dsn'];
  eq(Object.keys(CLS).length, 4);
  for (const c of need)
    for (const s of ['s1', 's2', 'ult', 'sk'])
      ok(CLS[c][s].n && CLS[c][s].cd > 0, c + '.' + s);
});
test('COMBONAMES покрывает все уровни комбо', () => {
  eq(COMBONAMES.length, 10); // индексы 0..9
  ok(COMBONAMES[9].length > 3);
});
test('PROG: 8 тактов гармонии с войсингами', () => {
  eq(PROG.length, 8);
  for (const ch of PROG) { eq(ch[1].length, 4); }
});
test('MEL: ноты в разумном диапазоне midi', () => {
  for (const n of MEL) { ok(n[2] >= 55 && n[2] <= 100, 'midi ' + n[2]); ok(n[3] > 0); }
});
test('MOBNAMES непустые', () => {
  ok(MOBNAMES.intern.length >= 4);
  ok(MOBNAMES.deadline.length >= 3);
});

// ---------- map ----------
load('src/map.js');
console.log('map:');
test('buildMap детерминирован по сиду', () => {
  buildMap(12345);
  const r1 = JSON.stringify(ROOMS) + JSON.stringify(WALLS.map(w => [w.x, w.y, w.w, w.h, w.dir]));
  buildMap(12345);
  const r2 = JSON.stringify(ROOMS) + JSON.stringify(WALLS.map(w => [w.x, w.y, w.w, w.h, w.dir]));
  eq(r1, r2);
});
test('карта квадратная', () => {
  eq(GW, GH);
  eq(MAP_W, MAP_H);
});
test('кофе-машины: не больше двух на карту', () => {
  for (let s = 1; s <= 30; s++) {
    buildMap(s * 7919);
    ok(COFFEES.length >= 1 && COFFEES.length <= 2, 'coffee=' + COFFEES.length);
  }
});
test('связность: 0 изолированных комнат на 300 сидах', () => {
  let bad = 0;
  for (let s = 1; s <= 300; s++) {
    buildMap(s * 7919 + 13);
    bad += unreachableRooms().length;
  }
  eq(bad, 0);
});
test('мебель без наложений на 100 сидах', () => {
  let overlaps = 0;
  for (let s = 1; s <= 100; s++) {
    buildMap(s * 104729);
    for (let a = 0; a < FURN.length; a++)
      for (let b = a + 1; b < FURN.length; b++) {
        const A = FURN[a], B = FURN[b];
        if (A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y) overlaps++;
      }
  }
  eq(overlaps, 0);
});
test('мебель внутри своих комнат', () => {
  for (let s = 1; s <= 50; s++) {
    buildMap(s * 31);
    for (const f of FURN) {
      const inRoom = ROOMS.some(r => f.x >= r.x && f.y >= r.y && f.x + f.w <= r.x + r.w && f.y + f.h <= r.y + r.h);
      ok(inRoom, f.t + ' вне комнаты');
    }
  }
});
test('стены тонкие: полосы 26px', () => {
  buildMap(7);
  ok(WALLS.length > 50);
  for (const w of WALLS) ok(w.w === 26 || w.h === 26, 'толщина ' + w.w + 'x' + w.h);
});
test('стены не перекрывают пол', () => {
  buildMap(7);
  for (const w of WALLS) {
    const ti = Math.floor((w.x + (w.w > w.h ? 13 : w.w / 2)) / TILE);
    const tj = Math.floor((w.y + (w.h > w.w ? 13 : w.h / 2)) / TILE);
    eq(grid[tj][ti], 0, 'пол под стеной');
  }
});
test('спавн-точки на открытом полу', () => {
  for (let s = 1; s <= 40; s++) {
    buildMap(s * 13);
    ok(SPAWNS.length >= 3);
    for (const sp of SPAWNS) ok(!blockedAt(sp.x, sp.y, 16), 'спавн в стене');
  }
});


// ---------- v-new: локации/темы/твиты/тайминги/дроп ----------
load('src/data.js');
console.log('locations & style:');
test('карта компактнее: 30x30', () => { eq(GW, 30); eq(GH, 30); });
test('THEMES: 5 непохожих стилей', () => {
  eq(THEMES.length, 5);
  const names = new Set(THEMES.map(t => t.name));
  eq(names.size, 5);
  for (const th of THEMES) ok(th.floor && th.neonA && th.steel, 'поля темы');
});
test('темы ротируются по сидам (>=4 разных на 15 сидов)', () => {
  const seen = new Set();
  for (let s = 1; s <= 15; s++) { buildMap(s * 31337); seen.add(MAPTHEME.name); }
  ok(seen.size >= 4, 'тем: ' + seen.size);
});
test('открытость: коридоров < 50% пола (20 сидов)', () => {
  for (let s = 1; s <= 20; s++) {
    buildMap(s * 777);
    let floor = 0, corr = 0;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      if (grid[j][i] === 1) { floor++; if (!ROOMS.some(r => i >= r.tx && i < r.tx + r.tw && j >= r.ty && j < r.ty + r.th)) corr++; }
    }
    ok(corr / floor < 0.5, 'коридоров ' + Math.round(100 * corr / floor) + '%');
  }
});
test('маркетолог кидает твиты, не самолётики', () => {
  eq(CLS.mkt.s1.n, 'твит');
});
test('карточка меню: твит в описании', () => {
  const ih = require('fs').readFileSync('index.html', 'utf8');
  ok(ih.includes('ЛКМ</b> твит'), 'в карточке');
  ok(ih.includes('mdl-mkt'), 'моделька на месте');
});

console.log('source invariants:');
const fs2 = require('fs');
test('папок при уроне: 2 (было 8)', () => {
  ok(fs2.readFileSync('src/chaos.js', 'utf8').includes('spawnFolders(x,y,2)'), 'константа');
});
test('дроб кофе с мобов: 10% (было 30%)', () => {
  ok(fs2.readFileSync('src/combat.js', 'utf8').includes("if(R()<0.10)dropPickup(m.x,m.y,'coffee')"), 'кофе 0.10');
});
test('тайминги надписей: 2.4с жизни', () => {
  ok(fs2.readFileSync('src/combat.js', 'utf8').includes('life:2.4,vy:-15'), 'life 2.4');
});
test('души: настроение agony|relief', () => {
  const src = fs2.readFileSync('src/combat.js', 'utf8');
  ok(src.includes("mood:agony?'agony':'relief'"), 'mood в драме');
  ok(fs2.readFileSync('src/chaos.js', 'utf8').includes("agony=d.mood==='agony'"), 'mood в отрисовке');
});
test('классовые звуки определены', () => {
  const au = fs2.readFileSync('src/audio.js', 'utf8');
  for (const s of ['stapler', 'thudFlesh', 'tweet', 'vacuum', 'scrch', 'bell', 'soulAgony'])
    ok(au.includes(s + ':function'), s);
});
test('ротация локаций: regenLocation существует и чистит', () => {
  const sm = fs2.readFileSync('src/sim.js', 'utf8');
  ok(sm.includes('function regenLocation'), 'функция');
  ok(sm.includes("NET.events.push({k:'map',seed:seed})"), 'событие гостю');
});
test('подбор кружек: радиус 22 и событие pkup', () => {
  const sm = fs2.readFileSync('src/sim.js', 'utf8');
  ok(sm.includes('pk.y-me.y)<22'), 'радиус');
  ok(sm.includes("NET.events.push({k:'pkup"), 'событие');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
