import { ActiveFighter } from '../types/fighter';

export class CharacterRenderer {
  // Pre-cached high-resolution Masterpiece transparent sprites
  private static imageCache = new Map<string, HTMLImageElement>();

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

    // 2. Dash / Roll Afterimages (KOF 2002 Ghost Trails)
    if (fighter.state === 'DASH_FWD' || fighter.inMaxMode || fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') {
      this.drawAfterimage(ctx, fighter, groundY);
    }

    // 3. Transform to Fighter Space (Origin at ground contact point)
    ctx.translate(fighter.x, groundY - fighter.y);
    if (fighter.facing === -1) {
      ctx.scale(-1, 1);
    }

    // 4. MAX Mode Fiery Kinetic Energy Aura
    if (fighter.inMaxMode) {
      this.drawMaxAura(ctx, fighter);
    }

    // 5. Draw Avatar: Prefer Masterpiece High-Definition Transparent Sprite; Fallback to Vector Body while loading
    let rendered = false;
    if (fighter.definition.spriteUrl) {
      rendered = this.drawMasterpieceSprite(ctx, fighter);
    }
    if (!rendered) {
      this.drawDetailedFighterBody(ctx, fighter);
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

  // --- AFTERIMAGE GHOST TRAIL (KOF 2002 DASH & EVASIVE ROLL) ---
  private static drawAfterimage(ctx: CanvasRenderingContext2D, fighter: ActiveFighter, groundY: number) {
    ctx.save();
    ctx.translate(fighter.x - fighter.vx * 2.8, groundY - fighter.y);
    if (fighter.facing === -1) {
      ctx.scale(-1, 1);
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = fighter.inMaxMode ? '#f59e0b' : '#38bdf8';

    // Athletic full-body silhouette in motion
    if (fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') {
      ctx.beginPath();
      ctx.arc(0, -45, 34, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -78, 28, 72, 0, 0, Math.PI * 2);
      ctx.arc(4, -138, 15, 0, Math.PI * 2);
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

  // --- PROCEDURAL DETAILED FIGHTER BODY (FALLBACK DURING LOADING) ---
  private static drawDetailedFighterBody(ctx: CanvasRenderingContext2D, fighter: ActiveFighter) {
    const p = fighter.paletteIndex === 0 ? fighter.definition.palette : fighter.definition.alternatePalette;
    const f = fighter.stateFrame;
    const dress = fighter.definition.dressCode;
    const isHeavyweight = dress === 'Formal';
    const isFemale = dress === 'Smart Casual' || dress === 'White Tie';

    let headX = 0, headY = -140;
    let chestX = 0, chestY = -98;
    let hipX = 0, hipY = -64;
    let rKneeX = -14, rKneeY = -32, rFootX = -20, rFootY = 0;
    let rElbowX = -18, rElbowY = -98, rHandX = -22, rHandY = -96;
    let lKneeX = 16, lKneeY = -32, lFootX = 20, lFootY = 0;
    let lElbowX = 24, lElbowY = -98, lHandX = 30, lHandY = -102;

    const breath = Math.sin(f * 0.12) * 2.5;
    chestY += breath;
    headY += breath;

    this.drawAthleticArm(ctx, chestX - 4, chestY - 14, rElbowX, rElbowY, rHandX, rHandY, p.primary, p.skin, isHeavyweight ? 13 : 11, true, dress);
    this.drawAthleticLeg(ctx, hipX - 6, hipY, rKneeX, rKneeY, rFootX, rFootY, p.secondary, p.accent, isHeavyweight ? 16 : 14, isFemale);
    this.drawAthleticTorso(ctx, chestX, chestY, hipX, hipY, dress, p, f, isHeavyweight, isFemale);
    this.drawHumanHeadAndFace(ctx, headX, headY, dress, p, isHeavyweight, isFemale, f);
    this.drawAthleticLeg(ctx, hipX + 6, hipY, lKneeX, lKneeY, lFootX, lFootY, p.secondary, p.accent, isHeavyweight ? 17 : 15, isFemale);
    this.drawAthleticArm(ctx, chestX + 6, chestY - 12, lElbowX, lElbowY, lHandX, lHandY, p.primary, p.skin, isHeavyweight ? 14 : 12, false, dress);
  }

  // --- HUMAN HEAD, REALISTIC FACE & STYLED HAIR ---
  private static drawHumanHeadAndFace(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dress: string,
    p: { primary: string; secondary: string; accent: string; skin: string; hair: string; details: string },
    isHeavyweight: boolean,
    _isFemale: boolean,
    frame: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.moveTo(-6, 14); ctx.lineTo(6, 14);
    ctx.lineTo(isHeavyweight ? 10 : 8, 28); ctx.lineTo(isHeavyweight ? -10 : -8, 28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.bezierCurveTo(-15, 6, isHeavyweight ? -13 : -11, 16, 0, isHeavyweight ? 19 : 17);
    ctx.bezierCurveTo(isHeavyweight ? 13 : 11, 16, 15, 6, 12, -10);
    ctx.bezierCurveTo(12, -22, -12, -22, -12, -10);
    ctx.fill();

    ctx.fillStyle = '#ffffff'; ctx.fillRect(3, -5, 8, 4.5);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(5, -4, 4.5, 3.5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, -5, 2, 2);

    ctx.strokeStyle = p.hair;
    ctx.lineWidth = isHeavyweight ? 3 : 2.4;
    ctx.beginPath();
    ctx.moveTo(1, -8); ctx.lineTo(12, -5.5);
    ctx.stroke();

    ctx.fillStyle = p.hair;
    if (dress === 'Smart Casual') {
      ctx.beginPath();
      ctx.arc(0, -7, 15, Math.PI, Math.PI * 2);
      ctx.lineTo(15, 4); ctx.lineTo(-13, 3);
      ctx.closePath();
      ctx.fill();
      const ponySwing = Math.sin(frame * 0.16) * 4;
      ctx.beginPath();
      ctx.moveTo(-6, -15);
      ctx.quadraticCurveTo(-28 + ponySwing, -22, -34 + ponySwing * 1.5, 12);
      ctx.quadraticCurveTo(-26 + ponySwing, 28, -22, 36);
      ctx.quadraticCurveTo(-24, 18, -13, -7);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -7, 16, Math.PI, Math.PI * 2);
      ctx.lineTo(16, -2); ctx.lineTo(21, -8);
      ctx.lineTo(5, -28); ctx.lineTo(-17, -5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // --- ATHLETIC TORSO & REALISTIC TAILORED ATTIRE ---
  private static drawAthleticTorso(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    hx: number, hy: number,
    dress: string,
    p: { primary: string; secondary: string; accent: string; skin: string; hair: string; details: string },
    frame: number,
    isHeavyweight: boolean,
    isFemale: boolean
  ) {
    ctx.save();
    const shoulderWidth = isHeavyweight ? 25 : (isFemale ? 18 : 21);
    const waistWidth = isFemale ? 12 : (isHeavyweight ? 18 : 14);

    ctx.fillStyle = p.primary;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderWidth, cy - 24);
    ctx.lineTo(cx + shoulderWidth, cy - 24);
    ctx.lineTo(hx + waistWidth, hy + 4);
    ctx.lineTo(hx - waistWidth, hy + 4);
    ctx.closePath();
    ctx.fill();

    if (dress === 'Smart Casual') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 8, cy - 24, 16, 32);
      ctx.fillStyle = p.skin;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 24); ctx.lineTo(cx + 5, cy - 24); ctx.lineTo(cx, cy - 10);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- ATHLETIC MUSCULAR ARM WITH WRAPS / GLOVES ---
  private static drawAthleticArm(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number,
    ex: number, ey: number,
    hx: number, hy: number,
    sleeveColor: string,
    skinColor: string,
    width: number,
    isRear: boolean,
    dress: string
  ) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    ctx.stroke();

    const isBareForearm = dress === 'Casual' || dress === 'Semi Formal';
    ctx.strokeStyle = isBareForearm ? skinColor : sleeveColor;
    ctx.lineWidth = width * 0.9;
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.fillStyle = dress === 'Formal' ? '#262626' : (dress === 'White Tie' ? '#ffffff' : skinColor);
    ctx.beginPath();
    ctx.arc(hx, hy, width * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- ATHLETIC LEG ---
  private static drawAthleticLeg(
    ctx: CanvasRenderingContext2D,
    hx: number, hy: number,
    kx: number, ky: number,
    fx: number, fy: number,
    trouserColor: string,
    shoeColor: string,
    width: number,
    isFemale: boolean
  ) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = trouserColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.lineTo(kx, ky);
    ctx.stroke();

    ctx.lineWidth = width * (isFemale ? 0.8 : 0.86);
    ctx.beginPath();
    ctx.moveTo(kx, ky); ctx.lineTo(fx, fy - 6);
    ctx.stroke();

    ctx.fillStyle = shoeColor;
    ctx.beginPath();
    ctx.roundRect(fx - 12, fy - 9, 24, 9, 2);
    ctx.fill();

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
