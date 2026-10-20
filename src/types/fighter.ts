export type DressCode = 
  | 'Casual' 
  | 'Smart Casual' 
  | 'Semi Formal' 
  | 'Coctel' 
  | 'Formal' 
  | 'Black Tie' 
  | 'White Tie';

export type GuardType = 'High' | 'Low' | 'Mid' | 'Unblockable';

export type MoveType = 
  | 'Normal' 
  | 'CommandNormal' 
  | 'Special' 
  | 'SuperDM' 
  | 'MAX_SDM' 
  | 'Throw' 
  | 'Roll'
  | 'Counter';

export interface MoveFrameData {
  id: string;
  name: string;
  input: string; // e.g. "5A", "2B", "236A", "623C", "214D", "236236A"
  inputDisplayName: string; // e.g. "QCF + A", "DP + C", "QCB + B"
  type: MoveType;
  guard: GuardType;
  damage: number;
  meterGain: number;
  meterCost: number; // 0 for normals/specials, 1 for Super, 2 for MAX
  startupFrames: number; // Frames before active
  activeFrames: number;  // Active hitbox frames
  recoveryFrames: number; // Frames after active
  onHitAdvantage: number; // Positive = plus on hit, negative = minus
  onBlockAdvantage: number;
  guardDamage: number; // Depletes guard meter
  stunDamage: number;
  knockdown: boolean;
  canSuperCancel: boolean;
  canMaxCancel: boolean;
  reach: number; // Hitbox range in pixels
  height: 'head' | 'body' | 'low';
  description: string;
}

export interface CharacterColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  hair: string;
  details: string;
}

export interface FighterDefinition {
  id: string;
  name: string;
  title: string;
  origin: string;
  dressCode: DressCode;
  martialArt: string;
  bio: string;
  height: string;
  weight: string;
  voicePitch: number; // 0.8 to 1.4 for Web Audio synth grunts
  palette: CharacterColorPalette;
  alternatePalette: CharacterColorPalette;
  stats: {
    health: number; // base 1000
    walkSpeed: number; // 3 to 6
    dashSpeed: number; // 8 to 12
    jumpForce: number; // 13 to 17
    defenseModifier: number; // 0.9 to 1.15
    attackModifier: number;  // 0.9 to 1.2
    guardCrushMax: number;  // 100
  };
  moves: MoveFrameData[];
  quotes: {
    win: string[];
    intro: string[];
    taunt: string;
  };
  portraitUrl?: string;
  spriteSliceIndex?: number;
  spriteSheetUrl?: string;
  spriteCrop?: {
    sx: number;
    sy: number;
    sWidth: number;
    sHeight: number;
    baselineY: number;
  };
}

export type FighterState = 
  | 'IDLE' 
  | 'WALK_FWD' 
  | 'WALK_BACK' 
  | 'DASH_FWD' 
  | 'DASH_BACK' 
  | 'JUMP_START' 
  | 'JUMPING' 
  | 'CROUCH' 
  | 'ATTACK' 
  | 'HIT' 
  | 'HIT_AIR' 
  | 'BLOCK_STAND' 
  | 'BLOCK_CROUCH' 
  | 'GUARD_CRUSH' 
  | 'ROLL_FWD' 
  | 'ROLL_BACK' 
  | 'DOWN' 
  | 'WAKE_UP' 
  | 'VICTORY' 
  | 'DEFEAT';

export interface ActiveFighter {
  definition: FighterDefinition;
  paletteIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = facing right, -1 = facing left
  state: FighterState;
  stateFrame: number;
  currentMove: MoveFrameData | null;
  movePhase: 'STARTUP' | 'ACTIVE' | 'RECOVERY' | 'NONE';
  moveFrameCounter: number;
  hasHitInActivePhase: boolean;
  health: number;
  maxHealth: number;
  guardMeter: number;
  maxGuardMeter: number;
  guardCrushTimer: number;
  superMeter: number; // 0 to 300 (3 stocks)
  maxSuperMeter: number;
  inMaxMode: boolean;
  maxModeTimer: number; // counts down when active
  comboCount: number;
  comboDamage: number;
  hitStunTimer: number;
  blockStunTimer: number;
  invincibleTimer: number;
  isCrouching: boolean;
  isGrounded: boolean;
  isAttacking: boolean;
  hasAirActionUsed: boolean;
  isCounterHit: boolean;
}

export interface StageDefinition {
  id: string;
  name: string;
  dressCodeLevel: DressCode;
  location: string;
  description: string;
  imageKey?: string;
  bgGradient: string;
  groundColor: string;
  musicStyle: 'rock' | 'synthwave' | 'jazz' | 'orchestral' | 'funk' | 'hyperpop' | 'anthem';
  crowdCheerPitch: number;
  ambientParticles: 'sparks' | 'steam' | 'petals' | 'confetti' | 'flashes' | 'dust';
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  lightPunch: boolean;
  lightKick: boolean;
  heavyPunch: boolean;
  heavyKick: boolean;
  roll: boolean;
  maxMode: boolean;
}

export type GameMode = 'ARCADE' | 'VERSUS_CPU' | 'VERSUS_2P' | 'TRAINING' | 'CREATOR';
