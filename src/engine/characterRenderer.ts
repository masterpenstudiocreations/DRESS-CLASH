import { ActiveFighter } from '../types/fighter';

export class CharacterRenderer {
  // Render high-fidelity, human-proportioned, athletic martial artist with KOF / SNK aesthetic
  // Completely transparent silhouette - ZERO rectangular box or background clipping
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

    // 5. Draw Avatar: 100% Clean silhouette, fully articulated human body with authentic KOF martial arts
    this.drawDetailedFighterBody(ctx, fighter);

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

  // --- HIGH-DETAIL ATHLETIC HUMAN FIGHTER BODY (AUTHENTIC KOF MARTIAL ARTS) ---
  private static drawDetailedFighterBody(ctx: CanvasRenderingContext2D, fighter: ActiveFighter) {
    const p = fighter.paletteIndex === 0 ? fighter.definition.palette : fighter.definition.alternatePalette;
    const f = fighter.stateFrame;
    const dress = fighter.definition.dressCode;
    const isHeavyweight = dress === 'Formal'; // Dmitri Sterling is heavyweight
    const isFemale = dress === 'Smart Casual' || dress === 'White Tie'; // Elena, Valerie

    // HUMAN SKELETON WITH BIOMECHANICAL KINETICS (~7.8 heads tall, 160px height)
    let headX = 0, headY = -140;
    let chestX = 0, chestY = -98;
    let hipX = 0, hipY = -64;

    // Rear Limbs (Back Layer)
    let rKneeX = -14, rKneeY = -32, rFootX = -20, rFootY = 0;
    let rElbowX = -18, rElbowY = -98, rHandX = -22, rHandY = -96;

    // Lead Limbs (Front Layer)
    let lKneeX = 16, lKneeY = -32, lFootX = 20, lFootY = 0;
    let lElbowX = 24, lElbowY = -98, lHandX = 30, lHandY = -102;

    let bodyAngle = 0;
    let strikeFX: { type: 'punch' | 'kick' | 'slash' | 'counter'; reach: number; y: number } | null = null;
    let isRolling = false;
    let rollAngle = 0;

    // ==========================================
    // 1. MARTIAL ARTS SPECIFIC POSTURES & STATES
    // ==========================================

    if (fighter.state === 'IDLE') {
      // Natural athletic breathing pulse
      const breath = Math.sin(f * 0.12) * 2.5;
      chestY += breath;
      headY += breath;

      if (dress === 'Casual') {
        // REN CRUZ (Kickboxing & Tae Kwon Do):
        // High dynamic spring bounce on balls of feet, elbows pinned, fists protecting jaw
        const bounce = Math.abs(Math.sin(f * 0.22)) * 6;
        headY -= bounce;
        chestY -= bounce;
        hipY -= bounce * 0.6;
        lHandX = 20; lHandY = -118 + bounce;
        rHandX = -6; rHandY = -122 + bounce;
        lFootX = 18; rFootX = -18;
      } else if (dress === 'Smart Casual') {
        // ELENA ROSTOVA (Savate & Kyokushin Karate):
        // Upright feline poised guard, knife-hand forward measuring distance, high center of gravity
        const sway = Math.sin(f * 0.14) * 2;
        lHandX = 34 + sway; lHandY = -108;
        rHandX = -12; rHandY = -102;
        lFootX = 22; rFootX = -14;
      } else if (dress === 'Semi Formal') {
        // MARCUS VANCE (Wing Chun & Judo):
        // Rooted Yee Jee Kim Yeung Ma stance, Man Sao (seeking hand) lead, Wu Sao (guard hand) on centerline
        lHandX = 28; lHandY = -110;
        rHandX = 10; rHandY = -100;
        lFootX = 14; rFootX = -14;
      } else if (dress === 'Coctel') {
        // MATEO VALENCIA (Capoeira & Pencak Silat):
        // Ginga continuous fluid rhythm bounce and lateral sway, relaxed shoulders ready to burst
        const gingaBounce = Math.sin(f * 0.18) * 5;
        const gingaSway = Math.sin(f * 0.18) * 0.06;
        headY -= gingaBounce;
        chestY -= gingaBounce;
        bodyAngle = gingaSway;
        lHandX = 30 + Math.cos(f * 0.18) * 6; lHandY = -95 + gingaBounce;
        rHandX = -10 - Math.cos(f * 0.18) * 6; rHandY = -115 + gingaBounce;
        lFootX = 22; rFootX = -18;
      } else if (dress === 'Formal') {
        // DMITRI STERLING (Heavyweight Boxing & Muay Thai):
        // Heavy Peek-a-boo boxer bob-and-weave, massive chin tucked behind lead shoulder, elbows tight to lats
        const bob = Math.sin(f * 0.16) * 3;
        bodyAngle = 0.08;
        headY += bob;
        chestY += bob;
        lHandX = 16; lHandY = -124 + bob;
        rHandX = -4; rHandY = -126 + bob;
        lFootX = 18; rFootX = -18;
      } else if (dress === 'Black Tie') {
        // LORD JULIAN (Aikido & Fencing):
        // Aristocratic Hanmi fencing stance, blade hand leading with poised elegance, rear arm curled behind
        bodyAngle = -0.06;
        lHandX = 38; lHandY = -108;
        rHandX = -26; rHandY = -116;
        lFootX = 24; rFootX = -18;
      } else if (dress === 'White Tie') {
        // MADAME VALERIE (Imperial Jiu-Jitsu & Sambo):
        // Regal sovereign composure, dignified posture, watchful balanced stance
        lHandX = 22; lHandY = -102;
        rHandX = -16; rHandY = -98;
        lFootX = 16; rFootX = -16;
      }
    } else if (fighter.state === 'WALK_FWD' || fighter.state === 'WALK_BACK') {
      // Authentic KOF grounded footwork
      const walkCycle = Math.sin(f * 0.22);
      rFootX = walkCycle * 26 - 4;
      lFootX = -walkCycle * 26 + 4;
      headY += Math.abs(walkCycle) * 3;
      chestY += Math.abs(walkCycle) * 2;
      lHandX = 22 - walkCycle * 16;
      rHandX = -12 + walkCycle * 16;
    } else if (fighter.state === 'DASH_FWD') {
      // Explosive KOF sprint drive
      bodyAngle = 0.34;
      headY += 16;
      chestY += 18;
      hipY += 12;
      lHandX = 48; lHandY = -82;
      rHandX = -34; rHandY = -72;
      rFootX = -34; lFootX = 34;
    } else if (fighter.state === 'DASH_BACK') {
      // Tactical hop retreat
      bodyAngle = -0.25;
      headY += 6;
      lHandX = 12; lHandY = -102;
      rHandX = -38; rHandY = -80;
      rFootX = -36; lFootX = 12;
    } else if (fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') {
      // KOF 2002 EMERGENCY ROLL: Full tactical forward/backward tuck under attacks
      isRolling = true;
      const rollDirection = fighter.state === 'ROLL_FWD' ? 1 : -1;
      rollAngle = (f * 0.45) * rollDirection;
      headY = -48;
      chestY = -44;
      hipY = -40;
      lKneeX = 12; lKneeY = -24; lFootX = 10; lFootY = -12;
      rKneeX = -12; rKneeY = -24; rFootX = -10; rFootY = -12;
      lHandX = 16; lHandY = -52;
      rHandX = -16; rHandY = -52;
    } else if (fighter.state === 'CROUCH') {
      // Low tactical duck stance
      bodyAngle = 0.14;
      headY += 42;
      chestY += 38;
      hipY += 34;
      lKneeX = 26; lKneeY = -14; lFootX = 26;
      rKneeX = -24; rKneeY = -14; rFootX = -24;
      lHandX = 22; lHandY = -76;
      rHandX = 6; rHandY = -82;
    } else if (fighter.state === 'BLOCK_STAND') {
      // AUTHENTIC KOF MARTIAL ARTS STANDING BLOCK:
      // Forearms locked together shielding face and chest, body braced backward, absorbing impact
      bodyAngle = -0.16;
      lHandX = 18; lHandY = -126;
      lElbowX = 14; lElbowY = -108;
      rHandX = 8; rHandY = -128;
      rElbowX = 4; rElbowY = -110;
      lFootX = 12; rFootX = -26;
      this.drawGuardEnergyShield(ctx, 28, -98, 48);
    } else if (fighter.state === 'BLOCK_CROUCH') {
      // AUTHENTIC KOF CROUCHING BLOCK:
      // Low cross-arm knee deflection, body compacted to defend against low sweeps
      bodyAngle = 0.18;
      headY += 44;
      chestY += 40;
      hipY += 36;
      lKneeX = 26; lKneeY = -14; lFootX = 26;
      rKneeX = -24; rKneeY = -14; rFootX = -24;
      lHandX = 16; lHandY = -68;
      rHandX = 6; rHandY = -74;
      this.drawGuardEnergyShield(ctx, 24, -60, 38);
    } else if (fighter.state === 'JUMPING') {
      // Airborne vertical elongation
      headY -= 14;
      chestY -= 12;
      lKneeY = -52; lFootY = -32;
      rKneeY = -56; rFootY = -38;
      lHandY = -126; rHandY = -115;
    } else if (fighter.state === 'GUARD_CRUSH') {
      // Stunned stagger: guard shattered open, head rocked back, electrical stun arcs
      bodyAngle = -0.48;
      headY += 18;
      lHandX = -24; lHandY = -134;
      rHandX = 26; rHandY = -48;
      // Stun sparks crackling around head
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, headY - 22); ctx.lineTo(14, headY - 28);
      ctx.lineTo(-8, headY - 34); ctx.lineTo(18, headY - 40);
      ctx.stroke();
    } else if (fighter.state === 'HIT' || fighter.state === 'HIT_AIR') {
      // Biomechanical hit recoil
      bodyAngle = -0.42;
      headY += 10;
      lHandX = -16; lHandY = -120;
      rHandX = -36; rHandY = -100;
    } else if (fighter.state === 'DOWN') {
      // Knockdown crumple to the canvas
      ctx.translate(0, 20);
      ctx.rotate(-Math.PI * 0.48);
    } else if (fighter.state === 'ATTACK' && fighter.currentMove) {
      // ==========================================
      // REALISTIC KOF MARTIAL ARTS ATTACKS
      // ==========================================
      const move = fighter.currentMove;
      const reach = move.reach || 90;
      const isActive = fighter.movePhase === 'ACTIVE';
      const isStartup = fighter.movePhase === 'STARTUP';

      if (move.id.includes('5a')) {
        // LIGHT PUNCH / JAB: Straight line piston punch, shoulder rotation, chin tucked
        bodyAngle = isActive ? 0.18 : 0.06;
        lHandX = isActive ? reach : reach * 0.42;
        lHandY = move.height === 'head' ? -128 : -108;
        rHandX = -6; rHandY = -124;
        if (isActive) strikeFX = { type: 'punch', reach, y: lHandY };
      } else if (move.id.includes('5c') || move.id.includes('qcf_p') || move.id.includes('super')) {
        // HEAVY PUNCH / APEX STRAIGHT / BIU JEE / DEMPSEY HAMMER:
        // Deep hip rotation (35°), rear arm full extension with kinetic drive
        bodyAngle = isActive ? 0.32 : -0.1;
        if (isStartup) {
          lHandX = -12; lHandY = -104; // Anticipation coil
        } else {
          lHandX = isActive ? reach : reach * 0.55;
          lHandY = move.height === 'head' ? -122 : -102;
          rHandX = -24; rHandY = -94;
          rFootX = -32;
        }
        if (isActive) strikeFX = { type: 'punch', reach, y: lHandY };
      } else if (move.id.includes('5b')) {
        // LIGHT KICK / POKE: Snapping front kick / Savate chassé / Wing Chun stomp
        bodyAngle = -0.14;
        lFootX = isActive ? reach : reach * 0.38;
        lFootY = move.height === 'low' ? -16 : -65;
        lKneeX = lFootX * 0.52; lKneeY = lFootY * 0.65;
        lHandX = 12; lHandY = -118;
        if (isActive) strikeFX = { type: 'kick', reach, y: lFootY };
      } else if (move.id.includes('5d') || move.id.includes('qcf_k') || move.id.includes('dp_k')) {
        // HEAVY KICK / SIGNATURE MARTIAL KICK:
        if (dress === 'Coctel') {
          // Mateo Valencia: Meia Lua de Compasso (Capoeira spinning wheel kick with hand grounded)
          bodyAngle = 0.55;
          headY += 40; chestY += 36;
          lHandX = 14; lHandY = 0; // Hand on floor!
          lFootX = isActive ? reach : reach * 0.45;
          lFootY = -115;
          lKneeX = lFootX * 0.6; lKneeY = -80;
        } else {
          // 180° hip turnover high kick (Elena Savate Fouetté / Ren Tae Kwon Do tornado / Valerie Axe Kick)
          bodyAngle = -0.26;
          lFootX = isActive ? reach : reach * 0.5;
          lFootY = move.height === 'head' ? -135 : -90;
          lKneeX = lFootX * 0.5; lKneeY = lFootY * 0.72;
          rKneeX = -16; rFootX = -18;
          lHandX = -20; lHandY = -98;
        }
        if (isActive) strikeFX = { type: 'kick', reach, y: lFootY };
      } else if (move.id.includes('2d')) {
        // LOW SWEEP: True crouching 180° leg sweep along the floor
        bodyAngle = 0.35;
        chestY += 46; hipY += 42; headY += 50;
        lFootX = isActive ? reach : reach * 0.5;
        lFootY = 0;
        lKneeX = lFootX * 0.5; lKneeY = -4;
        rFootX = -32; rFootY = -8;
        if (isActive) strikeFX = { type: 'slash', reach, y: -6 };
      } else if (move.type === 'Counter') {
        // Circular Aikido / Wing Chun deflection parry
        bodyAngle = -0.12;
        lHandX = 32; lHandY = -108;
        rHandX = 16; rHandY = -112;
        if (isActive) strikeFX = { type: 'counter', reach, y: -110 };
      } else {
        lHandX = reach * 0.8;
      }
    }

