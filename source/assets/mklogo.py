#!/usr/bin/env python3
# Logo « Boutique Facile » : tout est dessiné ici, sans aucune police.
# Idée : le double trait que tout commerçant trace sous son total dans son cahier (= « c'est arrêté, c'est juste »).
# Un seul trait arrondi pour le B, pour le double trait et pour le nom.
import math, os, sys, json

GREEN, GREEN_D, AMBER = "#0E6B47", "#0A5237", "#F5B800"
INK, WHITE, PAPER = "#14261C", "#FFFFFF", "#F4F6F3"


def n(v):
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


# ------------------------------------------------------------------ le B + le double trait
P = dict(H=236, s=46, wr=0.80, mid=0.46, narrow=14,      # le B : hauteur, trait, largeur, taille de la taille, bol du haut plus étroit
         sr=19, g1=23, g2=17)                            # le double trait : épaisseur, espace sous le B, espace entre les 2 traits


def b_paths(p=P):
    H, s = p["H"], p["s"]
    W = H * p["wr"]
    X0, T, Bt = s / 2, s / 2, H - s / 2
    M = T + (Bt - T) * p["mid"]
    r1, r2 = (M - T) / 2, (Bt - M) / 2
    R2 = W - s / 2
    R1 = R2 - p["narrow"]
    d1 = f"M{n(X0)},{n(Bt)}V{n(T)}H{n(R1 - r1)}A{n(r1)},{n(r1)} 0 0 1 {n(R1 - r1)},{n(M)}H{n(X0)}"
    d2 = f"M{n(X0)},{n(M)}H{n(R2 - r2)}A{n(r2)},{n(r2)} 0 0 1 {n(R2 - r2)},{n(Bt)}H{n(X0)}"
    return d1, d2, W


def block(p=P, fg=WHITE, accent=AMBER, ox=0, oy=0, k=1.0):
    """B + double trait, boîte visible W × Htot, coin haut-gauche en (ox, oy), échelle k. Retourne (svg, W, Htot)."""
    d1, d2, W = b_paths(p)
    H, s, sr = p["H"], p["s"], p["sr"]
    y1 = H + p["g1"] + sr / 2
    y2 = y1 + sr + p["g2"]
    Ht = y2 + sr / 2
    xl, xr = sr / 2, W - sr / 2
    g = (f'<g transform="translate({n(ox)} {n(oy)}) scale({n(k)})" fill="none" stroke-linecap="round" stroke-linejoin="round">'
         f'<path d="{d1}{d2}" stroke="{fg}" stroke-width="{n(s)}"/>'
         f'<path d="M{n(xl)},{n(y1)}H{n(xr)}M{n(xl)},{n(y2)}H{n(xr)}" stroke="{accent}" stroke-width="{n(sr)}"/></g>')
    return g, W, Ht


def square_icon(size=512, rx=0.2188, bg=GREEN, fg=WHITE, accent=AMBER, fill=0.64, dy=-0.012, p=P):
    """Icône carrée. fill = part de la largeur du carré occupée par la hauteur du bloc. rx=0 → plein cadre (maskable / iPhone)."""
    _, W, Ht = block(p)
    k = size * fill / Ht
    ox = (size - W * k) / 2
    oy = (size - Ht * k) / 2 + size * dy
    g, _, _ = block(p, fg, accent, ox, oy, k)
    bgr = f'<rect width="{size}" height="{size}" rx="{n(size * rx)}" fill="{bg}"/>' if bg else ""
    return bgr + g


# ------------------------------------------------------------------ le nom, dessiné au même trait arrondi
C = 80.0          # hauteur d'x (sur l'axe du trait)
SW = 19.0         # épaisseur du trait
ASC, ASC_T, DESC = 128.0, 106.0, 44.0
R = C / 2
GAP = {("S", "S"): 33, ("S", "R"): 25, ("R", "S"): 25, ("R", "R"): 17,
       ("X", "S"): 22, ("S", "X"): 22, ("X", "R"): 16, ("R", "X"): 16, ("X", "X"): 14,
       ("C", "S"): 19, ("C", "R"): 12, ("C", "X"): 12}
SPACE = 60


def circ(cx, cy, r):
    return f"M{n(cx - r)},{n(cy)}A{n(r)},{n(r)} 0 1 1 {n(cx + r)},{n(cy)}A{n(r)},{n(r)} 0 1 1 {n(cx - r)},{n(cy)}"


def glyph(ch):
    """→ (chemins, xmin, xmax, bord gauche, bord droit) ; ligne de base y=0, le haut est négatif"""
    th_c, th_e = math.radians(50), math.radians(54)
    if ch == "o": return [circ(R, -R, R)], 0, C, "R", "R"
    if ch == "b": return [f"M0,{n(-ASC)}V0", circ(R, -R, R)], 0, C, "S", "R"
    if ch == "a": return [circ(R, -R, R), f"M{n(C)},{n(-C)}V0"], 0, C, "R", "S"
    if ch == "q": return [circ(R, -R, R), f"M{n(C)},{n(-C)}V{n(DESC)}"], 0, C, "R", "S"
    if ch == "u": return [f"M0,{n(-C)}V{n(-R)}A{n(R)},{n(R)} 0 0 0 {n(C)},{n(-R)}", f"M{n(C)},{n(-C)}V0"], 0, C, "S", "S"
    if ch == "l": return [f"M0,{n(-ASC)}V0"], 0, 0, "S", "S"
    if ch == "i": return [f"M0,{n(-C)}V0", "DOT"], 0, 0, "S", "S"
    if ch == "t": return [f"M0,{n(-ASC_T)}V-17A17,17 0 0 0 17,0H24", f"M-21,{n(-C)}H31"], -21, 31, "X", "X"
    if ch == "f":
        hr = 31
        return [f"M0,0V{n(-(ASC - hr))}A{hr},{hr} 0 0 1 {hr},{n(-ASC)}H{hr + 9}", f"M-21,{n(-C)}H35"], -21, hr + 9, "X", "X"
    if ch == "e":
        x2, y2 = R + R * math.cos(th_e), -R + R * math.sin(th_e)
        return [f"M0,{n(-R)}H{n(C)}A{n(R)},{n(R)} 0 1 0 {n(x2)},{n(y2)}"], 0, C, "R", "R"
    if ch == "c":
        x1, y1 = R + R * math.cos(th_c), -R - R * math.sin(th_c)
        x2, y2 = R + R * math.cos(th_c), -R + R * math.sin(th_c)
        return [f"M{n(x1)},{n(y1)}A{n(R)},{n(R)} 0 1 0 {n(x2)},{n(y2)}"], 0, x1, "R", "C"
    raise ValueError(ch)


