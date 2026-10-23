#!/usr/bin/env python3
# Assemble Boutique Facile v6 : CSS + JS -> index.html (+ sw.js, manifest, icônes, variante artefact)
import re, os, sys, json, hashlib, shutil, glob
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
ASSETS = os.path.join(ROOT, 'assets')
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)
sys.path.insert(0, ASSETS)
import mklogo as L          # le logo est dessiné par du code : mêmes formes partout (icône, écran de code, À propos)

css = open(os.path.join(SRC, 'app.css'), encoding='utf-8').read()
files = sorted(glob.glob(os.path.join(SRC, 'js', '*.js')))
js = '\n'.join(open(f, encoding='utf-8').read() for f in files)

# ---- logo en SVG dans la page (écran de code, À propos)
def isvg(inner, w, h, cls):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" class="%s" aria-hidden="true" focusable="false">%s</svg>'
            % (L.n(w), L.n(h), cls, inner))
LOGO_IC = isvg(L.square_icon(256), 256, 256, 'lgi')
_wm, _ww, _wh, _ = L.wordmark('boutique facile', 'currentColor')
LOGO_WORD = isvg(_wm, _ww, _wh, 'lgw')
_hi, _hw, _hh = L.lockup_h(120)
LOGO_H = isvg(_hi, _hw, _hh, 'lgh')
logo_js = 'const LOGO_IC=%s,LOGO_WORD=%s,LOGO_H=%s;' % tuple(json.dumps(x, ensure_ascii=False) for x in (LOGO_IC, LOGO_WORD, LOGO_H))
assert js.count("'use strict';") >= 1
js = js.replace("'use strict';", "'use strict';\n" + logo_js, 1)

# ---- catalogue des textes à traduire : tout _('…') et X('…')
LIT = r"""'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)\""""
pat = re.compile(r"(?<![\w$.])(?:_|X)\(\s*(?:" + LIT + r")")
def unesc(s):
    out = []; i = 0
    while i < len(s):
        c = s[i]
        if c == '\\' and i + 1 < len(s):
            n = s[i + 1]
            out.append({'n': '\n', 't': '\t', "'": "'", '"': '"', '\\': '\\'}.get(n, n)); i += 2
        else:
            out.append(c); i += 1
    return ''.join(out)
cat = []; seen = set()
for m in pat.finditer(js):
    t = unesc(m.group(1) if m.group(1) is not None else m.group(2))
    if not re.search(r'[A-Za-zÀ-ÿ]', t) or t in seen: continue
    seen.add(t); cat.append(t)
cat_js = 'const CAT=' + json.dumps(cat, ensure_ascii=False) + ';'

SHELL_BODY = '''<body>
<header id="hd"></header>
<main id="app"></main>
<nav id="nv"></nav>
<div id="lk" class="lk"><div class="mk">__LOGO_IC__</div><h1 id="lh">Boutique Facile</h1><p id="lm"></p><input class="in" id="pn" type="password" inputmode="numeric" maxlength="4" autocomplete="off" onkeydown="if(event.key=='Enter')unlock()" style="max-width:220px;text-align:center;font-size:28px;letter-spacing:8px"><button class="b gr" id="lo" onclick="unlock()">Ouvrir</button><button class="lnk" id="lf" onclick="forgot()">Code oublié ?</button><div class="lkb">__LOGO_WORD__</div></div>
<div id="t"></div><div id="m"></div><div class="cam" id="cam"></div><div id="pr"></div>
'''.replace('__LOGO_IC__', LOGO_IC).replace('__LOGO_WORD__', LOGO_WORD)

THEME = '#F4F6F3'
def artifact_page(js_text):
    # L'hébergeur d'artefacts ajoute lui-même <!doctype>, <html>, <head> et <body> : on ne livre que le contenu
    # (titre, styles, corps, script). Pas de CSP ni de manifeste ici : ils sont gérés par l'hébergeur.
    body = SHELL_BODY[len('<body>\n'):]
    return ('<title>Boutique Facile</title>\n<style>\n' + css + '\n</style>\n' + body +
            '<script>\nconst NOSW=true;\n' + js_text + '\n</script>\n')

def page(js_text, artifact=False):
    head = ('<!DOCTYPE html>\n<html lang="fr"><head><meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<title>Boutique Facile</title><meta name="theme-color" content="%s">' % THEME)
    if not artifact:
        head += ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; '
                 'style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob:; connect-src \'self\'; '
                 'object-src \'none\'; base-uri \'none\'; form-action \'none\'">')
        head += ('<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" href="icon-192.png">'
                 '<link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="mobile-web-app-capable" content="yes">'
                 '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Boutique Facile">'
                 '<meta name="apple-mobile-web-app-status-bar-style" content="default">')
    head += '<style>\n' + css + '\n</style></head>\n'
    pre = 'const NOSW=true;\n' if artifact else ''
    return head + SHELL_BODY + '<script>\n' + pre + js_text + '\n</script></body></html>\n'

body_js = cat_js + '\n' + js
h = hashlib.sha1((css + body_js + LOGO_IC).encode('utf-8')).hexdigest()[:10]
assert body_js.count("const BUILD='__BUILD__'") == 1
body_js = body_js.replace("const BUILD='__BUILD__'", "const BUILD='%s'" % h, 1)
# CAT doit venir avant le reste mais après 'use strict' : on remet 'use strict' en tête
body_js = body_js.replace(cat_js + '\n' + "'use strict';", "'use strict';\n" + cat_js, 1)
assert body_js.startswith("'use strict';")

open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(page(body_js))
open(os.path.join(DIST, 'artifact.html'), 'w', encoding='utf-8').write(artifact_page(body_js))

# ---- service worker : le téléchargement initial ignore le cache du navigateur (cache:'reload'), la vérification en arrière-plan aussi (no-cache)
# Seuls './' et index.html sont indispensables ; les icônes sont prises « au mieux » pour qu'un fichier oublié ne bloque jamais l'installation.
sw = '''const V='bf-v6-%s',MUST=['./','index.html'],OPT=['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
const get=u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(u);return r});
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(async c=>{
 await Promise.all(MUST.map(u=>get(u).then(r=>c.put(u,r))));
 await Promise.all(OPT.map(u=>get(u).then(r=>c.put(u,r)).catch(()=>{})));
}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);
 if(q.method!=='GET'||u.origin!==location.origin)return;
 if(u.searchParams.has('chk')){e.respondWith(fetch(q).catch(()=>new Response('',{status:504})));return}
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(q,{ignoreSearch:true});
  const net=fetch(q.url,{cache:'no-cache'}).then(r=>{if(r.ok&&!r.redirected)c.put(q,r.clone());return r}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(await c.match('index.html'))||Response.error();
 }));
});
''' % h
open(os.path.join(DIST, 'sw.js'), 'w').write(sw)

manifest = {"id": "./", "name": "Boutique Facile", "short_name": "Boutique",
 "description": "Caisse, stock, dettes clients et comptabilité, même sans internet",
 "lang": "fr", "dir": "ltr", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
 "background_color": L.GREEN, "theme_color": THEME, "categories": ["business", "finance", "productivity"],
 "prefer_related_applications": False,
 "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
           {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
           {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(DIST, 'manifest.webmanifest'), 'w').write(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
for ic in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'):
    shutil.copy(os.path.join(ASSETS, ic), os.path.join(DIST, ic))
print('build', h, 'CAT', len(cat), 'index.html', os.path.getsize(os.path.join(DIST, 'index.html')))
