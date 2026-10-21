import { CharacterColorPalette, DressCode } from '../types/fighter';
import { Build, Skeleton, V } from './fighterRig';

// ---------------------------------------------------------------------------------------------
// COLOUR HELPERS
// ---------------------------------------------------------------------------------------------
function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(full.slice(0, 2), 16) || 0, parseInt(full.slice(2, 4), 16) || 0, parseInt(full.slice(4, 6), 16) || 0];
}
const cache = new Map<string, string>();
/** amt < 0 mixes with black, amt > 0 mixes with white. */
export function shade(hex: string, amt: number): string {
  const key = hex + amt;
  const hit = cache.get(key);
  if (hit) return hit;
  const [r, g, b] = parse(hex);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const out = `rgb(${Math.round(r + (t - r) * k)},${Math.round(g + (t - g) * k)},${Math.round(b + (t - b) * k)})`;
  cache.set(key, out);
  return out;
}
const EDGE = 'rgba(8,6,14,0.9)';

// ---------------------------------------------------------------------------------------------
// OUTFITS (derived from the roster palette so alternate palettes & creator edits still work)
// ---------------------------------------------------------------------------------------------
type CoatStyle = 'open' | 'closed' | 'vest' | 'tank';
type HairStyle = 'spiky' | 'ponytail' | 'slick' | 'swept' | 'fringe' | 'updo' | 'pompadour';

interface Outfit {
  coatStyle: CoatStyle;
  coat: string;
  lapel: string;
  shirt: string;
  vest?: string;
  pants: string;
  belt: string;
  shoes: string;
  shoeTrim: string;
  boots: boolean;
  tie?: string;
  bow?: string;
  gloves?: string;
  gloveCuff?: string;
  rolled: boolean;
  stripes?: string; // jacket stripes / pinstripes
  pinstripe: boolean;
  tails: boolean;
  gown: boolean;
  chain?: string;
  hair: HairStyle;
  stubble: boolean;
}

function outfitFor(dress: DressCode, p: CharacterColorPalette): Outfit {
  switch (dress) {
    case 'Casual':
      return {
        coatStyle: 'open', coat: p.primary, lapel: shade(p.primary, -0.25), shirt: '#d4d4d8',
        pants: p.secondary, belt: p.accent, shoes: p.details, shoeTrim: p.accent, boots: false,
        gloves: p.details, rolled: false, stripes: p.details, pinstripe: false, tails: false, gown: false,
        hair: 'spiky', stubble: false,
      };
    case 'Smart Casual':
      return {
        coatStyle: 'open', coat: p.primary, lapel: shade(p.primary, -0.3), shirt: p.details,
        pants: p.secondary, belt: '#0a0a0a', shoes: '#4a2f22', shoeTrim: p.accent, boots: true,
        tie: shade(p.primary, -0.45), gloves: '#18181b', rolled: false, pinstripe: false, tails: false, gown: false,
        hair: 'ponytail', stubble: false,
      };
    case 'Semi Formal':
      return {
        coatStyle: 'vest', coat: p.primary, lapel: shade(p.primary, -0.3), shirt: p.secondary,
        pants: '#111827', belt: '#050505', shoes: '#0a0a0a', shoeTrim: '#374151', boots: false,
        tie: shade(p.accent, -0.55), rolled: true, pinstripe: false, tails: false, gown: false,
        hair: 'slick', stubble: false,
      };
    case 'Formal':
      return {
        coatStyle: 'closed', coat: p.primary, lapel: shade(p.primary, -0.28), shirt: p.details, vest: p.secondary,
        pants: p.primary, belt: '#050505', shoes: '#0a0a0a', shoeTrim: '#52525b', boots: false,
        tie: p.accent, gloves: '#27272a', gloveCuff: p.accent, rolled: false, stripes: shade(p.primary, 0.32),
        pinstripe: true, tails: false, gown: false, hair: 'swept', stubble: true,
      };
    case 'Black Tie':
      return {
        coatStyle: 'closed', coat: shade(p.primary, 0.16), lapel: shade(p.accent, 0.1), shirt: p.secondary,
        pants: shade(p.primary, 0.1), belt: '#050505', shoes: '#050505', shoeTrim: '#a1a1aa', boots: false,
        bow: shade(p.primary, -0.5), gloves: p.details, rolled: false, pinstripe: false, tails: true, gown: false,
        stripes: p.accent, hair: 'fringe', stubble: false,
      };
    case 'White Tie':
      return {
        coatStyle: 'tank', coat: p.primary, lapel: p.secondary, shirt: p.secondary,
        pants: p.primary, belt: '#d4a73a', shoes: p.secondary, shoeTrim: p.accent, boots: true,
        gloves: p.details, rolled: false, pinstripe: false, tails: false, gown: true, stripes: '#d4a73a',
        hair: 'updo', stubble: false,
      };
    case 'Coctel':
    default:
      return {
        coatStyle: 'open', coat: p.primary, lapel: p.secondary, shirt: p.secondary,
        pants: p.secondary, belt: p.accent, shoes: '#050505', shoeTrim: p.accent, boots: false,
        chain: p.accent, rolled: false, pinstripe: false, tails: false, gown: false,
        hair: 'pompadour', stubble: false,
      };
  }
}