def wordmark(text="boutique facile", color=GREEN, ox=0, oy=0, k=1.0, gap_scale=1.0):
    """Retourne (svg, largeur visible, hauteur visible, ligne de base y) en unités du nom."""
    items, prev, space = [], None, False
    for ch in text:
        if ch == " ":
            space = True
            continue
        paths, x0, x1, lt, rt = glyph(ch)
        if prev is None:
            pen = -x0
        else:
            gap = SPACE if space else GAP[(prev[2], lt)] * gap_scale
            pen = prev[0] + prev[1] + SW + gap - x0
        space = False
        items.append((pen, paths))
        prev = (pen, x1, rt)
    first_x0 = glyph(text[0])[1]
    vis_x0 = items[0][0] + first_x0 - SW / 2
    vis_x1 = prev[0] + prev[1] + SW / 2
    top, bot = -ASC - SW / 2, DESC + SW / 2
    dotR = SW * 0.62
    out = [f'<g transform="translate({n(ox)} {n(oy)}) scale({n(k)}) translate({n(-vis_x0)} {n(-top)})" fill="none" '
           f'stroke="{color}" stroke-width="{n(SW)}" stroke-linecap="round" stroke-linejoin="round">']
    for pen, paths in items:
        for d in paths:
            if d == "DOT":
                out.append(f'<circle cx="{n(pen)}" cy="{n(-(C + SW / 2 + 9 + dotR))}" r="{n(dotR)}" fill="{color}" stroke="none"/>')
            else:
                out.append(f'<path transform="translate({n(pen)} 0)" d="{d}"/>')
    out.append("</g>")
    return "".join(out), (vis_x1 - vis_x0), (bot - top), -top


# ------------------------------------------------------------------ assemblages
def svg(inner, w, h, size=None, bg=None, title="Boutique Facile"):
    sw = size[0] if size else w
    sh = size[1] if size else h
    b = f'<rect width="{n(w)}" height="{n(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(w)} {n(h)}" width="{n(sw)}" height="{n(sh)}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{b}{inner}</svg>')


def _icon_part(S, color_bg, fg, accent, rx, naked, nk, p):
    """retourne (svg, largeur) de la partie « symbole » d'un assemblage, dans une boîte de hauteur S"""
    if not naked:
        return square_icon(S, rx, color_bg, fg, accent, p=p), S
    _, bw, bh = block(p)
    kk = S * nk / bh
    g, _, _ = block(p, fg, accent, 0, (S - S * nk) / 2, kk)
    return g, bw * kk


def lockup_h(S=240, color=GREEN, bg_icon=GREEN, fg=WHITE, accent=AMBER, text_h=0.40, gap=0.20, rx=0.2188, naked=False, nk=0.80, align="center", p=P):
    """symbole + nom sur une ligne. text_h = (haut des hampes -> ligne de base) / côté du symbole. naked = sans carré (sur fond vert)."""
    icon, iw = _icon_part(S, bg_icon, fg, accent, rx, naked, nk, p)
    k = S * text_h / (ASC + SW / 2)
    _, ww, wh, base = wordmark("boutique facile", color)
    tx = iw + S * (gap if not naked else gap * 0.9)
    if naked and align == "baseline":
        # la ligne de base du nom tombe sur le pied du B ; le double trait pend en dessous, comme un soulignement
        top0 = (S - S * nk) / 2
        y_b = top0 + (p["H"] / (p["H"] + p["g1"] + p["sr"] + p["g2"] + p["sr"])) * S * nk
        ty = y_b - (ASC + SW) * k
    else:
        xh_c = base - C / 2                  # centre de la bande d'x, mesuré depuis le haut du nom
        ty = S / 2 - xh_c * k
    wm, ww, wh, base = wordmark("boutique facile", color, tx, ty, k)
    return icon + wm, tx + ww * k, S


def lockup_v(S=300, color=GREEN, bg_icon=GREEN, fg=WHITE, accent=AMBER, text_w=1.40, gap=0.17, rx=0.2188, naked=False, nk=0.80, p=P):
    icon, iw = _icon_part(S, bg_icon, fg, accent, rx, naked, nk, p)
    _, ww, wh, base = wordmark("boutique facile", color)
    k = S * text_w / ww
    W = S * text_w
    icon = f'<g transform="translate({n((W - iw) / 2)} 0)">{icon}</g>'
    wm, ww2, wh2, base2 = wordmark("boutique facile", color, 0, S + S * gap, k)
    return icon + wm, W, S + S * gap + wh2 * k


def padded(inner, w, h, pad):
    """ajoute une marge claire autour d'un assemblage"""
    return f'<g transform="translate({n(pad)} {n(pad)})">{inner}</g>', w + 2 * pad, h + 2 * pad


if __name__ == "__main__":
    print("module ok")