    if (isRolling) {
      ctx.rotate(rollAngle);
    } else {
      ctx.rotate(bodyAngle);
    }

    // ==========================================
    // 2. ANATOMICAL DRAWING LAYERS (BACK TO FRONT)
    // ==========================================

    // --- 1. REAR ARM (Bicep, Forearm, Hand) ---
    this.drawAthleticArm(ctx, chestX - 4, chestY - 14, rElbowX, rElbowY, rHandX, rHandY, p.primary, p.skin, isHeavyweight ? 13 : 11, true, dress);

    // --- 2. REAR LEG & SHOE ---
    this.drawAthleticLeg(ctx, hipX - 6, hipY, rKneeX, rKneeY, rFootX, rFootY, p.secondary, p.accent, isHeavyweight ? 16 : 14, isFemale);

    // --- 3. ATHLETIC TORSO & LAYERED TAILORED CLOTHING ---
    this.drawAthleticTorso(ctx, chestX, chestY, hipX, hipY, dress, p, f, isHeavyweight, isFemale);

    // --- 4. HUMAN HEAD, REALISTIC FACE & STYLED HAIR ---
    this.drawHumanHeadAndFace(ctx, headX, headY, dress, p, isHeavyweight, isFemale, f);

    // --- 5. LEAD LEG & SHOE ---
    this.drawAthleticLeg(ctx, hipX + 6, hipY, lKneeX, lKneeY, lFootX, lFootY, p.secondary, p.accent, isHeavyweight ? 17 : 15, isFemale);