export function buildFor(dress: DressCode): Build {
  switch (dress) {
    case 'Formal': return { w: 1.28, h: 1.07, female: false };
    case 'Smart Casual': return { w: 0.86, h: 0.97, female: true };
    case 'White Tie': return { w: 0.84, h: 0.98, female: true };
    case 'Casual': return { w: 1.0, h: 1.0, female: false };
    case 'Coctel': return { w: 1.0, h: 1.01, female: false };
    case 'Black Tie': return { w: 0.92, h: 1.03, female: false };
    default: return { w: 1.05, h: 1.02, female: false };
  }
}

// ---------------------------------------------------------------------------------------------
// PRIMITIVES
// ---------------------------------------------------------------------------------------------
function capPath(ctx: CanvasRenderingContext2D, a: V, b: V, ra: number, rb: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  ctx.beginPath();
  ctx.arc(a[0], a[1], ra, 0, Math.PI * 2);
  ctx.moveTo(b[0] + rb, b[1]);
  ctx.arc(b[0], b[1], rb, 0, Math.PI * 2);
  ctx.moveTo(a[0] + nx * ra, a[1] + ny * ra);
  ctx.lineTo(b[0] + nx * rb, b[1] + ny * rb);
  ctx.lineTo(b[0] - nx * rb, b[1] - ny * rb);
  ctx.lineTo(a[0] - nx * ra, a[1] - ny * ra);
  ctx.closePath();
}

/** Tapered limb with a dark edge. */
function tube(ctx: CanvasRenderingContext2D, a: V, b: V, ra: number, rb: number, fill: string, edge = EDGE) {
  ctx.fillStyle = edge;
  capPath(ctx, a, b, ra + 1.7, rb + 1.7);
  ctx.fill();
  ctx.fillStyle = fill;
  capPath(ctx, a, b, ra, rb);
  ctx.fill();
}

function poly(ctx: CanvasRenderingContext2D, pts: V[], fill: string, edge: string | null = EDGE) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, a: V, b: V, w: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
}

function norm(a: V, b: V): V {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
}

export interface DrawOpts {
  time: number; // animation frame
  wind: number; // horizontal hair/cloth sway (px)
  speed: number; // 0..1 how violent movement is
}

