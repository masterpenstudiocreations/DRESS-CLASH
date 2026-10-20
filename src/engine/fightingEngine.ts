import { ActiveFighter, FighterDefinition, InputState, MoveFrameData } from '../types/fighter';
import { sound } from '../audio/soundEngine';

export interface HitEffect {
  x: number;
  y: number;
  isCounter: boolean;
  isSuper: boolean;
  frame: number;
}

export interface FightEvent {
  type: 'HIT' | 'BLOCK' | 'COUNTER' | 'GUARD_CRUSH' | 'SUPER_FLASH' | 'KO' | 'ROUND_START';
  text?: string;
  x?: number;
  y?: number;
}

export class FightingEngine {
  public p1: ActiveFighter;
  public p2: ActiveFighter;
  public groundY: number = 420;
  public arenaWidth: number = 1100;
  public cameraX: number = 550;
  public roundTime: number = 99;
  public roundTimeFrames: number = 0;
  public isRoundOver: boolean = false;
  public winner: 1 | 2 | 0 | null = null; // null = ongoing, 0 = draw
  public hitEffects: HitEffect[] = [];
  public hitStopFrames: number = 0;
  public superDim: number = 0; // 0 to 1

  // Input Buffers
  private p1InputHistory: { input: InputState; frame: number }[] = [];
  private p2InputHistory: { input: InputState; frame: number }[] = [];
  private p1LastTap: { dir: string; frame: number } = { dir: '', frame: 0 };
  private p2LastTap: { dir: string; frame: number } = { dir: '', frame: 0 };

  // Training Dummy Config
  public dummyGuardMode: 'none' | 'all' | 'random' = 'none';
  public dummyStateMode: 'stand' | 'crouch' | 'jump' = 'stand';

  constructor(p1Def: FighterDefinition, p2Def: FighterDefinition, isTraining: boolean = false) {
    this.p1 = this.createActiveFighter(p1Def, 0, 360, 1);
    this.p2 = this.createActiveFighter(p2Def, 1, 740, -1);
    this.cameraX = (this.p1.x + this.p2.x) / 2;
    if (isTraining) {
      this.p1.superMeter = 300;
      this.p2.superMeter = 300;
      this.roundTime = 999;
    }
  }

  private createActiveFighter(def: FighterDefinition, paletteIndex: number, x: number, facing: 1 | -1): ActiveFighter {
    return {
      definition: def,
      paletteIndex,
      x,
      y: 0,
      vx: 0,
      vy: 0,
      facing,
      state: 'IDLE',
      stateFrame: 0,
      currentMove: null,
      movePhase: 'NONE',
      moveFrameCounter: 0,
      hasHitInActivePhase: false,
      health: def.stats.health,
      maxHealth: def.stats.health,
      guardMeter: def.stats.guardCrushMax,
      maxGuardMeter: def.stats.guardCrushMax,
      guardCrushTimer: 0,
      superMeter: 100, // Starts with 1 stock for immediate fun
      maxSuperMeter: 300,
      inMaxMode: false,
      maxModeTimer: 0,
      comboCount: 0,
      comboDamage: 0,
      hitStunTimer: 0,
      blockStunTimer: 0,
      invincibleTimer: 0,
      isCrouching: false,
      isGrounded: true,
      isAttacking: false,
      hasAirActionUsed: false,
      isCounterHit: false
    };
  }

  public update(p1Input: InputState, p2Input: InputState, isCpuP2: boolean = false): FightEvent[] {
    const events: FightEvent[] = [];

    // Hitstop freeze (KOF impact pause)
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return events;
    }

    // Super Dim fade
    if (this.superDim > 0) {
      this.superDim = Math.max(0, this.superDim - 0.04);
    }

    // Timer countdown
    this.roundTimeFrames++;
    if (this.roundTimeFrames >= 60 && this.roundTime > 0) {
      this.roundTimeFrames = 0;
      this.roundTime--;
      if (this.roundTime === 0 && !this.isRoundOver) {
        this.checkTimeOut();
      }
    }