    // --- 6. LEAD ARM (Bicep, Forearm, Fist / Palm) ---
    this.drawAthleticArm(ctx, chestX + 6, chestY - 12, lElbowX, lElbowY, lHandX, lHandY, p.primary, p.skin, isHeavyweight ? 14 : 12, false, dress);

    // --- 7. MARTIAL ARTS STRIKE IMPACT EFFECTS ---
    if (strikeFX) {
      this.drawMartialStrikeFX(ctx, strikeFX.reach, strikeFX.y, strikeFX.type, fighter.inMaxMode, dress);
    }
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

    // Small deflection sparks
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

    // 1. Neck with Muscle Contours
    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.lineTo(6, 14);
    ctx.lineTo(isHeavyweight ? 10 : 8, 28);
    ctx.lineTo(isHeavyweight ? -10 : -8, 28);
    ctx.closePath();
    ctx.fill();

    // Neck shadow under jaw
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(-6, 14, 12, 7);

    // 2. Sculpted Human Jaw & Cranium
    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.bezierCurveTo(-15, 6, isHeavyweight ? -13 : -11, 16, 0, isHeavyweight ? 19 : 17); // Chin
    ctx.bezierCurveTo(isHeavyweight ? 13 : 11, 16, 15, 6, 12, -10);
    ctx.bezierCurveTo(12, -22, -12, -22, -12, -10);
    ctx.fill();