// ---------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------
export function drawFighterRig(
  ctx: CanvasRenderingContext2D,
  sk: Skeleton,
  dress: DressCode,
  pal: CharacterColorPalette,
  opts: DrawOpts
) {
  const o = outfitFor(dress, pal);
  const b = buildFor(dress);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // whole-body rotation around the hip (knockdowns / rolls)
  if (sk.pose.rot) {
    ctx.translate(sk.hip[0], sk.hip[1]);
    ctx.rotate((sk.pose.rot * Math.PI) / 180);
    ctx.translate(-sk.hip[0], -sk.hip[1]);
  }

  if (o.tails) drawTails(ctx, sk, o, opts);

  drawArm(ctx, sk, o, pal, b, false);
  drawLeg(ctx, sk, o, pal, b, false);
  if (o.gown) drawGownBack(ctx, sk, o, opts);
  drawTorso(ctx, sk, o, pal, b, opts);
  drawLeg(ctx, sk, o, pal, b, true);
  if (o.gown) drawGownFront(ctx, sk, o, opts);
  drawHead(ctx, sk, o, pal, b, opts);
  drawArm(ctx, sk, o, pal, b, true);

  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// LIMBS
// ---------------------------------------------------------------------------------------------
function drawLeg(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, pal: CharacterColorPalette, b: Build, front: boolean) {
  const hip: V = [sk.hip[0] + (front ? 4 : -3), sk.hip[1]];
  const knee = front ? sk.fKnee : sk.rKnee;
  const ankle = front ? sk.fAnkle : sk.rAnkle;
  const toeAng = front ? sk.fToeAng : sk.rToeAng;
  const dim = front ? 0 : -0.22;
  const w = b.w;
  const pants = shade(o.pants, dim);
  const rt = (b.female ? 9.4 : 11) * (0.88 + w * 0.12), rk = (b.female ? 7.2 : 8.4) * (0.88 + w * 0.12), ra = b.female ? 5.2 : 6.0;

  if (o.gown) {
    // bare legs under the slit; stockings/boots cover them
    tube(ctx, hip, knee, rt, rk, shade('#1e1b4b', dim));
    tube(ctx, knee, ankle, rk, ra, shade('#1e1b4b', dim));
  } else {
    tube(ctx, hip, knee, rt, rk, pants);
    tube(ctx, knee, ankle, rk, ra, pants);
    if (o.pinstripe) {
      const n = norm(hip, knee);
      line(ctx, [hip[0] - n[1] * 2.5, hip[1] + n[0] * 2.5], [knee[0] - n[1] * 2.5, knee[1] + n[0] * 2.5], 0.7, shade(o.stripes || '#fff', dim));
      const n2 = norm(knee, ankle);
      line(ctx, [knee[0] - n2[1] * 2, knee[1] + n2[0] * 2], [ankle[0] - n2[1] * 2, ankle[1] + n2[0] * 2], 0.7, shade(o.stripes || '#fff', dim));
    }
    if (o.coatStyle === 'open' && o.stripes && o.shirt === '#d4d4d8') {
      // cargo straps (street style)
      const m: V = [hip[0] + (knee[0] - hip[0]) * 0.55, hip[1] + (knee[1] - hip[1]) * 0.55];
      { const n = norm(hip, knee), pn: V = [-n[1], n[0]]; line(ctx, [m[0] - pn[0] * (rt - 1), m[1] - pn[1] * (rt - 1)], [m[0] + pn[0] * (rt - 1), m[1] + pn[1] * (rt - 1)], 2.4, shade(o.belt, dim)); }
    }
  }

  // shoe / boot
  const dir: V = [Math.cos(toeAng), Math.sin(toeAng)];
  const down: V = [-dir[1], dir[0]];
  const heel: V = [ankle[0] - dir[0] * 5 + down[0] * 2.5, ankle[1] - dir[1] * 5 + down[1] * 2.5];
  const toe: V = [ankle[0] + dir[0] * 13 + down[0] * 2.5, ankle[1] + dir[1] * 13 + down[1] * 2.5];
  if (o.boots) {
    const up = norm(ankle, knee);
    tube(ctx, ankle, [ankle[0] + up[0] * 20, ankle[1] + up[1] * 20], 5.8, 6.6, shade(o.shoes, dim));
    line(ctx, [ankle[0] + up[0] * 17, ankle[1] + up[1] * 17], [ankle[0] + up[0] * 17 - up[1] * 0, ankle[1] + up[1] * 17], 1, shade(o.shoeTrim, dim));
  }
  tube(ctx, heel, toe, 5.6, 4.4, shade(o.shoes, dim));
  // sole + trim
  const soleA: V = [heel[0] + down[0] * 4.4, heel[1] + down[1] * 4.4];
  const soleB: V = [toe[0] + down[0] * 3.6, toe[1] + down[1] * 3.6];
  line(ctx, soleA, soleB, 2.2, shade(o.shoeTrim === o.shoes ? '#ffffff' : '#f4f4f5', dim * 0.3));
  line(ctx, [ankle[0] + dir[0] * 4 - down[0] * 3, ankle[1] + dir[1] * 4 - down[1] * 3], [ankle[0] + dir[0] * 8 + down[0] * 2, ankle[1] + dir[1] * 8 + down[1] * 2], 1.2, shade(o.shoeTrim, dim * 0.4));
}

function drawArm(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, pal: CharacterColorPalette, b: Build, front: boolean) {
  const sh: V = front ? [sk.shoulder[0] + 3, sk.shoulder[1] + 4] : [sk.shoulder[0] - 2, sk.shoulder[1] + 3];
  const el = front ? sk.fElbow : sk.rElbow;
  const ha = front ? sk.fHand : sk.rHand;
  const dim = front ? 0 : -0.22;
  const w = b.w;
  const rs = (b.female ? 5.6 : 7.2) * (0.88 + w * 0.12);
  const rw = (b.female ? 4.4 : 5.4) * (0.88 + w * 0.12);

  const skin = shade(pal.skin, dim);
  let sleeve: string;
  let forearm: string;
  if (o.gown) { sleeve = skin; forearm = shade(o.gloves || '#fff', dim); }
  else if (o.coatStyle === 'vest' || o.coatStyle === 'tank') { sleeve = shade(o.shirt, dim); forearm = o.rolled ? skin : shade(o.shirt, dim); }
  else { sleeve = shade(o.coat, dim); forearm = sleeve; }

  tube(ctx, sh, el, rs, rs - 0.6, sleeve);
  tube(ctx, el, ha, rs - 0.6, rw, forearm);

  if (o.rolled) {
    // rolled shirt cuff
    const n = norm(sh, el);
    tube(ctx, [el[0] - n[0] * 1, el[1] - n[1] * 1], [el[0] + n[0] * 3, el[1] + n[1] * 3], rs - 0.3, rs - 0.3, shade(o.shirt, dim - 0.08));
  }
  if (o.gown) {
    // puff sleeve
    ctx.fillStyle = EDGE; ctx.beginPath(); ctx.arc(sh[0], sh[1] - 1, 7.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(o.coat, dim); ctx.beginPath(); ctx.arc(sh[0], sh[1] - 1, 6.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade('#d4a73a', dim); ctx.fillRect(sh[0] - 5, sh[1] + 3, 10, 1.4);
  } else if (o.stripes && o.coatStyle === 'open' && !o.chain) {
    const n = norm(sh, el), pn: V = [-n[1], n[0]];
    line(ctx, [sh[0] + pn[0] * 2, sh[1] + pn[1] * 2], [el[0] + pn[0] * 2, el[1] + pn[1] * 2], 1.1, shade(o.stripes, dim));
    const n2 = norm(el, ha), pn2: V = [-n2[1], n2[0]];
    line(ctx, [el[0] + pn2[0] * 2, el[1] + pn2[1] * 2], [ha[0] - n2[0] * 5 + pn2[0] * 2, ha[1] - n2[1] * 5 + pn2[1] * 2], 1.1, shade(o.stripes, dim));
  }

  // cuff + hand
  const fd = norm(el, ha);
  if (o.gloveCuff) {
    tube(ctx, [ha[0] - fd[0] * 6, ha[1] - fd[1] * 6], [ha[0] - fd[0] * 3.5, ha[1] - fd[1] * 3.5], rw + 0.8, rw + 0.8, shade(o.gloveCuff, dim));
  }
  let handColor = skin;
  let hr = b.female ? 4.8 : 5.8;
  if (o.gloves) {
    handColor = shade(o.gloves, dim);
    if (o.gloveCuff) hr += 1.6; // boxing gloves
  }
  ctx.fillStyle = EDGE; ctx.beginPath(); ctx.arc(ha[0] + fd[0] * 1.5, ha[1] + fd[1] * 1.5, hr + 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = handColor; ctx.beginPath(); ctx.arc(ha[0] + fd[0] * 1.5, ha[1] + fd[1] * 1.5, hr, 0, Math.PI * 2); ctx.fill();
  // knuckle line
  line(ctx, [ha[0] + fd[0] * 3.5 - fd[1] * 2, ha[1] + fd[1] * 3.5 + fd[0] * 2], [ha[0] + fd[0] * 3.5 + fd[1] * 2, ha[1] + fd[1] * 3.5 - fd[0] * 2], 0.9, shade(handColor, -0.45));
  if (o.gloves && !o.gloveCuff && !o.gown && o.coatStyle === 'open' && o.shirt === '#d4d4d8') {
    // hand wraps
    tube(ctx, [ha[0] - fd[0] * 5, ha[1] - fd[1] * 5], [ha[0] - fd[0] * 1, ha[1] - fd[1] * 1], rw + 0.6, rw + 0.6, shade('#f4f4f5', dim));
  }
}

// ---------------------------------------------------------------------------------------------
// TORSO
// ---------------------------------------------------------------------------------------------
function drawTorso(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, pal: CharacterColorPalette, b: Build, opts: DrawOpts) {
  ctx.save();
  ctx.translate(sk.hip[0], sk.hip[1]);
  ctx.rotate(sk.lean);
  const w = b.w * 1.24;
  const f = b.female;
  const H = 62 * b.h;
  const k = H / 58;

  // silhouette in torso space (y up = negative)
  const outline: V[] = f
    ? [[-8 * w, 3], [8 * w, 3], [9 * w, -16 * k], [11 * w, -26 * k], [15 * w, -35 * k], [11 * w, -48 * k], [9 * w, -H - 1], [-8 * w, -H - 1], [-11 * w, -46 * k], [-8 * w, -22 * k]]
    : [[-10 * w, 3], [10 * w, 3], [11.5 * w, -18 * k], [15 * w, -34 * k], [13 * w, -48 * k], [10 * w, -H - 1], [-9 * w, -H - 1], [-14 * w, -44 * k], [-11 * w, -22 * k]];

  const skin = pal.skin;
  const base = (o.coatStyle === 'tank' && o.gown) ? o.shirt : o.shirt;
  poly(ctx, outline, shade(base, 0));

  // --- WHITE TIE GOWN BODICE
  if (o.gown) {
    poly(ctx, outline, o.shirt);
    // sweetheart neckline in skin
    poly(ctx, [[2 * w, -H - 1], [11 * w, -H - 1], [11 * w, -H + 8], [6 * w, -H + 5]], skin, null);
    // gold trim
    line(ctx, [-8 * w, -22 * k], [11 * w, -26 * k], 1.4, '#d4a73a');
    line(ctx, [0, -26 * k], [2, -H + 6], 0.9, '#d4a73a');
    // sash
    poly(ctx, [[-9 * w, -2], [10 * w, -2], [10 * w, 3], [-9 * w, 3]], '#d4a73a');
    ctx.restore();
    return;
  }

  // --- COAT / VEST
  if (o.coatStyle === 'open') {
    // jacket back + sleeve shoulders; shirt shows at the front strip
    poly(ctx, [[-10 * w, 3], [3 * w, 3], [4 * w, -H + 10], [3 * w, -H - 1], [-9 * w, -H - 1], [-14 * w, -44 * k], [-11 * w, -22 * k]], o.coat);
    // front panel (lapel side) so the coat reads as open
    poly(ctx, [[3 * w, 3], [8 * w, 3], [10 * w, -18 * k], [8 * w, -34 * k], [6 * w, -H + 4], [3 * w, -H - 1], [4 * w, -H + 10]], shade(o.coat, -0.08));
    // lapel
    poly(ctx, [[3 * w, -H - 1], [10 * w, -H - 1], [8 * w, -H + 14], [3 * w, -H + 8]], o.lapel);
    // shirt / tank V
    poly(ctx, [[9.5 * w, -H - 1], [11 * w, -H - 1], [10 * w, -H + 14], [8 * w, -H + 16]], shade(o.shirt, 0), null);
    if (o.tie) {
      poly(ctx, [[8 * w, -H + 4], [11 * w, -H + 4], [12 * w, -H + 26], [9 * w, -H + 30], [7 * w, -H + 26]], o.tie);
    }
    if (o.chain) {
      // open collar + gold chain
      poly(ctx, [[9 * w, -H - 1], [12 * w, -H - 1], [10 * w, -H + 18], [6 * w, -H + 10]], shade(pal.skin, -0.05), null);
      ctx.strokeStyle = o.chain; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(8 * w, -H + 2); ctx.quadraticCurveTo(11 * w, -H + 16, 6 * w, -H + 18); ctx.stroke();
      ctx.fillStyle = o.chain; ctx.beginPath(); ctx.arc(7.2 * w, -H + 19, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    if (o.stripes && !o.chain) {
      // track-jacket stripe and dragon patch
      line(ctx, [-3 * w, -H + 4], [-4 * w, -2], 1.2, shade(o.stripes, -0.05));
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(-6 * w, -H + 16, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (o.coatStyle === 'closed') {
    poly(ctx, outline, o.coat);
    if (o.vest) {
      // waistcoat V + shirt
      poly(ctx, [[7 * w, -H - 1], [12 * w, -H - 1], [11 * w, -H + 22], [8 * w, -H + 30]], o.shirt, null);
      poly(ctx, [[8 * w, -H + 22], [12 * w, -H + 18], [11.5 * w, -2 * k], [8 * w, -2 * k]], o.vest);
    } else {
      poly(ctx, [[7 * w, -H - 1], [11 * w, -H - 1], [10 * w, -H + 20], [8 * w, -H + 22]], o.shirt, null);
    }
    // lapels
    poly(ctx, [[4 * w, -H - 1], [10 * w, -H - 1], [8 * w, -H + 16], [3 * w, -H + 10]], o.lapel);
    // buttons
    ctx.fillStyle = shade(o.lapel === o.coat ? '#ffffff' : o.lapel, 0.3);
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(10 * w, -16 * k - i * 9, 1.1, 0, Math.PI * 2); ctx.fill(); }
    if (o.tie) poly(ctx, [[8.4 * w, -H + 6], [10.6 * w, -H + 6], [11 * w, -H + 22], [9.5 * w, -H + 25], [8 * w, -H + 22]], o.tie);
    if (o.bow) {
      poly(ctx, [[7 * w, -H + 2], [11 * w, -H + 5], [7 * w, -H + 8]], o.bow);
      poly(ctx, [[11 * w, -H + 2], [14 * w, -H + 1], [14 * w, -H + 9], [11 * w, -H + 8]], o.bow);
    }
    if (o.stripes && o.pinstripe) {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(outline[0][0], outline[0][1]);
      for (const p of outline) ctx.lineTo(p[0], p[1]);
      ctx.clip();
      for (let x = -14 * w; x < 14 * w; x += 4.2) line(ctx, [x, 3], [x + 1, -H - 1], 0.7, o.stripes);
      ctx.restore();
    }
    // pocket square
    ctx.fillStyle = o.tie || o.shirt;
    ctx.fillRect(1 * w, -H + 22, 4, 2.2);
  } else if (o.coatStyle === 'vest') {
    // shirt sleeves + waistcoat
    poly(ctx, [[-10 * w, 3], [10 * w, 3], [11.5 * w, -18 * k], [15 * w, -34 * k], [13 * w, -48 * k], [10 * w, -H - 1], [-9 * w, -H - 1], [-14 * w, -44 * k], [-11 * w, -22 * k]], o.shirt);
    // vest front panels
    poly(ctx, [[-10 * w, 3], [9 * w, 3], [11.5 * w, -18 * k], [14 * w, -34 * k], [10 * w, -H + 8], [3 * w, -H + 16], [-2 * w, -H + 4], [-9 * w, -H + 2], [-14 * w, -44 * k], [-11 * w, -22 * k]], o.coat);
    // collar & tie
    poly(ctx, [[6 * w, -H - 1], [11 * w, -H - 1], [9 * w, -H + 9], [5 * w, -H + 4]], o.shirt);
    if (o.tie) poly(ctx, [[7.6 * w, -H + 6], [10 * w, -H + 5], [11 * w, -H + 24], [9 * w, -H + 28], [7 * w, -H + 24]], o.tie);
    ctx.fillStyle = shade(o.coat, 0.35);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(4 * w, -H + 18 + i * 8, 1, 0, Math.PI * 2); ctx.fill(); }
    // watch strap hint on belt side
  }

  // belt
  poly(ctx, [[-10 * w, -4], [10.5 * w, -4], [11 * w, 3], [-10 * w, 3]], o.belt);
  ctx.fillStyle = o.belt === '#050505' ? '#a1a1aa' : '#fde68a';
  ctx.fillRect(7 * w, -3.4, 3.4, 5.4);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// TAILS (Black Tie) & GOWN (White Tie)
// ---------------------------------------------------------------------------------------------
function drawTails(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, opts: DrawOpts) {
  ctx.save();
  ctx.translate(sk.hip[0], sk.hip[1]);
  ctx.rotate(sk.lean * 0.6);
  const sway = opts.wind + Math.sin(opts.time * 0.15) * 2;
  poly(ctx, [[-4, -4], [-12, 6], [-20 + sway * 1.3, 34], [-17 + sway * 1.6, 56], [-9 + sway, 48], [-4 + sway * 0.6, 56], [2, 8]], shade(o.coat, -0.1));
  line(ctx, [-12, 8], [-18 + sway * 1.4, 52], 0.9, o.lapel);
  ctx.restore();
}

function drawGownBack(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, opts: DrawOpts) {
  const sway = opts.wind * 0.5;
  const hb: V = [sk.hip[0] - 12, sk.hip[1] - 3];
  const hf: V = [sk.hip[0] + 9, sk.hip[1] - 3];
  const gy = Math.max(sk.rAnkle[1], sk.fAnkle[1]) + 9;
  const xr = Math.min(sk.rAnkle[0], sk.fAnkle[0]) - 15 + sway;
  const xm = (sk.rAnkle[0] + sk.fAnkle[0]) / 2 + 8;
  const body = shade(o.coat, -0.07);
  ctx.beginPath();
  ctx.moveTo(hb[0], hb[1]);
  ctx.quadraticCurveTo(hb[0] - 16 + sway * 0.3, (hb[1] + gy) / 2, xr, gy);
  ctx.quadraticCurveTo((xr + xm) / 2, gy + 5, xm, gy - 1);
  ctx.lineTo(hf[0] - 1, hf[1] + 26);
  ctx.lineTo(hf[0], hf[1]);
  ctx.closePath();
  ctx.fillStyle = body; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = EDGE; ctx.stroke();
  // folds
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    line(ctx, [hb[0] + (hf[0] - hb[0]) * t, hb[1] + 4], [xr + (xm - xr) * t, gy - 3], 1.3, shade(o.coat, -0.2));
  }
  // lining along the slit + gold hem
  line(ctx, [hf[0] - 1, hf[1] + 26], [xm, gy - 1], 2.6, o.shirt);
  line(ctx, [xr, gy - 1], [xm, gy - 2], 1.8, '#d4a73a');
  ctx.fillStyle = '#d4a73a';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(xr + 10 + i * 9, gy - 8 - (i % 2) * 5, 1.4, 0, Math.PI * 2); ctx.fill(); }
}

function drawGownFront(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, opts: DrawOpts) {
  const sway = opts.wind * 0.4;
  const w0: V = [sk.hip[0] - 3, sk.hip[1] - 3];
  const w1: V = [sk.hip[0] + 15, sk.hip[1] - 2];
  const kx = sk.fKnee[0], ky = sk.fKnee[1];
  // short drape that leaves the thigh visible through the slit
  ctx.beginPath();
  ctx.moveTo(w0[0], w0[1]);
  ctx.lineTo(w1[0], w1[1]);
  ctx.quadraticCurveTo(w1[0] + 6 + sway, (w1[1] + ky) / 2 - 4, kx + 4 + sway, ky - 4);
  ctx.quadraticCurveTo((kx + sk.hip[0]) / 2 - 2, ky + 6, sk.hip[0] - 7, sk.hip[1] + 22);
  ctx.closePath();
  ctx.fillStyle = o.coat; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = EDGE; ctx.stroke();
  line(ctx, [sk.hip[0] - 7, sk.hip[1] + 22], [kx + 4 + sway, ky - 4], 1.8, '#d4a73a');
  line(ctx, [w0[0] + 3, w0[1] + 4], [sk.hip[0] - 3, sk.hip[1] + 16], 1.2, shade(o.coat, -0.2));
  line(ctx, [w0[0] + 9, w0[1] + 4], [sk.hip[0] + 5, sk.hip[1] + 16], 1.2, shade(o.coat, -0.2));
}

// ---------------------------------------------------------------------------------------------
// HEAD
// ---------------------------------------------------------------------------------------------
function drawHead(ctx: CanvasRenderingContext2D, sk: Skeleton, o: Outfit, pal: CharacterColorPalette, b: Build, opts: DrawOpts) {
  ctx.save();
  ctx.translate(sk.headC[0], sk.headC[1]);
  ctx.rotate(sk.headAng);
  const k = (b.female ? 0.94 : (b.w > 1.2 ? 1.06 : 1)) * 1.12;
  ctx.scale(k, k);
  const skin = pal.skin;
  const skinShade = shade(skin, -0.16);
  const hair = pal.hair;
  const mood = sk.pose.face;
  const wind = opts.wind;

  // ----- back hair (drawn behind skull)
  if (o.hair === 'ponytail') {
    const sw = wind * 0.9 + Math.sin(opts.time * 0.16) * 3 + sk.pose.lean * -0.2;
    const pts: V[] = [[-9, -9], [-17 + sw * 0.3, -9], [-24 + sw * 0.7, 0], [-26 + sw, 13], [-22 + sw * 1.2, 26], [-17 + sw * 1.1, 34]];
    for (let i = 0; i < pts.length - 1; i++) {
      const r = 5.6 - i * 0.7;
      tube(ctx, pts[i], pts[i + 1], r, Math.max(1.4, r - 0.8), hair, shade(hair, -0.6));
    }
    line(ctx, [-18 + sw * 0.4, -8], [-24 + sw * 0.75, 6], 1, shade(hair, 0.28));
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-11, -8, 2, 0, Math.PI * 2); ctx.fill();
  } else if (o.hair === 'updo') {
    ctx.fillStyle = EDGE; ctx.beginPath(); ctx.arc(-9, -12, 8.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(-9, -12, 7.1, 0, Math.PI * 2); ctx.fill();
    line(ctx, [-13, -14], [-6, -10], 0.9, shade(hair, 0.3));
  }

  // ----- neck
  tube(ctx, [-2, 6], [-3, 18], 4.6 * b.w ** 0.5, 5 * b.w ** 0.5, shade(skin, -0.1));

  // ----- skull + jaw
  const jaw = b.w > 1.2 ? 1.18 : 1;
  poly(ctx, [[-10, -6], [-4, -13], [6, -13], [12, -6], [12.5, 2], [10 * jaw, 9], [6 * jaw, 14.5], [-1, 13.5], [-9, 8], [-12, 0]], skin);
  // ear
  ctx.fillStyle = skinShade; ctx.beginPath(); ctx.arc(-4.5, 2, 2.6, 0, Math.PI * 2); ctx.fill();
  // cheek shade
  poly(ctx, [[-9, 4], [-1, 10], [-1, 13.5], [-9, 8]], skinShade, null);
  if (o.stubble) { ctx.fillStyle = 'rgba(40,30,30,0.32)'; poly(ctx, [[0, 8], [10 * jaw, 8], [6 * jaw, 14.5], [-1, 13.5]], 'rgba(50,40,40,0.35)', null); }

  // ----- nose
  poly(ctx, [[11.5, 0.5], [15, 5.5], [11, 6]], shade(skin, -0.08), null);

  // ----- eye / brow / mouth by mood
  const ex = 6.5, ey = -1.5;
  const browCol = shade(hair, -0.1);
  if (mood === 'hurt') {
    line(ctx, [ex - 2, ey], [ex + 3.4, ey + 1.2], 1.5, '#0b0a10');
    line(ctx, [ex - 2.4, ey - 4.2], [ex + 4, ey - 2.2], 1.5, browCol);
    ctx.fillStyle = '#4a0d12'; ctx.fillRect(7, 8.5, 4.4, 3.6);
  } else if (mood === 'dizzy') {
    ctx.strokeStyle = '#0b0a10'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ex + 1, ey, 2.6, 0, Math.PI * 1.6); ctx.stroke();
    line(ctx, [ex - 2.4, ey - 4.4], [ex + 4, ey - 4.4], 1.4, browCol);
    line(ctx, [7, 10], [11, 9], 1.2, '#4a0d12');
  } else {
    ctx.fillStyle = '#fafafa'; ctx.fillRect(ex - 2.6, ey - 2.2, 7, 4.2);
    ctx.fillStyle = b.female ? '#3b82f6' : '#1c1917'; ctx.fillRect(ex + 0.4, ey - 2, 3.6, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ex + 2.4, ey - 1.6, 1.2, 1.2);
    // upper lid line
    line(ctx, [ex - 3, ey - 2.3], [ex + 4.6, ey - 2.3], 1.2, '#0b0a10');
    const angry = mood === 'shout' || mood === 'grit' ? 1.4 : 0.4;
    line(ctx, [ex - 3.2, ey - 5.6 - angry * 0.3], [ex + 5, ey - 3.8 + angry], b.female ? 1.2 : 1.8, browCol);
    if (b.female) { line(ctx, [ex - 3, ey + 2.2], [ex + 2, ey + 2.4], 0.8, '#7f1d1d'); }
    if (mood === 'shout') {
      ctx.fillStyle = '#4a0d12'; ctx.fillRect(6.4, 8, 5.2, 4.4);
      ctx.fillStyle = '#fafafa'; ctx.fillRect(6.4, 8, 5.2, 1.4);
    } else if (mood === 'grit') {
      ctx.fillStyle = '#fafafa'; ctx.fillRect(6.6, 8.6, 5, 2.4);
      line(ctx, [6.6, 9.8], [11.6, 9.8], 0.6, '#52525b');
    } else if (mood === 'smile') {
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(9, 7.5, 3, 0.1, Math.PI * 0.8); ctx.stroke();
    } else {
      line(ctx, [7, 9.6], [11.2, 9.2], 1.2, b.female ? '#be123c' : '#7f1d1d');
    }
  }
  if (o.stubble) line(ctx, [4, 12.6], [10, 9.4], 0.0, 'transparent');

  // ----- front hair
  drawHairFront(ctx, o, hair, mood, wind, opts.time, b);

  ctx.restore();
}

function drawHairFront(ctx: CanvasRenderingContext2D, o: Outfit, hair: string, mood: string, wind: number, time: number, b: Build) {
  const hl = shade(hair, 0.28);
  const edge = shade(hair, -0.65);
  const sway = Math.sin(time * 0.14) * 0.8 + wind * 0.08;
  switch (o.hair) {
    case 'spiky':
      poly(ctx, [[-13, 3], [-19, -4], [-15, -8], [-23, -14 + sway], [-12, -13], [-15, -23 + sway], [-5, -18], [-4, -29 + sway], [3, -19], [8, -27 + sway], [10, -15], [17, -19 + sway], [14, -8], [15, -3], [10, -7], [5, -4], [3, -10], [-3, -8], [-8, -3], [-9, 4]], hair, edge);
      line(ctx, [-4, -22], [-1, -14], 1, hl); line(ctx, [6, -22], [7, -15], 1, hl);
      break;
    case 'ponytail':
      poly(ctx, [[-12, 2], [-14, -9], [-7, -16], [4, -16], [12, -9], [13.5, 0], [10, -4], [6, -8], [1, -7], [-3, -2], [-6, 4], [-9, 6]], hair, edge);
      poly(ctx, [[8, -12], [14, -4], [12, 4], [10, -3]], hair, edge); // side bang
      line(ctx, [-6, -13], [4, -14], 1, hl);
      break;
    case 'slick':
      poly(ctx, [[-12, 4], [-14, -7], [-8, -15], [3, -17], [11, -12], [12.5, -5], [8, -9], [1, -10], [-5, -6], [-8, 2]], hair, edge);
      line(ctx, [-4, -14], [6, -13], 1, hl);
      break;
    case 'swept':
      poly(ctx, [[-12, 6], [-14, -7], [-8, -16], [4, -19], [13, -13], [13, -6], [8, -10], [1, -10], [-4, -4], [-6, 8], [-9, 9]], hair, edge);
      poly(ctx, [[-1, -2], [3, 0], [2, 9], [-1, 8]], hair, null); // sideburn
      line(ctx, [-4, -15], [8, -14], 1, hl);
      // heavy brow
      line(ctx, [3, -5.4], [11.5, -3.6], 2.2, shade(hair, -0.2));
      break;
    case 'fringe':
      poly(ctx, [[-12, 6], [-14, -8], [-7, -17], [5, -19], [13, -12], [14, -4], [11, -2], [12, 4], [8, -3], [6, -9], [2, -4], [-1, -10], [-4, -2], [-7, 4], [-8, 9]], hair, edge);
      line(ctx, [-4, -15], [7, -14], 1, hl);
      break;
    case 'updo':
      poly(ctx, [[-11, 2], [-13, -8], [-6, -15], [4, -15], [12, -9], [12.5, -2], [8, -8], [2, -8], [-3, -3], [-6, 3]], hair, edge);
      // tiara
      poly(ctx, [[-3, -15], [-1, -22], [1, -16], [3, -24], [5, -16], [7, -21], [8, -14]], '#e5e7eb', EDGE);
      ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(3, -19, 1.7, 0, Math.PI * 2); ctx.fill();
      break;
    case 'pompadour':
      poly(ctx, [[-12, 5], [-14, -7], [-9, -15], [-1, -23 + sway], [9, -24 + sway], [16, -18], [14, -11], [12.5, -5], [8, -9], [1, -9], [-5, -5], [-8, 3]], hair, edge);
      line(ctx, [-2, -20], [10, -20], 1.2, hl); line(ctx, [-4, -16], [8, -16], 0.8, hl);
      break;
  }
}
