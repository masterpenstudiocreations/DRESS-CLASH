import { ActiveFighter } from '../types/fighter';
import { buildFor, drawFighterRig, shade } from './fighterArt';
import { poseForFighter, solve } from './fighterRig';

// Pixel-art pipeline geometry. The rig is drawn at 1x into a HI buffer, downsampled by PX into a
// LO buffer (so it reads like a 2x Neo Geo sprite), thresholded, outlined and blitted back up.
const PX = 2;
const HI_W = 380, HI_H = 300;          // rig space buffer
const HI_OX = 190, HI_OY = 256;        // ground-contact origin inside HI
const LO_W = HI_W / PX, LO_H = HI_H / PX;

export class CharacterRenderer {
  /**
   * true  -> use the static illustrated PNGs (old behaviour, transform-animated)
   * false -> use the animated skeletal pixel-art rig (default)
   */
  public static useIllustratedSprites = false;

  // Pre-cached high-resolution Masterpiece transparent sprites
  private static imageCache = new Map<string, HTMLImageElement>();

  private static hi: HTMLCanvasElement | null = null;
  private static lo: HTMLCanvasElement | null = null;
  private static ghost: HTMLCanvasElement | null = null;

  // Render high-fidelity, masterpiece-quality fighter with Arc System Works / SNK aesthetic
  // 100% transparent cutout - ZERO rectangular box, ZERO background interference
  public static render(
    ctx: CanvasRenderingContext2D,
    fighter: ActiveFighter,
    showHitboxes: boolean = false,
    groundY: number = 420
  ) {
    ctx.save();

    // 1. Dynamic Contact Shadow on the Floor
    this.drawContactShadow(ctx, fighter, groundY);

    const legacy = this.useIllustratedSprites && !!fighter.definition.spriteUrl;

    // 2. Transform to Fighter Space (Origin at ground contact point, snapped to the sprite pixel grid)
    ctx.translate(Math.round(fighter.x / PX) * PX, Math.round((groundY - fighter.y) / PX) * PX);
    if (fighter.facing === -1) {
      ctx.scale(-1, 1);
    }

    // 3. MAX Mode Fiery Kinetic Energy Aura
    if (fighter.inMaxMode) {
      this.drawMaxAura(ctx, fighter);
    }

    // 4. Draw Avatar
    let rendered = false;
    if (legacy) {
      rendered = this.drawMasterpieceSprite(ctx, fighter);
    }
    if (!rendered) {
      this.drawRigFighter(ctx, fighter);
    }

    // 6. Optional Hitbox & Hurtbox Overlay for Training Lab
    if (showHitboxes) {
      this.drawDebugBoxes(ctx, fighter);
    }

    ctx.restore();
  }