    // Jawline shading contour
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.lineTo(0, isHeavyweight ? 18 : 16);
    ctx.lineTo(11, 4);
    ctx.stroke();

    // 3. Fierce Human Martial Gaze
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, -5, 8, 4.5);
    // Iris & Pupil (Focused, intense)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(5, -4, 4.5, 3.5);
    // Specular highlight catchlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, -5, 2, 2);

    // Determined Martial Eyebrow
    ctx.strokeStyle = p.hair;
    ctx.lineWidth = isHeavyweight ? 3 : 2.4;
    ctx.beginPath();
    ctx.moveTo(1, -8);
    ctx.lineTo(12, -5.5);
    ctx.stroke();

    // Sculpted Nose Bridge & Mouth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.lineTo(12, 2);
    ctx.lineTo(9, 3.5); // Nose tip
    ctx.moveTo(3, 9);
    ctx.lineTo(10, 8.5); // Tight lips
    ctx.stroke();

    // 4. Character-Specific Hairstyle (Faithful to the Portraits)
    ctx.fillStyle = p.hair;

    if (dress === 'Casual') {
      // Ren Cruz: Spiky street fighting hair with layered crowns
      ctx.beginPath();
      ctx.arc(0, -7, 16, Math.PI, Math.PI * 2);
      ctx.lineTo(16, -2);
      ctx.lineTo(21, -8);
      ctx.lineTo(14, -13);
      ctx.lineTo(18, -22);
      ctx.lineTo(9, -20);
      ctx.lineTo(5, -28); // Main crown spike
      ctx.lineTo(-3, -22);
      ctx.lineTo(-13, -26);
      ctx.lineTo(-11, -14);
      ctx.lineTo(-17, -5);
      ctx.closePath();
      ctx.fill();
    } else if (dress === 'Smart Casual') {
      // Elena Rostova: Volumetric auburn high ponytail with fringe and dynamic inertia
      ctx.beginPath();
      ctx.arc(0, -7, 15, Math.PI, Math.PI * 2);
      ctx.lineTo(15, 4);
      ctx.lineTo(9, 1);
      ctx.lineTo(-13, 3);
      ctx.closePath();
      ctx.fill();
      // Flowing dynamic ponytail
      const ponySwing = Math.sin(frame * 0.16) * 4;
      ctx.beginPath();
      ctx.moveTo(-6, -15);
      ctx.quadraticCurveTo(-28 + ponySwing, -22, -34 + ponySwing * 1.5, 12);
      ctx.quadraticCurveTo(-26 + ponySwing, 28, -22, 36);
      ctx.quadraticCurveTo(-24, 18, -13, -7);
      ctx.fill();
    } else if (dress === 'Semi Formal') {
      // Marcus Vance: Clean executive side-part fade
      ctx.beginPath();
      ctx.arc(0, -9, 15, Math.PI, Math.PI * 2);
      ctx.lineTo(15, 3);
      ctx.lineTo(13, -4);
      ctx.lineTo(-13, -3);
      ctx.closePath();
      ctx.fill();
    } else if (dress === 'Formal') {
      // Dmitri Sterling: Heavyweight pomp with silver streaks
      ctx.beginPath();
      ctx.arc(0, -9, 16, Math.PI, Math.PI * 2);
      ctx.lineTo(16, 0);
      ctx.lineTo(13, -8);
      ctx.lineTo(-13, -7);
      ctx.closePath();
      ctx.fill();
      // Silver hair streaks
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-7, -15); ctx.lineTo(9, -17);
      ctx.moveTo(-5, -19); ctx.lineTo(7, -21);
      ctx.stroke();
    } else if (dress === 'Coctel') {
      // Mateo Valencia: Sleek modern pompadour fade
      ctx.beginPath();
      ctx.arc(0, -9, 15, Math.PI, Math.PI * 2);
      ctx.lineTo(16, 2);
      ctx.lineTo(12, -4);
      ctx.lineTo(-14, -3);
      ctx.closePath();
      ctx.fill();
    } else if (dress === 'Black Tie') {
      // Lord Julian: Flowing platinum fencer fringe
      ctx.beginPath();
      ctx.arc(0, -9, 16, Math.PI, Math.PI * 2);
      ctx.lineTo(17, 3);
      ctx.lineTo(11, 6); // Sweeping fringe
      ctx.lineTo(-15, 3);
      ctx.closePath();
      ctx.fill();
    } else if (dress === 'White Tie') {
      // Madame Valerie: Regal braided crown updo & sapphire tiara
      ctx.beginPath();
      ctx.arc(0, -9, 17, Math.PI, Math.PI * 2);
      ctx.lineTo(15, 5);
      ctx.lineTo(-15, 5);
      ctx.closePath();
      ctx.fill();
      // Imperial Sapphire Tiara
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(-11, -19);
      ctx.lineTo(-5, -29);
      ctx.lineTo(0, -23);
      ctx.lineTo(5, -29);
      ctx.lineTo(11, -19);
      ctx.closePath();
      ctx.fill();
      // Sapphire center gem
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -25, 2.5, 0, Math.PI * 2);
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

    // 1. Torso Base (Athletic V-Taper)
    ctx.fillStyle = p.primary;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderWidth, cy - 24);
    ctx.lineTo(cx + shoulderWidth, cy - 24);
    ctx.lineTo(hx + waistWidth, hy + 4);
    ctx.lineTo(hx - waistWidth, hy + 4);
    ctx.closePath();
    ctx.fill();

    // 2. Costume & Textile Layers
    if (dress === 'Casual') {
      // Ren Cruz: Unzipped Crimson Hoodie & Dark Athletic Tank
      ctx.fillStyle = '#0f172a'; // Black muscle tank
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 24);
      ctx.lineTo(cx + 8, cy - 24);
      ctx.lineTo(cx, cy - 6);
      ctx.fill();

      // Pectoral & Collarbone definition
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 14); ctx.lineTo(cx + 7, cy - 14);
      ctx.stroke();

      // Hoodie zipper seams
      ctx.strokeStyle = p.details;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(hx, hy + 4);
      ctx.stroke();

      // Drawstrings with physics
      const stringSwing = Math.sin(frame * 0.16) * 3;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 16);
      ctx.lineTo(cx - 6 + stringSwing, cy);
      ctx.moveTo(cx + 5, cy - 16);
      ctx.lineTo(cx + 6 + stringSwing, cy);
      ctx.stroke();
    } else if (dress === 'Smart Casual') {
      // Elena Rostova: Fitted Wine-Red Blazer over Open White Shirt
      ctx.fillStyle = '#f8fafc'; // Crisp white shirt
      ctx.fillRect(cx - 8, cy - 24, 16, 32);

      // Open collar V-cut
      ctx.fillStyle = p.skin;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 24);
      ctx.lineTo(cx + 5, cy - 24);
      ctx.lineTo(cx, cy - 10);
      ctx.fill();

      // Fitted wine-red blazer lapels
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.moveTo(cx - shoulderWidth, cy - 24);
      ctx.lineTo(cx - 6, cy + 2);
      ctx.lineTo(cx - 15, cy + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + shoulderWidth, cy - 24);
      ctx.lineTo(cx + 6, cy + 2);
      ctx.lineTo(cx + 15, cy + 2);
      ctx.fill();
    } else if (dress === 'Semi Formal') {
      // Marcus Vance: 5-Button Charcoal Vest over White Shirt & Slim Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 17, cy - 24, 34, 30);

      // Charcoal vest
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy - 12);
      ctx.lineTo(cx, cy + 2);
      ctx.lineTo(cx + 17, cy - 12);
      ctx.lineTo(hx + waistWidth, hy + 2);
      ctx.lineTo(hx, hy + 6);
      ctx.lineTo(hx - waistWidth, hy + 2);
      ctx.closePath();
      ctx.fill();

      // Slim necktie
      ctx.fillStyle = p.accent;
      ctx.fillRect(cx - 2.8, cy - 12, 5.6, 26);
    } else if (dress === 'Coctel') {
      // Mateo Valencia: Emerald Velvet Cocktail Blazer & Open Black Silk Shirt
      ctx.fillStyle = '#09090b'; // Black silk shirt
      ctx.fillRect(cx - 10, cy - 24, 20, 30);

      // Open chest V-cut
      ctx.fillStyle = p.skin;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 24);
      ctx.lineTo(cx + 6, cy - 24);
      ctx.lineTo(cx, cy - 8);
      ctx.fill();

      // Gold chain necklace
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy - 16, 7, 0, Math.PI);
      ctx.stroke();

      // Emerald velvet blazer lapels
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.moveTo(cx - shoulderWidth, cy - 24);
      ctx.lineTo(cx - 7, cy + 4);
      ctx.lineTo(cx - 16, cy + 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + shoulderWidth, cy - 24);
      ctx.lineTo(cx + 7, cy + 4);
      ctx.lineTo(cx + 16, cy + 4);
      ctx.fill();
    } else if (dress === 'Formal') {
      // Dmitri Sterling: Heavyweight Double-Breasted Suit Jacket worn open over bare muscular chest
      ctx.fillStyle = p.skin;
      ctx.fillRect(cx - 12, cy - 24, 24, 30);

      // Silver orthodox cross pendant
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy - 14, 8, 0, Math.PI);
      ctx.stroke();
      ctx.strokeRect(cx - 2, cy - 6, 4, 8);

      // Suit jacket
      ctx.fillStyle = p.primary;
      ctx.fillRect(cx - shoulderWidth, cy - 22, 14, 34);
      ctx.fillRect(cx + shoulderWidth - 14, cy - 22, 14, 34);
    } else if (dress === 'Black Tie') {
      // Lord Julian: Midnight Tuxedo with Satin Shawl Lapels
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 13, cy - 24, 26, 30);

      ctx.fillStyle = p.primary;
      ctx.fillRect(cx - 21, cy - 22, 12, 32);
      ctx.fillRect(cx + 9, cy - 22, 12, 32);

      // Black silk bowtie
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 20); ctx.lineTo(cx + 8, cy - 20);
      ctx.lineTo(cx - 8, cy - 14); ctx.lineTo(cx + 8, cy - 14);
      ctx.fill();
    } else if (dress === 'White Tie') {
      // Madame Valerie: Sovereign Frac with Swallowtails & High-Slit Gown
      ctx.fillStyle = p.primary;
      ctx.fillRect(cx - 19, cy - 24, 38, 30);

      // Midnight indigo vest
      ctx.fillStyle = p.secondary;
      ctx.fillRect(cx - 9, cy - 14, 18, 22);

      // Royal Gold Epaulets & Sash
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 20);
      ctx.lineTo(cx + 16, cy + 12);
      ctx.stroke();

      // Flowing swallowtails fluttering behind
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 14, hy);
      ctx.lineTo(hx - 30 - Math.sin(frame * 0.14) * 9, hy + 48);
      ctx.lineTo(hx - 9, hy + 9);
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

    // Bicep & Tricep (Upper Arm)
    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Forearm (Rolled up sleeve for Marcus / Ren wraps / Valerie opera gloves)
    const isBareForearm = dress === 'Casual' || dress === 'Semi Formal';
    ctx.strokeStyle = isBareForearm ? skinColor : sleeveColor;
    ctx.lineWidth = width * 0.9;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Hand Wraps for Ren / Leather Gloves for Elena & Dmitri / White Gloves for Valerie
    if (dress === 'Casual') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = width * 0.85;
      ctx.beginPath();
      ctx.moveTo((ex + hx) * 0.5, (ey + hy) * 0.5);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    } else if (dress === 'Smart Casual') {
      // Black fingerless tactical gloves
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = width * 0.85;
      ctx.beginPath();
      ctx.moveTo(hx - 4, hy - 4);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }

    // Clenched Martial Fist / Open Knife Hand
    ctx.fillStyle = dress === 'Formal' ? '#262626' : (dress === 'White Tie' ? '#ffffff' : (dress === 'Smart Casual' ? '#18181b' : skinColor));
    ctx.beginPath();
    ctx.arc(hx, hy, width * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Knuckle highlight
    ctx.strokeStyle = isRear ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hx, hy, width * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- ATHLETIC LEG (DEFINED QUAD, CALF, AND MARTIAL SHOE) ---
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

    // Thigh (Trousers with muscle contour)
    ctx.strokeStyle = trouserColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(kx, ky);
    ctx.stroke();

    // Calf & Ankle
    ctx.lineWidth = width * (isFemale ? 0.8 : 0.86);
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy - 6);
    ctx.stroke();

    // Realistic Martial Arts Shoe / Boot / High Heel with Defined Heel & Rubber Sole
    ctx.fillStyle = shoeColor;
    ctx.beginPath();
    ctx.roundRect(fx - 12, fy - 9, 24, 9, 2);
    ctx.fill();

    // Sole & Heel Cut
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(fx - 12, fy - 2.5, 24, 2.5);
    ctx.fillRect(fx - 12, fy - 6, 7, 4.5);

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
    // Character-specific energy signature!
    let fxColor = isMaxMode ? '#ff0055' : '#00e5ff';
    if (dress === 'Casual') fxColor = isMaxMode ? '#ff0044' : '#f59e0b'; // Fire & Flame for Ren
    else if (dress === 'Smart Casual') fxColor = isMaxMode ? '#ff00a0' : '#00e5ff'; // Crescent ice-cyan for Elena
    else if (dress === 'Coctel') fxColor = isMaxMode ? '#10b981' : '#34d399'; // Emerald whirlwind for Mateo
    else if (dress === 'Formal') fxColor = isMaxMode ? '#ff3300' : '#eab308'; // Heavy gold shockwave for Dmitri
    else if (dress === 'Black Tie') fxColor = isMaxMode ? '#c026d3' : '#e2e8f0'; // Silver rapier flash for Julian
    else if (dress === 'White Tie') fxColor = isMaxMode ? '#ec4899' : '#3b82f6'; // Royal sapphire pulse for Valerie

    ctx.strokeStyle = fxColor;
    ctx.shadowColor = fxColor;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (type === 'punch') {
      // High-velocity straight impact shockwave
      ctx.beginPath();
      ctx.arc(reach * 0.78, targetY, reach * 0.42, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Kinetic speed trails
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(reach * 0.35, targetY - 12); ctx.lineTo(reach + 20, targetY - 12);
      ctx.moveTo(reach * 0.45, targetY + 12); ctx.lineTo(reach + 15, targetY + 12);
      ctx.stroke();
    } else if (type === 'kick') {
      // 180° Whipping Crescent Blade Arc
      ctx.beginPath();
      ctx.arc(reach * 0.62, targetY + 18, reach * 0.58, -Math.PI * 0.62, Math.PI * 0.12);
      ctx.stroke();
    } else if (type === 'slash') {
      // Low floor sweep shockwave
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(reach + 24, 0);
      ctx.stroke();
    } else if (type === 'counter') {
      // Circular Aikido / Wing Chun deflection vortex
      ctx.beginPath();
      ctx.arc(reach * 0.5, targetY, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- HITBOX / HURTBOX DEBUG DISPLAY FOR TRAINING LAB ---
  private static drawDebugBoxes(ctx: CanvasRenderingContext2D, fighter: ActiveFighter) {
    // Hurtbox (Green)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(-26, -150, 52, 150);

    // Pushbox (Blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(-18, -130, 36, 130);

    // Hitbox (Red) during active attack
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

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
