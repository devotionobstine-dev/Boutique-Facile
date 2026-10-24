// Vérifie les correctifs : lecture impossible, rapport de boutique piégé, CSV, remboursement plafonné
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
const OUT = process.argv[3] || '.';
const res = [];const ok = (n, c, d) => res.push((c ? 'OK   ' : 'ÉCHEC') + ' ' + n + (d ? ' — ' + d : ''));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  let pg = await ctx.newPage();
  await pg.goto(URL); await pg.waitForSelector('#lk', { state: 'visible' });
  await pg.evaluate(async () => { S.set.setup = 1; S.rc = 'x'; S.users[0].pin = hs('1234'); S.s.push({ id: 'v1', t: Date.now(), no: 1, by: 1, items: [{ id: 1, n: 'Riz', q: 1, pr: 280000, pr0: 280000, c: 250000, f: 1, u: '' }], sub: 280000, disc: 0, total: 280000, pay: [{ m: 'e', a: 280000 }] }); dirty = true; await flush(); });
  await pg.close();

  // 1) lecture impossible à chaque essai : écran d'erreur, aucune écriture
  pg = await ctx.newPage();
  await pg.addInitScript(() => { IDBObjectStore.prototype.get = function () { throw new DOMException('x', 'UnknownError') }; });
  await pg.goto(URL); await pg.waitForTimeout(1200);
  ok('Écran « données non lues » affiché', (await pg.textContent('#m')).includes('pas pu être lues'));
  await pg.screenshot({ path: OUT + '/erreur-lecture.png' });
  await pg.evaluate(async () => { S.s.push({ id: 'z' }); save(true); await flush(); });
  await pg.close();
  pg = await ctx.newPage(); await pg.goto(URL); await pg.waitForTimeout(1200);
  ok('Rien n\'a été écrit pendant la panne', await pg.evaluate(() => S.s.length === 1 && S.s[0].id === 'v1'));

  // 2) rapport de boutique avec un identifiant piégé : refusé
  await pg.fill('#pn', '1234'); await pg.click('#lo'); await pg.waitForTimeout(200);
  await pg.evaluate(() => go('p', 'shops'));
  const evil = { kind: 'bf-branch', v: 5, shop: { id: "x');window.PWNED=1;('", name: 'Pirate' }, t: Date.now(), from: 0, sv: 0, cr: 0, sd: 0, D: { s: [], rt: [], ex: [], adj: [], ag: [], pu: [], cl: [] } };
  const good = Object.assign({}, evil, { shop: { id: 'abc123xyz', name: 'Boutique Kaloum' } });
  await pg.setInputFiles('#app input[type=file]', [{ name: 'a.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(evil)) }, { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) }]);
  await pg.waitForTimeout(400);
  const br = await pg.evaluate(() => Object.keys(S.br));
  ok('Rapport piégé refusé, rapport normal accepté', br.length === 1 && br[0] === 'abc123xyz', JSON.stringify(br));
  await pg.evaluate(() => go('p', 'cons')); await pg.waitForTimeout(200);
  ok('Vue « toutes les boutiques » s\'affiche', (await pg.textContent('#app')).includes('Boutique Kaloum'));

  // 3) CSV : une formule devient du texte, les nombres négatifs restent des nombres
  const csv = await pg.evaluate(() => toCSV([['=HYPERLINK("x")', -5000, 'Riz', '@SUM(A1)']]));
  ok('CSV protégé contre les formules', csv.includes(`"'=HYPERLINK(""x"")"`) && csv.includes('"-5000"') && csv.includes(`"'@SUM(A1)"`), csv);

  // 4) remboursement plus grand que la vente : refusé
  await pg.evaluate(() => { retUI('v1'); });
  await pg.fill('#m .rq', '1'); await pg.fill('#ra', '900000');
  await pg.click('#m button:has-text("Valider le retour")'); await pg.waitForTimeout(200);
  ok('Remboursement trop élevé refusé', (await pg.evaluate(() => S.rt.length)) === 0 && (await pg.textContent('#t')).includes('dépasse'));
  await pg.fill('#ra', '280000');
  await pg.click('#m button:has-text("Valider le retour")'); await pg.waitForTimeout(200);
  ok('Remboursement normal accepté', (await pg.evaluate(() => S.rt.length)) === 1);

  console.log(res.join('\n')); await b.close();
  process.exit(res.some(r => r.startsWith('ÉCHEC')) ? 1 : 0);
})().catch(e => { console.log(res.join('\n')); console.error(e); process.exit(2); });