  // --- CONTACT SHADOW ON THE STAGE FLOOR ---
  private static drawContactShadow(ctx: CanvasRenderingContext2D, fighter: ActiveFighter, groundY: number) {
    ctx.save();
    const shadowY = groundY + 2;
    const airHeight = fighter.y;
    const scale = Math.max(0.25, 1 - airHeight / 260);
    const alpha = Math.max(0.1, 0.55 - airHeight / 300);

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(fighter.x, shadowY, 38 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic ground friction dust when dashing, rolling, or landing
    if ((fighter.state === 'DASH_FWD' || fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') && fighter.stateFrame % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      const dustX = fighter.x - fighter.facing * (24 + Math.random() * 14);
      ctx.arc(dustX, groundY - 2, 3 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- MAX MODE AURA ---
  private static drawMaxAura(ctx: CanvasRenderingContext2D, _fighter: ActiveFighter) {
    const time = Date.now() * 0.009;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const numFlames = 12;
    for (let i = 0; i < numFlames; i++) {
      const angle = (i / numFlames) * Math.PI * 2 + Math.sin(time + i);
      const rad = 46 + Math.sin(time * 2 + i) * 14;
      const fx = Math.cos(angle) * rad;
      const fy = -78 + Math.sin(angle) * 65;

      const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 36);
      grad.addColorStop(0, 'rgba(255, 245, 120, 0.85)');
      grad.addColorStop(0.35, 'rgba(249, 115, 22, 0.5)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- NEO GEO STYLE SKELETAL PIXEL-ART FIGHTER ---
  private static getBuffers() {
    if (!this.hi) {
      this.hi = document.createElement('canvas');
      this.hi.width = HI_W; this.hi.height = HI_H;
      this.lo = document.createElement('canvas');
      this.lo.width = LO_W; this.lo.height = LO_H;
      this.ghost = document.createElement('canvas');
      this.ghost.width = LO_W; this.ghost.height = LO_H;
    }
    return { hi: this.hi!, lo: this.lo!, ghost: this.ghost! };
  }

  private static drawRigFighter(ctx: CanvasRenderingContext2D, fighter: ActiveFighter) {
    const { hi, lo, ghost } = this.getBuffers();
    const hctx = hi.getContext('2d')!;
    const lctx = lo.getContext('2d', { willReadFrequently: true })!;
    const def = fighter.definition;
    const pal = fighter.paletteIndex === 0 ? def.palette : def.alternatePalette;
    const build = buildFor(def.dressCode);

    // ---- 1. pose + skeleton
    const pose = poseForFighter(fighter, def.dressCode === 'Casual');
    const sk = solve(pose, build);
    const localVx = fighter.vx * fighter.facing;
    const wind = Math.max(-14, Math.min(14, -localVx * 1.6 + (fighter.state === 'ATTACK' ? -4 : 0)));

    // ---- 2. rig into HI buffer
    hctx.setTransform(1, 0, 0, 1, 0, 0);
    hctx.clearRect(0, 0, HI_W, HI_H);
    hctx.translate(HI_OX, HI_OY);
    drawFighterRig(hctx, sk, def.dressCode, pal, { time: fighter.stateFrame, wind, speed: Math.min(1, Math.abs(localVx) / 10) });
    hctx.setTransform(1, 0, 0, 1, 0, 0);

    // ---- 3. cel lighting (stage-style top light, hard bottom shadow)
    hctx.globalCompositeOperation = 'source-atop';
    const lg = hctx.createLinearGradient(0, HI_OY - 230, 0, HI_OY + 4);
    lg.addColorStop(0, 'rgba(255,244,225,0.20)');
    lg.addColorStop(0.45, 'rgba(255,255,255,0)');
    lg.addColorStop(0.75, 'rgba(8,10,40,0.16)');
    lg.addColorStop(1, 'rgba(8,10,40,0.34)');
    hctx.fillStyle = lg;
    hctx.fillRect(0, 0, HI_W, HI_H);
    // cool rim from behind the fighter
    const rg = hctx.createLinearGradient(HI_OX - 60, 0, HI_OX + 60, 0);
    rg.addColorStop(0, 'rgba(70,120,255,0.20)');
    rg.addColorStop(0.35, 'rgba(70,120,255,0)');
    rg.addColorStop(1, 'rgba(255,210,150,0.10)');
    hctx.fillStyle = rg;
    hctx.fillRect(0, 0, HI_W, HI_H);

    if (fighter.inMaxMode) {
      hctx.fillStyle = 'rgba(255,120,20,0.20)';
      hctx.fillRect(0, 0, HI_W, HI_H);
    }
    if ((fighter.state === 'HIT' || fighter.state === 'HIT_AIR') && fighter.stateFrame < 7) {
      hctx.fillStyle = fighter.stateFrame < 3 ? 'rgba(255,255,255,0.78)' : 'rgba(255,70,70,0.28)';
      hctx.fillRect(0, 0, HI_W, HI_H);
    }
    if (fighter.state === 'GUARD_CRUSH' && fighter.stateFrame % 6 < 3) {
      hctx.fillStyle = 'rgba(255,40,40,0.3)';
      hctx.fillRect(0, 0, HI_W, HI_H);
    }
    if (fighter.invincibleTimer > 0 && fighter.state === 'WAKE_UP' && fighter.stateFrame % 4 < 2) {
      hctx.fillStyle = 'rgba(255,255,255,0.35)';
      hctx.fillRect(0, 0, HI_W, HI_H);
    }
    hctx.globalCompositeOperation = 'source-over';

    // ---- 4. downsample -> threshold -> quantize -> outline + rim light
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.clearRect(0, 0, LO_W, LO_H);
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = 'high';
    lctx.drawImage(hi, 0, 0, LO_W, LO_H);

    const img = lctx.getImageData(0, 0, LO_W, LO_H);
    const d = img.data;
    const src = new Uint8ClampedArray(d);
    const solid = new Uint8Array(LO_W * LO_H);
    for (let i = 0; i < solid.length; i++) {
      solid[i] = src[i * 4 + 3] >= 110 ? 1 : 0;
    }
    const Q = 18;
    for (let y = 0; y < LO_H; y++) {
      for (let x = 0; x < LO_W; x++) {
        const i = y * LO_W + x;
        const o = i * 4;
        if (solid[i]) {
          let r = Math.round(src[o] / Q) * Q;
          let g = Math.round(src[o + 1] / Q) * Q;
          let b = Math.round(src[o + 2] / Q) * Q;
          const up = y > 0 ? solid[i - LO_W] : 0;
          const lf = x > 0 ? solid[i - 1] : 0;
          const dn = y < LO_H - 1 ? solid[i + LO_W] : 0;
          const rt = x < LO_W - 1 ? solid[i + 1] : 0;
          if (!up || !lf) { r += 26; g += 26; b += 30; }       // top-left rim light
          else if (!dn || !rt) { r -= 22; g -= 22; b -= 16; }  // bottom-right core shadow
          d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
        } else {
          const near =
            (y > 0 && solid[i - LO_W]) || (y < LO_H - 1 && solid[i + LO_W]) ||
            (x > 0 && solid[i - 1]) || (x < LO_W - 1 && solid[i + 1]);
          if (near) { d[o] = 9; d[o + 1] = 7; d[o + 2] = 18; d[o + 3] = 255; }
          else d[o + 3] = 0;
        }
      }
    }
    lctx.putImageData(img, 0, 0);

    // ---- 5. afterimages (KOF dash / roll / MAX trails)
    const trail = fighter.state === 'DASH_FWD' || fighter.state === 'DASH_BACK' || fighter.inMaxMode ||
      fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK';
    ctx.imageSmoothingEnabled = false;
    if (trail) {
      const gctx = ghost.getContext('2d')!;
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, LO_W, LO_H);
      gctx.globalCompositeOperation = 'source-over';
      gctx.drawImage(lo, 0, 0);
      gctx.globalCompositeOperation = 'source-in';
      gctx.fillStyle = fighter.inMaxMode ? '#ff8a1f' : '#38bdf8';
      gctx.fillRect(0, 0, LO_W, LO_H);
      gctx.globalCompositeOperation = 'source-over';
      const step = Math.max(10, Math.min(34, Math.abs(fighter.vx) * 3.4 + 10));
      for (let n = 3; n >= 1; n--) {
        ctx.save();
        ctx.globalAlpha = 0.16 + (4 - n) * 0.07;
        ctx.drawImage(ghost, -HI_OX - Math.round(step * n / PX) * PX, -HI_OY, HI_W, HI_H);
        ctx.restore();
      }
    }

    // ---- 6. blit sprite up with nearest-neighbour
    ctx.drawImage(lo, -HI_OX, -HI_OY, HI_W, HI_H);

    // ---- 7. strike effects drawn crisp on top, anchored to the real striking limb
    if (fighter.state === 'ATTACK' && fighter.currentMove && fighter.movePhase === 'ACTIVE') {
      const m = fighter.currentMove;
      const id = m.id;
      let type: 'punch' | 'kick' | 'slash' | 'counter' = 'counter';
      if (id.includes('5a') || id.includes('5c')) type = 'punch';
      else if (id.includes('5b') || id.includes('5d') || id.includes('_k')) type = 'kick';
      else if (id.includes('2d')) type = 'slash';
      const tips = type === 'punch' || id.includes('qcf_p') || id.includes('hcf') || id.includes('super') || id.includes('max')
        ? [sk.fHand, sk.rHand] : [sk.fAnkle, sk.rAnkle, sk.fHand, sk.rHand];
      let tip = tips[0];
      for (const t of tips) if (t[0] > tip[0]) tip = t;
      this.drawSwoosh(ctx, tip, type, fighter.inMaxMode, fighter.definition.dressCode, fighter.moveFrameCounter);
      if (id.includes('super') || id.includes('max') || id.includes('qcf_p')) {
        this.drawMartialStrikeFX(ctx, (tip[0] + 22) * 2, tip[1], 'counter', fighter.inMaxMode, fighter.definition.dressCode);
      }
    }
    if (fighter.state === 'BLOCK_STAND') this.drawGuardEnergyShield(ctx, 46, -118, 44);
    else if (fighter.state === 'BLOCK_CROUCH') this.drawGuardEnergyShield(ctx, 44, -66, 36);
    if (fighter.state === 'GUARD_CRUSH') this.drawStunStars(ctx, fighter, sk.headC);
  }

  private static styleColor(dress: string, max: boolean): string {
    switch (dress) {
      case 'Casual': return max ? '#ff2a4d' : '#fbbf24';
      case 'Smart Casual': return max ? '#ff3db8' : '#67e8f9';
      case 'Semi Formal': return max ? '#fb923c' : '#e2e8f0';
      case 'Coctel': return max ? '#34d399' : '#6ee7b7';
      case 'Formal': return max ? '#ff5a1f' : '#facc15';
      case 'Black Tie': return max ? '#d946ef' : '#f1f5f9';
      case 'White Tie': return max ? '#f472b6' : '#60a5fa';
      default: return max ? '#ff0055' : '#00e5ff';
    }
  }

  // crescent motion trail ending at the striking limb
  private static drawSwoosh(
    ctx: CanvasRenderingContext2D, tip: [number, number], type: string, max: boolean, dress: string, frame: number
  ) {
    const col = this.styleColor(dress, max);
    const kick = type === 'kick' || type === 'slash';
    const len = kick ? 74 : 58;
    const tail: [number, number] = [tip[0] - len, tip[1] + (kick ? 34 : 14)];
    const ctrl: [number, number] = [tip[0] - len * 0.35, tip[1] - (kick ? 36 : 22)];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.max(0.35, 1 - frame * 0.22);
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, c, a] of [[13, col, 0.35], [7, col, 0.8], [3, '#ffffff', 1]] as [number, string, number][]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.globalAlpha = a * Math.max(0.35, 1 - frame * 0.22);
      ctx.beginPath();
      ctx.moveTo(tail[0], tail[1]);
      ctx.quadraticCurveTo(ctrl[0], ctrl[1], tip[0] + 4, tip[1]);
      ctx.stroke();
    }
    // speed lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.7;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(tip[0] - 30, tip[1] + i * 14);
      ctx.lineTo(tip[0] - 66, tip[1] + i * 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  // dizzy stars orbiting the head
  private static drawStunStars(ctx: CanvasRenderingContext2D, fighter: ActiveFighter, head: [number, number]) {
    ctx.save();
    const t = fighter.stateFrame * 0.2;
    for (let i = 0; i < 4; i++) {
      const a = t + (i / 4) * Math.PI * 2;
      const sx = head[0] + Math.cos(a) * 22;
      const sy = head[1] - 34 + Math.sin(a) * 6;
      ctx.fillStyle = i % 2 ? '#fde047' : '#ffffff';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 2.6 : 6;
        const aa = (k / 10) * Math.PI * 2 - Math.PI / 2;
        ctx[k ? 'lineTo' : 'moveTo'](sx + Math.cos(aa) * r, sy + Math.sin(aa) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- MASTERPIECE HIGH-DEFINITION SPRITE RENDERER ---
  // High-Resolution Arc System Works / SNK Character Sprites with 100% Alpha Transparency
  private static drawMasterpieceSprite(ctx: CanvasRenderingContext2D, fighter: ActiveFighter): boolean {
    const url = fighter.definition.spriteUrl;
    if (!url) return false;

    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      this.imageCache.set(url, img);
    }

    if (!img.complete || img.naturalWidth === 0) {
      return false; // Still loading, fallback to vector body
    }

    ctx.save();

    const dress = fighter.definition.dressCode;
    const f = fighter.stateFrame;
    const isHeavyweight = dress === 'Formal';
    const isFemale = dress === 'Smart Casual' || dress === 'White Tie';

    // Scaled height on fighting arena: ~220px tall
    const targetH = isHeavyweight ? 236 : (isFemale ? 216 : 222);
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;
    const dx = -targetW * 0.5;
    const dy = -targetH;

    let strikeFX: { type: 'punch' | 'kick' | 'slash' | 'counter'; reach: number; y: number } | null = null;

    // MODERN 2D FIGHTING GAME DYNAMIC ANIMATION TRANSFORMS
    if (fighter.state === 'IDLE') {
      // Natural athletic breathing pulse
      const breath = Math.sin(f * 0.14) * 0.024;
      ctx.scale(1 - breath * 0.35, 1 + breath);

      if (dress === 'Casual') {
        // Ren Cruz Kickboxing spring bounce
        const bounce = Math.abs(Math.sin(f * 0.22)) * 6;
        ctx.translate(0, -bounce);
      } else if (dress === 'Coctel') {
        // Mateo Valencia Capoeira Ginga rhythm sway
        const gingaSway = Math.sin(f * 0.16) * 0.038;
        ctx.rotate(gingaSway);
        ctx.translate(Math.sin(f * 0.16) * 4, 0);
      } else if (dress === 'Formal') {
        // Dmitri Peek-a-boo bob
        const bob = Math.sin(f * 0.16) * 3;
        ctx.translate(0, bob);
      }
    } else if (fighter.state === 'WALK_FWD' || fighter.state === 'WALK_BACK') {
      const step = Math.sin(f * 0.24);
      ctx.translate(0, -Math.abs(step) * 5.5);
      ctx.rotate(step * 0.035);
    } else if (fighter.state === 'DASH_FWD') {
      // Forward aerodynamic sprint
      ctx.translate(16, 8);
      ctx.rotate(0.24);
      ctx.scale(1.06, 0.94);
    } else if (fighter.state === 'DASH_BACK') {
      // Defensive hop retreat
      ctx.translate(-14, -4);
      ctx.rotate(-0.16);
    } else if (fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') {
      // KOF 2002 EMERGENCY ROLL: 360° tactical roll along floor under high attacks
      const dir = fighter.state === 'ROLL_FWD' ? 1 : -1;
      ctx.translate(0, -targetH * 0.35);
      ctx.rotate(f * 0.45 * dir);
      ctx.scale(0.85, 0.85);
    } else if (fighter.state === 'CROUCH') {
      // Low tactical duck compression
      ctx.scale(1.18, 0.70);
      ctx.translate(0, 16);
    } else if (fighter.state === 'BLOCK_STAND') {
      // Martial arts cover guard brace
      ctx.translate(-8, 2);
      ctx.rotate(-0.08);
      this.drawGuardEnergyShield(ctx, 30, -targetH * 0.55, 48);
    } else if (fighter.state === 'BLOCK_CROUCH') {
      // Low tactical cross-guard
      ctx.scale(1.18, 0.70);
      ctx.translate(-4, 18);
      this.drawGuardEnergyShield(ctx, 26, -targetH * 0.32, 38);
    } else if (fighter.state === 'JUMPING') {
      // Airborne vertical elongation
      ctx.scale(0.92, 1.12);
    } else if (fighter.state === 'GUARD_CRUSH') {
      // Stunned guard broken
      ctx.rotate(-0.4);
      ctx.translate(-18, 12);
      // Electrical stun arcs
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, -targetH - 12); ctx.lineTo(14, -targetH - 18);
      ctx.lineTo(-8, -targetH - 24); ctx.lineTo(18, -targetH - 30);
      ctx.stroke();
    } else if (fighter.state === 'HIT' || fighter.state === 'HIT_AIR') {
      // Biomechanical hit recoil shudder
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      ctx.rotate(-0.25);
    } else if (fighter.state === 'DOWN') {
      // Knockdown crumple to the canvas
      ctx.translate(-targetH * 0.35, 20);
      ctx.rotate(-Math.PI * 0.46);
    } else if (fighter.state === 'ATTACK' && fighter.currentMove) {
      const move = fighter.currentMove;
      const reach = move.reach || 90;
      const isActive = fighter.movePhase === 'ACTIVE';
      const isStartup = fighter.movePhase === 'STARTUP';

      if (isStartup) {
        // Anticipation coil
        ctx.translate(-10, 2);
        ctx.scale(0.96, 1.04);
      } else if (isActive) {
        // Explosive forward extension
        ctx.translate(reach * 0.38, 0);
        ctx.scale(1.22, 0.92);
      }

      const targetY = move.height === 'head' ? -targetH * 0.72 : (move.height === 'low' ? -targetH * 0.2 : -targetH * 0.52);

      if (move.id.includes('5a') || move.id.includes('5c')) {
        strikeFX = { type: 'punch', reach, y: targetY };
      } else if (move.id.includes('5b') || move.id.includes('5d')) {
        strikeFX = { type: 'kick', reach, y: targetY };
      } else if (move.id.includes('2d')) {
        // Low sweep
        ctx.scale(1.25, 0.65);
        ctx.translate(0, 18);
        strikeFX = { type: 'slash', reach, y: -10 };
      } else if (move.id.includes('dp_k')) {
        // Rising dragon jump
        ctx.translate(0, -45);
        ctx.scale(0.9, 1.2);
        strikeFX = { type: 'kick', reach, y: targetY };
      } else {
        strikeFX = { type: 'counter', reach, y: targetY };
      }
    }

    // DRAW THE MASTERPIECE TRANSPARENT SPRITE
    ctx.save();
    // Drop shadow
    ctx.shadowColor = fighter.inMaxMode ? '#fbbf24' : 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = fighter.inMaxMode ? 24 : 12;

    ctx.drawImage(img, dx, dy, targetW, targetH);
    ctx.restore();

    // HIT FLASH SILHOUETTE (Red hit flash on impact)
    if (fighter.state === 'HIT' || fighter.state === 'HIT_AIR') {
      ctx.save();
      ctx.drawImage(img, dx, dy, targetW, targetH);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.fillRect(dx, dy, targetW, targetH);
      ctx.restore();
    }

    // MARTIAL ARTS STRIKE EFFECTS (ENERGY TRAILS & IMPACT SHOCKWAVES)
    if (strikeFX && fighter.state === 'ATTACK' && fighter.movePhase === 'ACTIVE') {
      this.drawMartialStrikeFX(ctx, strikeFX.reach, strikeFX.y, strikeFX.type, fighter.inMaxMode, dress);
    }

    ctx.restore();
    return true;
  }

  // --- GUARD SHIELD RIPPLE (KOF STAND & CROUCH BLOCK) ---
  private static drawGuardEnergyShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    // Inner refractive deflection arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x - 5, y, radius * 0.8, -Math.PI * 0.36, Math.PI * 0.36);
    ctx.stroke();

    // Deflection sparks
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 0.7 - Math.PI * 0.35;
      const sx = x + Math.cos(a) * radius;
      const sy = y + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }


  // --- MARTIAL ARTS STRIKE IMPACT EFFECTS ---
  private static drawMartialStrikeFX(
    ctx: CanvasRenderingContext2D,
    reach: number,
    targetY: number,
    type: 'punch' | 'kick' | 'slash' | 'counter',
    isMaxMode: boolean,
    dress: string
  ) {
    ctx.save();
    let fxColor = isMaxMode ? '#ff0055' : '#00e5ff';
    if (dress === 'Casual') fxColor = isMaxMode ? '#ff0044' : '#f59e0b';
    else if (dress === 'Smart Casual') fxColor = isMaxMode ? '#ff00a0' : '#00e5ff';
    else if (dress === 'Coctel') fxColor = isMaxMode ? '#10b981' : '#34d399';
    else if (dress === 'Formal') fxColor = isMaxMode ? '#ff3300' : '#eab308';
    else if (dress === 'Black Tie') fxColor = isMaxMode ? '#c026d3' : '#e2e8f0';
    else if (dress === 'White Tie') fxColor = isMaxMode ? '#ec4899' : '#3b82f6';

    ctx.strokeStyle = fxColor;
    ctx.shadowColor = fxColor;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (type === 'punch') {
      ctx.beginPath();
      ctx.arc(reach * 0.78, targetY, reach * 0.42, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(reach * 0.35, targetY - 12); ctx.lineTo(reach + 20, targetY - 12);
      ctx.moveTo(reach * 0.45, targetY + 12); ctx.lineTo(reach + 15, targetY + 12);
      ctx.stroke();
    } else if (type === 'kick') {
      ctx.beginPath();
      ctx.arc(reach * 0.62, targetY + 18, reach * 0.58, -Math.PI * 0.62, Math.PI * 0.12);
      ctx.stroke();
    } else if (type === 'slash') {
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(reach + 24, 0);
      ctx.stroke();
    } else if (type === 'counter') {
      ctx.beginPath();
      ctx.arc(reach * 0.5, targetY, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- HITBOX / HURTBOX DEBUG DISPLAY FOR TRAINING LAB ---
  private static drawDebugBoxes(ctx: CanvasRenderingContext2D, fighter: ActiveFighter) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(-26, -150, 52, 150);

    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(-18, -130, 36, 130);

    if (fighter.state === 'ATTACK' && fighter.movePhase === 'ACTIVE' && fighter.currentMove) {
      const reach = fighter.currentMove.reach || 90;
      const yT = fighter.currentMove.height === 'head' ? -135 : (fighter.currentMove.height === 'low' ? -38 : -100);
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(15, yT, reach - 10, 50);
      ctx.strokeRect(15, yT, reach - 10, 50);
    }
  }

  // --- EXPLOSIVE HIT SPARKS ---
  public static renderHitSpark(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isCounter: boolean = false,
    isSuper: boolean = false
  ) {
    ctx.save();
    ctx.translate(x, y);

    const outerRadius = isSuper ? 68 : (isCounter ? 50 : 34);
    const spikes = isSuper ? 12 : 8;

    ctx.fillStyle = isSuper ? '#facc15' : (isCounter ? '#ef4444' : '#ffffff');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : outerRadius * 0.35;
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