    // Update Input History
    this.p1InputHistory.push({ input: { ...p1Input }, frame: Date.now() });
    if (this.p1InputHistory.length > 40) this.p1InputHistory.shift();

    let actualP2Input = p2Input;
    if (isCpuP2) {
      actualP2Input = this.processCpuAI(this.p2, this.p1);
    }
    this.p2InputHistory.push({ input: { ...actualP2Input }, frame: Date.now() });
    if (this.p2InputHistory.length > 40) this.p2InputHistory.shift();

    // 1. Process Fighter Actions & Physics
    this.updateFighter(this.p1, this.p2, p1Input, this.p1InputHistory, this.p1LastTap, events);
    this.updateFighter(this.p2, this.p1, actualP2Input, this.p2InputHistory, this.p2LastTap, events);

    // 2. Collision & Pushbox: Fighters push each other, cannot walk through
    this.resolvePushboxes(this.p1, this.p2);

    // 3. Hit Detection & Combos
    this.checkHitCollisions(this.p1, this.p2, events);
    this.checkHitCollisions(this.p2, this.p1, events);

    // 4. Update Camera to track center of fighters
    const midX = (this.p1.x + this.p2.x) / 2;
    this.cameraX += (midX - this.cameraX) * 0.15;

    // 5. Update Hit Sparks
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      this.hitEffects[i].frame--;
      if (this.hitEffects[i].frame <= 0) {
        this.hitEffects.splice(i, 1);
      }
    }

    // 6. Check Win/Loss
    if (!this.isRoundOver) {
      if (this.p1.health <= 0 && this.p2.health <= 0) {
        this.isRoundOver = true;
        this.winner = 0;
        events.push({ type: 'KO', text: 'DOUBLE K.O.!' });
        sound.playKO();
      } else if (this.p1.health <= 0) {
        this.isRoundOver = true;
        this.winner = 2;
        this.p2.state = 'VICTORY';
        events.push({ type: 'KO', text: 'K.O.!' });
        sound.playKO();
      } else if (this.p2.health <= 0) {
        this.isRoundOver = true;
        this.winner = 1;
        this.p1.state = 'VICTORY';
        events.push({ type: 'KO', text: 'K.O.!' });
        sound.playKO();
      }
    }

    return events;
  }

  private updateFighter(
    fighter: ActiveFighter,
    opponent: ActiveFighter,
    input: InputState,
    history: { input: InputState; frame: number }[],
    lastTap: { dir: string; frame: number },
    events: FightEvent[]
  ) {
    fighter.stateFrame++;

    // Face each other unless attacking/rolling
    if (fighter.state !== 'ATTACK' && fighter.state !== 'ROLL_FWD' && fighter.state !== 'ROLL_BACK' && fighter.state !== 'DOWN') {
      fighter.facing = fighter.x < opponent.x ? 1 : -1;
    }

    // Invincibility countdown
    if (fighter.invincibleTimer > 0) fighter.invincibleTimer--;

    // MAX Mode Countdown
    if (fighter.inMaxMode) {
      fighter.maxModeTimer--;
      if (fighter.maxModeTimer <= 0) {
        fighter.inMaxMode = false;
      }
    }

    // Stun Timers
    if (fighter.hitStunTimer > 0) {
      fighter.hitStunTimer--;
      if (fighter.hitStunTimer === 0 && fighter.isGrounded) {
        fighter.state = 'IDLE';
        fighter.isCounterHit = false;
      }
    }

    if (fighter.blockStunTimer > 0) {
      fighter.blockStunTimer--;
      if (fighter.blockStunTimer === 0) {
        fighter.state = 'IDLE';
      }
    }

    if (fighter.guardCrushTimer > 0) {
      fighter.guardCrushTimer--;
      if (fighter.guardCrushTimer === 0) {
        fighter.guardMeter = fighter.maxGuardMeter;
        fighter.state = 'IDLE';
      }
    } else {
      // Slowly regenerate guard meter when not blocking
      if (fighter.guardMeter < fighter.maxGuardMeter && fighter.state !== 'BLOCK_STAND' && fighter.state !== 'BLOCK_CROUCH') {
        fighter.guardMeter = Math.min(fighter.maxGuardMeter, fighter.guardMeter + 0.08);
      }
    }

    // Gravity & Grounding
    if (!fighter.isGrounded) {
      fighter.vy -= 0.85; // Gravity
      fighter.y += fighter.vy;
      fighter.x += fighter.vx;

      if (fighter.y <= 0) {
        fighter.y = 0;
        fighter.vy = 0;
        fighter.vx = 0;
        fighter.isGrounded = true;
        fighter.hasAirActionUsed = false;
        if (fighter.state === 'HIT_AIR') {
          fighter.state = 'DOWN';
          fighter.stateFrame = 0;
          sound.playKnockdown();
        } else if (fighter.state === 'JUMPING') {
          fighter.state = 'IDLE';
        }
      }
    } else {
      // Horizontal friction on ground
      fighter.vx *= 0.82;
      fighter.x += fighter.vx;
    }

    // Boundaries
    const minX = 60;
    const maxX = this.arenaWidth - 60;
    fighter.x = Math.max(minX, Math.min(maxX, fighter.x));

    // Handle DOWN and WAKE UP
    if (fighter.state === 'DOWN') {
      if (fighter.stateFrame > 28) {
        fighter.state = 'WAKE_UP';
        fighter.stateFrame = 0;
        fighter.invincibleTimer = 16; // Wakeup invulnerability
      }
      return;
    }
    if (fighter.state === 'WAKE_UP') {
      if (fighter.stateFrame > 14) {
        fighter.state = 'IDLE';
      }
      return;
    }

    // If currently in hitstun, blockstun, or guard crush, cannot perform new inputs
    if (fighter.hitStunTimer > 0 || fighter.blockStunTimer > 0 || fighter.guardCrushTimer > 0) {
      return;
    }

    // Handle Roll (Emergency Escape / KOF Roll)
    if (fighter.state === 'ROLL_FWD' || fighter.state === 'ROLL_BACK') {
      const rollDir = fighter.state === 'ROLL_FWD' ? fighter.facing : -fighter.facing;
      fighter.x += rollDir * 8;
      // Invulnerable during first 16 frames
      fighter.invincibleTimer = Math.max(fighter.invincibleTimer, 1);
      if (fighter.stateFrame > 22) {
        fighter.state = 'IDLE';
      }
      return;
    }

    // Handle Attack Execution
    if (fighter.state === 'ATTACK' && fighter.currentMove) {
      this.advanceAttackFrame(fighter, opponent, input, events);
      return;
    }

    // --- CHECK FOR MOVES & INPUTS ---

    // 1. Roll Input (roll key or LP + LK)
    if ((input.roll || (input.lightPunch && input.lightKick)) && fighter.isGrounded) {
      const rollDir = (input.right && fighter.facing === 1) || (input.left && fighter.facing === -1) || (!input.left && !input.right);
      fighter.state = rollDir ? 'ROLL_FWD' : 'ROLL_BACK';
      fighter.stateFrame = 0;
      sound.playRoll();
      return;
    }

    // 2. MAX Mode Activation (maxMode key or LK + HP)
    if ((input.maxMode || (input.lightKick && input.heavyPunch)) && fighter.superMeter >= 100 && !fighter.inMaxMode) {
      fighter.superMeter -= 100;
      fighter.inMaxMode = true;
      fighter.maxModeTimer = 400; // ~6.6 seconds
      fighter.invincibleTimer = 8;
      sound.playMaxModeActivate();
      events.push({ type: 'SUPER_FLASH', text: 'MAX MODE ACTIVATED!' });
      return;
    }

    // 3. Special & Super Moves (Buffer Parsing)
    const executedMove = this.detectMoveInput(fighter, input, history);
    if (executedMove) {
      this.startMove(fighter, executedMove, events);
      return;
    }

    // 4. Basic Normals
    if (input.lightPunch) {
      const move = fighter.definition.moves.find(m => m.input === '5A');
      if (move) this.startMove(fighter, move, events);
      return;
    }
    if (input.lightKick) {
      const move = fighter.definition.moves.find(m => m.input === (input.down ? '2B' : '5B')) || fighter.definition.moves.find(m => m.input === '5B');
      if (move) this.startMove(fighter, move, events);
      return;
    }
    if (input.heavyPunch) {
      const move = fighter.definition.moves.find(m => m.input === '5C');
      if (move) this.startMove(fighter, move, events);
      return;
    }
    if (input.heavyKick) {
      const move = fighter.definition.moves.find(m => m.input === (input.down ? '2D' : '5D')) || fighter.definition.moves.find(m => m.input === '5D');
      if (move) this.startMove(fighter, move, events);
      return;
    }

    // 5. Jump & Hop
    if (input.up && fighter.isGrounded) {
      const isSuperJump = history.some(h => h.input.down && Date.now() - h.frame < 180);
      fighter.isGrounded = false;
      fighter.state = 'JUMPING';
      fighter.stateFrame = 0;
      fighter.vy = isSuperJump ? fighter.definition.stats.jumpForce * 1.25 : fighter.definition.stats.jumpForce;
      fighter.vx = input.right ? fighter.definition.stats.walkSpeed * (isSuperJump ? 1.5 : 1.1) : (input.left ? -fighter.definition.stats.walkSpeed * (isSuperJump ? 1.5 : 1.1) : 0);
      sound.playJump();
      return;
    }

    // 6. Crouch
    if (input.down && fighter.isGrounded) {
      fighter.isCrouching = true;
      // Check block crouch
      const opponentAttacking = opponent.state === 'ATTACK';
      const holdingBack = (fighter.facing === 1 && input.left) || (fighter.facing === -1 && input.right);
      fighter.state = (opponentAttacking && holdingBack) ? 'BLOCK_CROUCH' : 'CROUCH';
      return;
    } else {
      fighter.isCrouching = false;
    }

    // 7. Movement & Dashing
    const now = Date.now();
    const isMovingForward = (fighter.facing === 1 && input.right) || (fighter.facing === -1 && input.left);
    const isMovingBack = (fighter.facing === 1 && input.left) || (fighter.facing === -1 && input.right);

    // Check Guard Stand
    if (isMovingBack && opponent.state === 'ATTACK' && fighter.isGrounded) {
      fighter.state = 'BLOCK_STAND';
      return;
    }

    if (isMovingForward) {
      // Double tap forward check
      if (lastTap.dir === 'FWD' && now - lastTap.frame < 220) {
        fighter.state = 'DASH_FWD';
        fighter.vx = fighter.facing * fighter.definition.stats.dashSpeed;
        sound.playDash();
      } else {
        fighter.state = 'WALK_FWD';
        fighter.x += fighter.facing * fighter.definition.stats.walkSpeed;
      }
    } else if (isMovingBack) {
      // Double tap back check
      if (lastTap.dir === 'BACK' && now - lastTap.frame < 220) {
        fighter.state = 'DASH_BACK';
        fighter.vx = -fighter.facing * (fighter.definition.stats.dashSpeed * 0.85);
        sound.playDash();
      } else {
        fighter.state = 'WALK_BACK';
        fighter.x -= fighter.facing * (fighter.definition.stats.walkSpeed * 0.8);
      }
    } else {
      fighter.state = 'IDLE';
    }

    // Record last directional taps for dash
    if (input.right && lastTap.dir !== 'RIGHT') {
      lastTap.dir = fighter.facing === 1 ? 'FWD' : 'BACK';
      lastTap.frame = now;
    } else if (input.left && lastTap.dir !== 'LEFT') {
      lastTap.dir = fighter.facing === -1 ? 'FWD' : 'BACK';
      lastTap.frame = now;
    }
  }

  private startMove(fighter: ActiveFighter, move: MoveFrameData, events: FightEvent[]) {
    // Check meter requirements
    if (move.meterCost > 0) {
      if (fighter.superMeter < move.meterCost && !fighter.inMaxMode) {
        return; // Insufficient meter
      }
      if (!fighter.inMaxMode) {
        fighter.superMeter -= move.meterCost;
      }
      // Super Flash trigger!
      sound.playSuperFlash();
      this.superDim = 1.0;
      this.hitStopFrames = 15;
      events.push({
        type: 'SUPER_FLASH',
        text: move.name.toUpperCase(),
        x: fighter.x,
        y: this.groundY - fighter.y - 70
      });
    } else {
      sound.playSwing();
    }

    fighter.state = 'ATTACK';
    fighter.currentMove = move;
    fighter.movePhase = 'STARTUP';
    fighter.moveFrameCounter = 0;
    fighter.hasHitInActivePhase = false;
    fighter.isAttacking = true;
  }

  private advanceAttackFrame(
    fighter: ActiveFighter,
    opponent: ActiveFighter,
    input: InputState,
    events: FightEvent[]
  ) {
    if (!fighter.currentMove) return;
    const move = fighter.currentMove;
    fighter.moveFrameCounter++;

    // Check CANCELS during active/hit phase
    if (fighter.hasHitInActivePhase) {
      // Super Cancel or MAX Cancel
      if ((move.canSuperCancel || fighter.inMaxMode) && (input.lightPunch || input.lightKick || input.heavyPunch || input.heavyKick)) {
        const cancelCandidate = this.detectMoveInput(fighter, input, this.p1InputHistory);
        if (cancelCandidate && (cancelCandidate.type === 'SuperDM' || cancelCandidate.type === 'MAX_SDM' || fighter.inMaxMode)) {
          this.startMove(fighter, cancelCandidate, events);
          return;
        }
      }
    }

    if (fighter.movePhase === 'STARTUP') {
      if (fighter.moveFrameCounter >= move.startupFrames) {
        fighter.movePhase = 'ACTIVE';
        fighter.moveFrameCounter = 0;
      }
    } else if (fighter.movePhase === 'ACTIVE') {
      if (fighter.moveFrameCounter >= move.activeFrames) {
        fighter.movePhase = 'RECOVERY';
        fighter.moveFrameCounter = 0;
      }
    } else if (fighter.movePhase === 'RECOVERY') {
      if (fighter.moveFrameCounter >= move.recoveryFrames) {
        fighter.state = fighter.isGrounded ? 'IDLE' : 'JUMPING';
        fighter.currentMove = null;
        fighter.movePhase = 'NONE';
        fighter.isAttacking = false;
        fighter.hasHitInActivePhase = false;
      }
    }
  }

  private detectMoveInput(
    fighter: ActiveFighter,
    input: InputState,
    history: { input: InputState; frame: number }[]
  ): MoveFrameData | null {
    if (history.length < 5) return null;
    const moves = fighter.definition.moves;

    const anyPunch = input.lightPunch || input.heavyPunch;
    const anyKick = input.lightKick || input.heavyKick;

    // 1. Super / Climax Inputs (236236P or 2141236K)
    if (anyPunch) {
      const superP = moves.find(m => m.type === 'SuperDM' && m.input.includes('236236'));
      if (superP && this.checkMotion236236(history, fighter.facing)) {
        return superP;
      }
    }
    if (anyKick) {
      const superK = moves.find(m => (m.type === 'SuperDM' || m.type === 'MAX_SDM') && m.input.includes('236236'));
      if (superK && this.checkMotion236236(history, fighter.facing)) {
        return superK;
      }
      const climax = moves.find(m => m.type === 'MAX_SDM');
      if (climax && this.checkMotion2141236(history, fighter.facing)) {
        return climax;
      }
    }

    // 2. Dragon Punch (623P or 623K)
    if (anyPunch || anyKick) {
      const dp = moves.find(m => m.input.includes('623') && (anyPunch ? m.input.includes('P') : m.input.includes('K')));
      if (dp && this.checkMotion623(history, fighter.facing)) {
        return dp;
      }
    }

    // 3. Half Circle Forward Throw (41236P)
    if (anyPunch) {
      const hcf = moves.find(m => m.input.includes('41236'));
      if (hcf && this.checkMotion41236(history, fighter.facing)) {
        return hcf;
      }
    }

    // 4. Quarter Circle Forward (236P or 236K)
    if (anyPunch) {
      const qcfP = moves.find(m => m.input.includes('236P'));
      if (qcfP && this.checkMotion236(history, fighter.facing)) {
        return qcfP;
      }
    }
    if (anyKick) {
      const qcfK = moves.find(m => m.input.includes('236K'));
      if (qcfK && this.checkMotion236(history, fighter.facing)) {
        return qcfK;
      }
    }

    // 5. Quarter Circle Back (214P or 214K)
    if (anyPunch) {
      const qcbP = moves.find(m => m.input.includes('214P'));
      if (qcbP && this.checkMotion214(history, fighter.facing)) {
        return qcbP;
      }
    }
    if (anyKick) {
      const qcbK = moves.find(m => m.input.includes('214K'));
      if (qcbK && this.checkMotion214(history, fighter.facing)) {
        return qcbK;
      }
    }

    return null;
  }

  // --- MOTION RECOGNIZERS (Fixed with Facing awareness) ---
  private checkMotion236(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const fwdKey = facing === 1 ? 'right' : 'left';
    let hasDown = false;
    for (let i = history.length - 1; i >= Math.max(0, history.length - 15); i--) {
      const inp = history[i].input;
      if (inp[fwdKey]) {
        // Look back for down
        for (let j = i - 1; j >= Math.max(0, history.length - 15); j--) {
          if (history[j].input.down) {
            hasDown = true;
            break;
          }
        }
        if (hasDown) return true;
      }
    }
    return false;
  }

  private checkMotion214(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const backKey = facing === 1 ? 'left' : 'right';
    let hasDown = false;
    for (let i = history.length - 1; i >= Math.max(0, history.length - 15); i--) {
      const inp = history[i].input;
      if (inp[backKey]) {
        for (let j = i - 1; j >= Math.max(0, history.length - 15); j--) {
          if (history[j].input.down) {
            hasDown = true;
            break;
          }
        }
        if (hasDown) return true;
      }
    }
    return false;
  }

  private checkMotion623(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const fwdKey = facing === 1 ? 'right' : 'left';
    // Must see Fwd, then Down, then Fwd
    let step = 3;
    for (let i = history.length - 1; i >= Math.max(0, history.length - 20); i--) {
      const inp = history[i].input;
      if (step === 3 && inp[fwdKey]) step = 2;
      else if (step === 2 && inp.down) step = 1;
      else if (step === 1 && inp[fwdKey]) return true;
    }
    return false;
  }

  private checkMotion41236(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const fwdKey = facing === 1 ? 'right' : 'left';
    const backKey = facing === 1 ? 'left' : 'right';
    let hasBack = false;
    let hasDown = false;
    for (let i = history.length - 1; i >= Math.max(0, history.length - 25); i--) {
      const inp = history[i].input;
      if (inp[fwdKey]) {
        for (let j = i - 1; j >= Math.max(0, history.length - 25); j--) {
          if (history[j].input.down) hasDown = true;
          if (history[j].input[backKey] && hasDown) {
            hasBack = true;
            break;
          }
        }
        if (hasBack) return true;
      }
    }
    return false;
  }

  private checkMotion236236(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const fwdKey = facing === 1 ? 'right' : 'left';
    let fwdCount = 0;
    for (let i = history.length - 1; i >= Math.max(0, history.length - 30); i--) {
      if (history[i].input[fwdKey]) {
        fwdCount++;
        i -= 3; // skip a few frames
      }
    }
    return fwdCount >= 2;
  }

  private checkMotion2141236(history: { input: InputState; frame: number }[], facing: 1 | -1): boolean {
    const fwdKey = facing === 1 ? 'right' : 'left';
    const backKey = facing === 1 ? 'left' : 'right';
    return history.some(h => h.input[backKey]) && history.some(h => h.input[fwdKey]) && history.some(h => h.input.down);
  }

  private resolvePushboxes(p1: ActiveFighter, p2: ActiveFighter) {
    const dist = Math.abs(p1.x - p2.x);
    const minDistance = 45; // Minimum space fighters can occupy
    if (dist < minDistance && p1.y === 0 && p2.y === 0) {
      // If rolling, allow passing through!
      if (p1.state === 'ROLL_FWD' || p2.state === 'ROLL_FWD') return;

      const overlap = (minDistance - dist) / 2;
      if (p1.x < p2.x) {
        p1.x -= overlap;
        p2.x += overlap;
      } else {
        p1.x += overlap;
        p2.x -= overlap;
      }
    }
  }

  private checkHitCollisions(attacker: ActiveFighter, defender: ActiveFighter, events: FightEvent[]) {
    if (attacker.state !== 'ATTACK' || attacker.movePhase !== 'ACTIVE' || !attacker.currentMove) return;
    if (attacker.hasHitInActivePhase) return;
    if (defender.invincibleTimer > 0 || defender.state === 'DOWN') return;

    const move = attacker.currentMove;
    const reach = move.reach || 70;
    const distance = Math.abs(attacker.x - defender.x);
    const inRange = distance <= reach && (
      (attacker.facing === 1 && defender.x >= attacker.x - 10) ||
      (attacker.facing === -1 && defender.x <= attacker.x + 10)
    );

    if (!inRange) return;

    // Contact point coordinates
    const contactX = (attacker.x + defender.x) / 2;
    const contactY = this.groundY - (move.height === 'head' ? 100 : (move.height === 'low' ? 20 : 65));

    // Check Guard
    let isGuarded = false;
    if (defender.state === 'BLOCK_STAND' || defender.state === 'BLOCK_CROUCH') {
      if (move.guard === 'Unblockable') {
        isGuarded = false;
      } else if (move.guard === 'High' && defender.state === 'BLOCK_CROUCH') {
        isGuarded = false; // Overhead beats crouch block!
      } else if (move.guard === 'Low' && defender.state === 'BLOCK_STAND') {
        isGuarded = false; // Low sweeps beat stand block!
      } else {
        isGuarded = true;
      }
    }

    attacker.hasHitInActivePhase = true;

    if (isGuarded) {
      // BLOCK SUCCESS
      defender.guardMeter -= move.guardDamage;
      defender.blockStunTimer = Math.max(12, 14 + move.onBlockAdvantage);
      sound.playBlock();

      events.push({ type: 'BLOCK', text: 'BLOCKED', x: contactX, y: contactY });

      // Guard Crush Check
      if (defender.guardMeter <= 0) {
        defender.guardCrushTimer = 75; // Heavy stagger!
        defender.state = 'GUARD_CRUSH';
        defender.stateFrame = 0;
        sound.playGuardCrush();
        events.push({ type: 'GUARD_CRUSH', text: 'GUARD CRUSH!!', x: contactX, y: contactY });
      }

      // Small pushback
      defender.x += attacker.facing * 18;
      attacker.x -= attacker.facing * 8;
      return;
    }

    // HIT CONNECTED!
    const isCounter = defender.state === 'ATTACK' && defender.movePhase === 'STARTUP';
    let damage = move.damage * attacker.definition.stats.attackModifier;
    if (isCounter) {
      damage *= 1.25; // 25% Counter damage bonus
      defender.isCounterHit = true;
      sound.playCounterHit();
      events.push({ type: 'COUNTER', text: 'COUNTER HIT!', x: contactX, y: contactY });
    } else {
      if (move.type === 'SuperDM' || move.type === 'MAX_SDM') {
        sound.playHeavyHit(1.3);
      } else if (move.damage > 80) {
        sound.playHeavyHit(1.0);
      } else {
        sound.playLightHit(1.0);
      }
      events.push({ type: 'HIT', x: contactX, y: contactY });
    }

    // Apply Damage & scaling
    damage /= defender.definition.stats.defenseModifier;
    defender.health = Math.max(0, defender.health - damage);

    // Meter gain
    attacker.superMeter = Math.min(attacker.maxSuperMeter, attacker.superMeter + move.meterGain);
    defender.superMeter = Math.min(defender.maxSuperMeter, defender.superMeter + move.meterGain * 0.45);

    // Hitstop
    this.hitStopFrames = move.type === 'SuperDM' || move.type === 'MAX_SDM' ? 10 : (move.damage > 70 ? 6 : 3);

    // Hit effect particle
    this.hitEffects.push({
      x: contactX,
      y: contactY,
      isCounter,
      isSuper: move.type === 'SuperDM' || move.type === 'MAX_SDM',
      frame: 10
    });

    // Combo Counter
    attacker.comboCount++;
    attacker.comboDamage += damage;

    // Apply Knockdown or Hitstun
    if (move.knockdown || defender.state === 'JUMPING') {
      defender.state = 'HIT_AIR';
      defender.vy = 10;
      defender.vx = attacker.facing * 8;
      defender.isGrounded = false;
    } else {
      defender.state = 'HIT';
      defender.stateFrame = 0;
      defender.hitStunTimer = Math.max(16, 18 + move.onHitAdvantage);
      defender.vx = attacker.facing * (move.damage > 70 ? 7 : 3.5);
    }
  }

  private processCpuAI(cpu: ActiveFighter, player: ActiveFighter): InputState {
    const aiInput: InputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      lightPunch: false,
      lightKick: false,
      heavyPunch: false,
      heavyKick: false,
      roll: false,
      maxMode: false
    };

    const dist = Math.abs(cpu.x - player.x);
    const facingPlayer = cpu.x < player.x ? 1 : -1;
    const fwd = facingPlayer === 1 ? 'right' : 'left';
    const back = facingPlayer === 1 ? 'left' : 'right';

    // 1. Reactive Guard: If player attacks, block with 70% probability
    if (player.state === 'ATTACK' && Math.random() < 0.72) {
      aiInput[back] = true;
      if (player.currentMove?.guard === 'Low') {
        aiInput.down = true;
      }
      return aiInput;
    }

    // 2. Anti-Air: If player jumps towards CPU, use DP antiair
    if (player.state === 'JUMPING' && dist < 120 && Math.random() < 0.6) {
      aiInput.lightPunch = true;
      aiInput.up = true;
      return aiInput;
    }

    // 3. MAX Mode activation if low health and has meter
    if (cpu.health < 400 && cpu.superMeter >= 100 && !cpu.inMaxMode && Math.random() < 0.05) {
      aiInput.maxMode = true;
      return aiInput;
    }

    // 4. Super DM when close with meter
    if (cpu.superMeter >= 100 && dist < 110 && Math.random() < 0.1) {
      aiInput.down = true;
      aiInput[fwd] = true;
      aiInput.heavyPunch = true;
      return aiInput;
    }

    // 5. Close range combat
    if (dist < 75) {
      const roll = Math.random();
      if (roll < 0.25) {
        aiInput.lightPunch = true;
      } else if (roll < 0.45) {
        aiInput.lightKick = true;
        aiInput.down = true; // low poke
      } else if (roll < 0.65) {
        aiInput.heavyPunch = true;
      } else if (roll < 0.75) {
        // Roll through
        aiInput.roll = true;
      } else {
        // Step back
        aiInput[back] = true;
      }
    } else if (dist < 180) {
      // Mid range approach
      if (Math.random() < 0.5) {
        aiInput[fwd] = true; // walk in
      } else if (Math.random() < 0.15) {
        // Special move
        aiInput.down = true;
        aiInput[fwd] = true;
        aiInput.heavyPunch = true;
      }
    } else {
      // Long range: advance
      aiInput[fwd] = true;
      if (Math.random() < 0.04) {
        aiInput.up = true; // Short jump in
      }
    }

    return aiInput;
  }

  private checkTimeOut() {
    this.isRoundOver = true;
    if (this.p1.health > this.p2.health) {
      this.winner = 1;
      this.p1.state = 'VICTORY';
    } else if (this.p2.health > this.p1.health) {
      this.winner = 2;
      this.p2.state = 'VICTORY';
    } else {
      this.winner = 0;
    }
    sound.playAnnouncer('TIME UP!');
  }
}
