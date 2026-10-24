// Captures d'écran pour le guide et la page de présentation (données d'exemple fictives)
// Usage : node tests/captures.js <dossier> [url]
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://localhost:8765/index.html';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  // les messages temporaires (toast) sont masqués pour des captures nettes
  const shot = async n => { await pg.evaluate(() => { const t = document.getElementById('t'); if (t) { t.style.transition = 'none'; t.style.opacity = 0 } }); await pg.screenshot({ path: `${OUT}/${n}.png` }) };
  const wait = (ms = 250) => pg.waitForTimeout(ms);
  const close = () => pg.evaluate(() => { M(); R() });

  await pg.goto(URL);
  await pg.waitForSelector('#lk', { state: 'visible' });
  await shot('code');
  await pg.fill('#pn', '1234'); await pg.click('#lo');
  await pg.waitForSelector('#m h2');
  await shot('secours');
  await pg.click('#m button:has-text("J\'ai noté le code")');
  await pg.waitForSelector('#wn');
  await pg.fill('#wn', 'Boutique du Marché');
  await pg.selectOption('#wd', '1');
  await shot('bienvenue');
  await pg.click('#m button:has-text("Commencer")');
  await wait();

  // données d'exemple : produits, deux semaines de ventes, clients à crédit
  await pg.evaluate(() => {
    S.shop.tel = '622 00 00 00';
    const P0 = [
      ['Riz 25 kg', 'Alimentation', 280000, 250000, 14, 3], ['Huile 5 L', 'Alimentation', 110000, 95000, 9, 3],
      ['Sucre 1 kg', 'Alimentation', 15000, 12500, 40, 10], ['Lait en poudre 400 g', 'Alimentation', 25000, 20000, 18, 6],
      ['Tomate concentrée', 'Alimentation', 3000, 2200, 60, 20], ['Savon', 'Hygiène', 5000, 3500, 4, 5],
      ['Dentifrice', 'Hygiène', 8000, 6000, 12, 4], ['Paracétamol 500 mg', 'Médicaments', 8000, 5000, 35, 15],
      ['Eau 1,5 L', 'Boissons', 5000, 3800, 48, 12], ['Jus de bissap', 'Boissons', 4000, 2500, 2, 6]];
    S.p = P0.map((x, i) => pdef({ id: i + 1, n: x[0], cat: x[1], pr: x[2], c: x[3], q: x[4], m: x[5] }));
    S.n = 20; S.p[0].fav = 1; S.p[2].fav = 1;
    let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const now = Date.now(), t0 = D0(now);
    for (let d = 13; d >= 0; d--) {
      const n = 6 + Math.floor(rnd() * 8);
      for (let k = 0; k < n; k++) {
        const t = t0 - d * DAY + (8 + rnd() * 11) * 3600e3; if (t > now - 600e3) continue;
        const items = []; const m = 1 + Math.floor(rnd() * 3);
        for (let j = 0; j < m; j++) { const p = S.p[Math.floor(rnd() * S.p.length)]; if (items.some(i => i.id == p.id)) continue; const q = 1 + Math.floor(rnd() * 3); items.push({ id: p.id, n: p.n, g: '', u: '', f: 1, q, pr: p.pr, pr0: p.pr, c: p.c, tv: 1, cat: p.cat, lots: [] }) }
        const sub = items.reduce((a, i) => a + i.q * i.pr, 0), mo = rnd() < .3;
        S.s.push({ id: uid(), t, no: ++S.rn, by: 1, items, sub, disc: 0, total: sub, pay: [mo ? { m: 'm', a: sub, op: 'om', ref: '' } : { m: 'e', a: sub }], cl: '', cid: '' });
      }
    }
    S.s.sort((a, b) => a.t - b.t); S.s.forEach((s, i) => s.no = i + 1); S.rn = S.s.length;
    const C = [['Mamadou Diallo', '622 11 22 33', 85000, -3], ['Fatoumata Camara', '628 44 55 66', 40000, 5], ['Ibrahima Sylla', '', 15000, 12]];
    S.cl = C.map(([n, tel, a, dd]) => ({ id: uid(), n, tel, pi: '', ph: '', a, h: [{ t: now - 9 * DAY, v: a, no: 0 }], due: t0 + dd * DAY, lim: 0, t0: now - 9 * DAY }));
    S.bk = now - 2 * DAY;
    save(true); R();
  });
  await wait();
  await shot('vendre');

  // panier puis encaissement en espèces
  for (const id of [1, 1, 2, 3, 3]) await pg.click(`#grid .t[data-id="${id}"]`);
  await pg.evaluate(() => scrollTo(0, 0));
  await shot('panier');
  await pg.click('#cbar button:has-text("Espèces")');
  await pg.waitForSelector('#pgv');
  for (const k of ['7', '5', '0', '0', '0', '0']) await pg.click(`#pkw .kp button:text-is("${k}")`);
  await shot('encaisser');
  await pg.click('#pok'); await wait(400);
  await shot('vente-ok');

  // vente à crédit (non validée)
  await pg.click('#grid .t[data-id="6"]'); await pg.click('#grid .t[data-id="6"]');
  await pg.click('#cbar button:has-text("À crédit")');
  await pg.waitForSelector('#cn', { state: 'visible' });
  await pg.fill('#cn', 'Aïssatou Bah'); await pg.fill('#cp', '664 12 34 56');
  await shot('credit');
  await pg.evaluate(() => { M(); cclear() });

  // clients
  await pg.click('#nv button:has-text("Clients")'); await wait();
  await shot('clients');
  await pg.click('#cll2 button:has-text("Relancer")'); await wait();
  await shot('relance');
  await close();

  // stock
  await pg.click('#nv button:has-text("Stock")'); await wait();
  await shot('stock');
  await pg.click('#app button:has-text("Ajouter un produit")'); await wait();
  await pg.fill('#fn', 'Café moulu 250 g'); await pg.fill('#fg', '250 g'); await pg.fill('#fcat', 'Alimentation');
  await pg.fill('#fa', '18000'); await pg.fill('#fv', '22000'); await pg.fill('#fq', '10');
  await shot('produit');
  await close();
  await pg.evaluate(() => go('s', 'reo')); await wait();
  await shot('recommander');

  // caisse
  await pg.click('#nv button:has-text("Caisse")'); await wait();
  await pg.click('#app button:has-text("Ouvrir la caisse")'); await wait();
  await pg.fill('#m [data-w="c"]', '200000');
  await shot('ouvrir-caisse');
  await pg.click('#m button:has-text("Ouvrir")'); await wait();
  await shot('caisse');
  await pg.click('#app button:has-text("Clôturer la caisse")'); await wait();
  await pg.fill('#m [data-w="c"]', '195000'); await pg.dispatchEvent('#m [data-w="c"]', 'input');
  await shot('cloture');
  await close();

  // plus : rapports, conseiller, sauvegarde, vendeurs
  for (const [k, n] of [['rep', 'rapports'], ['adv', 'conseiller'], ['bak', 'sauvegarde'], ['team', 'vendeurs']]) {
    await pg.evaluate(k => go('p', k), k); await wait(400); await shot(n);
  }
  await pg.click('#nv button:has-text("Plus")'); await wait();
  await shot('plus');
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
