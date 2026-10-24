// Une lecture IndexedDB qui échoue au démarrage ne doit pas effacer les données
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  let pg = await ctx.newPage();
  await pg.goto(URL);
  await pg.waitForSelector('#lk', { state: 'visible' });
  // données réelles : 3 ventes
  await pg.evaluate(async () => { S.set.setup = 1; S.rc = 'x'; S.users[0].pin = hs('1234'); for (let i = 0; i < 3; i++) S.s.push({ id: 'v' + i, t: Date.now(), no: i + 1, by: 1, items: [], sub: 1000, disc: 0, total: 1000, pay: [{ m: 'e', a: 1000 }] }); dirty = true; await flush(); });
  await pg.close();

  // démarrage où la lecture échoue une fois
  pg = await ctx.newPage();
  await pg.addInitScript(() => { const g = IDBObjectStore.prototype.get; let n = 0; IDBObjectStore.prototype.get = function (k) { if (k === 'S' && n++ === 0) throw new DOMException('lecture impossible', 'UnknownError'); return g.call(this, k) }; });
  await pg.goto(URL);
  await pg.waitForTimeout(1500);
  const during = await pg.evaluate(() => ({ ventes: S.s.length, produits: S.p.length, banniere: !!storErr }));
  await pg.close();

  // démarrage normal suivant
  pg = await ctx.newPage();
  await pg.goto(URL);
  await pg.waitForTimeout(1500);
  const after = await pg.evaluate(() => S.s.length);
  console.log('pendant la panne :', JSON.stringify(during));
  console.log('ventes au démarrage suivant :', after, after === 3 ? '→ données intactes' : '→ DONNÉES PERDUES');
  await b.close();
  process.exit(after === 3 ? 0 : 1);
})();
