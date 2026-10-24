// Parcours complet de Boutique Facile dans Chromium (taille téléphone)
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://localhost:8765/index.html';
const results = [];
const ok = (n, c, d) => { results.push((c ? 'OK   ' : 'ÉCHEC') + ' ' + n + (d ? ' — ' + d : '')); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const shot = n => pg.screenshot({ path: `${OUT}/${n}.png` });
  const S = () => pg.evaluate(() => JSON.parse(JSON.stringify(S)));

  await pg.goto(URL);
  await pg.waitForSelector('#lk', { state: 'visible' });
  ok('Écran de création du code', await pg.isVisible('#pn'));
  await shot('01-code');
  await pg.fill('#pn', '1234'); await pg.click('#lo');
  await pg.waitForSelector('#m h2');
  ok('Code de secours affiché', (await pg.textContent('#m h2')).includes('secours'));
  await shot('02-secours');
  await pg.click('text=J\'ai noté le code');
  await pg.waitForSelector('#wn');
  await pg.fill('#wn', 'Boutique Test');
  await pg.selectOption('#wd', '1');
  await shot('03-bienvenue');
  await pg.click('#m button:has-text("Commencer")');
  await pg.waitForSelector('#grid .t');
  ok('Produits d\'exemple chargés', (await pg.$$('#grid .t')).length === 5);
  await shot('04-vendre');

  // vente en espèces : 2 riz + 1 huile, le client donne 700 000
  const riz = '#grid .t[data-id="1"]', huile = '#grid .t[data-id="2"]';
  await pg.click(riz); await pg.click(riz); await pg.click(huile);
  ok('Panier = 670 000', (await pg.textContent('#cbar .tot')).replace(/\s/g, '').includes('670000'));
  await shot('05-panier');
  await pg.click('#cbar button:has-text("Espèces")');
  await pg.waitForSelector('#pgv');
  for (const k of ['7', '0', '0', '0', '0', '0']) await pg.click(`#pkw .kp button:text-is("${k}")`);
  ok('Monnaie à rendre 30 000', (await pg.textContent('#pchg')).replace(/\s/g, '').includes('30000'));
  await shot('06-encaisser');
  await pg.click('#pok');
  await pg.waitForTimeout(400);
  let st = await S();
  ok('Vente enregistrée', st.s.length === 1 && st.s[0].total === 670000 && st.s[0].chg === 30000);
  ok('Stock du riz 12 → 10', st.p.find(p => p.id === 1).q === 10);
  await shot('07-apres-vente');

  // vente à crédit
  await pg.click('#grid .t[data-id="3"]');
  await pg.click('#cbar button:has-text("À crédit")');
  await pg.waitForSelector('#cn', { state: 'visible' });
  await pg.fill('#cn', 'Mamadou Diallo'); await pg.fill('#cp', '622000000');
  await shot('08-credit');
  await pg.click('#pok');
  await pg.waitForTimeout(400);
  st = await S();
  const cl = st.cl.find(c => c.n === 'Mamadou Diallo');
  ok('Client créé avec dette 15 000', cl && cl.a === 15000);
  if (await pg.isVisible('#m h2')) await pg.click('#m button:has-text("Nouvelle vente")');

  // clients : encaisser la dette
  await pg.click('#nv button:has-text("Clients")');
  await pg.waitForSelector('#cll2');
  await shot('09-clients');
  await pg.click('#cll2 button:has-text("Encaisser")');
  await pg.fill('#en', '10000');
  await pg.click('#m button:has-text("Valider")');
  await pg.waitForTimeout(300);
  st = await S();
  ok('Paiement partiel : reste 5 000', st.cl.find(c => c.n === 'Mamadou Diallo').a === 5000);
  if (await pg.isVisible('#m h2')) await pg.click('#m button:has-text("Non")');

  // stock : nouveau produit
  await pg.click('#nv button:has-text("Stock")');
  await pg.click('#app button:has-text("Ajouter un produit")');
  await pg.fill('#fn', 'Lait en poudre'); await pg.fill('#fa', '20000'); await pg.fill('#fv', '25000'); await pg.fill('#fq', '6');
  await shot('10-nouveau-produit');
  await pg.click('#m button:has-text("Enregistrer")');
  await pg.waitForTimeout(300);
  st = await S();
  ok('Produit ajouté', st.p.some(p => p.n === 'Lait en poudre' && p.q === 6 && p.pr === 25000));
  await shot('11-stock');

  // caisse : ouvrir, vendre, clôturer
  await pg.click('#nv button:has-text("Caisse")');
  await pg.click('#app button:has-text("Ouvrir la caisse")');
  await pg.fill('#m [data-w="c"]', '50000');
  await pg.click('#m button:has-text("Ouvrir")');
  await pg.click('#nv button:has-text("Vendre")');
  await pg.click('#grid .t[data-id="5"]');
  await pg.click('#cbar button:has-text("Espèces")');
  await pg.click('#pok');
  await pg.waitForTimeout(300);
  await pg.click('#nv button:has-text("Caisse")');
  await shot('12-caisse');
  await pg.click('#app button:has-text("Clôturer la caisse")');
  await pg.fill('#m [data-w="c"]', '55000');
  await pg.click('#m .pay2 button:has-text("Clôturer")');
  await pg.waitForTimeout(300);
  st = await S();
  ok('Clôture juste (50 000 + 5 000)', st.cx.length === 1 && st.cx[0].diff.c === 0);
  await shot('13-cloture');
  await pg.click('#m button:has-text("Fermer")');

  // rapports, conseiller, comptabilité, sauvegarde : l'écran s'affiche sans erreur
  for (const [k, n] of [['rep', '14-rapports'], ['cpt', '15-compta'], ['adv', '16-conseiller'], ['bak', '17-sauvegarde'], ['set', '18-reglages']]) {
    await pg.evaluate(k => go('p', k), k);
    await pg.waitForTimeout(250);
    const txt = await pg.textContent('#app');
    ok('Écran ' + k, !/Erreur :/.test(txt));
    await shot(n);
  }

  // sauvegarde chiffrée puis restauration
  const bk = await pg.evaluate(async () => { const t = await makeBackup({ pw: 'secret' }); const r = await restoreFrom(t, 'secret'); return { enc: JSON.parse(t).kind, n: r.S.s.length }; });
  ok('Sauvegarde chiffrée et relue', bk.enc === 'bf-backup-enc' && bk.n === st.s.length);

  // persistance : recharger la page garde les données
  await pg.evaluate(() => flush());
  await pg.reload();
  await pg.waitForSelector('#lk', { state: 'visible' });
  await pg.fill('#pn', '1234'); await pg.click('#lo');
  await pg.waitForTimeout(300);
  st = await S();
  ok('Données gardées après rechargement', st.s.length === 3 && st.p.length === 6);

  ok('Aucune erreur JavaScript', errs.length === 0, errs.join(' | '));
  console.log(results.join('\n'));
  await b.close();
  process.exit(results.some(r => r.startsWith('ÉCHEC')) ? 1 : 0);
})().catch(e => { console.log(results.join('\n')); console.error(e); process.exit(2); });
