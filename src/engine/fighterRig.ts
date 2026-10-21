import { ActiveFighter } from '../types/fighter';

/**
 * Skeletal rig for the fighters.
 * Everything is authored for a fighter FACING RIGHT, origin = ground contact point, y negative = up.
 * Feet are absolute targets, hands are relative to the shoulder, legs/arms are solved with 2-bone IK.
 */
export type V = [number, number];

export type FaceMood = 'normal' | 'shout' | 'hurt' | 'grit' | 'dizzy' | 'smile';

export interface Pose {
  hip: V;
  lean: number; // torso lean in degrees, + = forward
  head: number; // extra head tilt in degrees
  rf: V; // rear foot (ground = y 0)
  ff: V; // front foot
  rh: V; // rear hand, relative to shoulder
  fh: V; // front hand, relative to shoulder
  rot: number; // whole body rotation (deg) around the hip
  lift: number; // whole body vertical lift
  face: FaceMood;
}

export interface Build {
  w: number; // body width factor
  h: number; // body height factor
  female: boolean;
}

export interface Skeleton {
  hip: V;
  shoulder: V;
  headC: V;
  lean: number; // rad
  headAng: number; // rad
  rKnee: V; rAnkle: V; rToeAng: number;
  fKnee: V; fAnkle: V; fToeAng: number;
  rElbow: V; rHand: V;
  fElbow: V; fHand: V;
  pose: Pose;
}

const DEG = Math.PI / 180;
export const ANKLE = 7;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const ease = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpV(a.hip, b.hip, t),
    lean: lerp(a.lean, b.lean, t),
    head: lerp(a.head, b.head, t),
    rf: lerpV(a.rf, b.rf, t),
    ff: lerpV(a.ff, b.ff, t),
    rh: lerpV(a.rh, b.rh, t),
    fh: lerpV(a.fh, b.fh, t),
    rot: lerp(a.rot, b.rot, t),
    lift: lerp(a.lift, b.lift, t),
    face: t < 0.5 ? a.face : b.face,
  };
}

export const STANCE: Pose = {
  hip: [0, -91], lean: 7, head: 0,
  rf: [-27, 0], ff: [31, 0],
  rh: [26, -16], fh: [38, -2],
  rot: 0, lift: 0, face: 'normal',
};

const P = (o: Partial<Pose>): Pose => ({ ...STANCE, ...o });

/** Limp body authored upright; rotating -90deg around the hip lays it flat on the floor. */
const LYING: Pose = {
  hip: [-18, -13], lean: 0, head: -10,
  rf: [-22, 74], ff: [-14, 76],
  rh: [-4, 56], fh: [6, 54],
  rot: -90, lift: 0, face: 'hurt',
};

/** IK for a 2-bone chain. side = +1 bends one way, -1 the other. */
function ik(root: V, target: V, l1: number, l2: number, side: number): { mid: V; end: V } {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const dist = Math.hypot(dx, dy);
  const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.01, dist));
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const mid: V = [root[0] + Math.cos(base + side * A) * l1, root[1] + Math.sin(base + side * A) * l1];
  const end: V = [root[0] + Math.cos(base) * d, root[1] + Math.sin(base) * d];
  return { mid, end };
}

export function solve(pose: Pose, build: Build): Skeleton {
  const h = build.h;
  const thigh = 48 * h, shin = 48 * h, torso = 62 * h, upper = 35 * h, fore = 33 * h;
  const hip: V = [pose.hip[0], pose.hip[1] * 0.93 * h + pose.lift];
  const lean = pose.lean * DEG;
  const shoulder: V = [hip[0] + Math.sin(lean) * torso, hip[1] - Math.cos(lean) * torso];
  const headAng = lean + pose.head * DEG;
  const headC: V = [shoulder[0] + Math.sin(headAng) * 24 * h, shoulder[1] - Math.cos(headAng) * 24 * h];

  const rAnkleT: V = [pose.rf[0], pose.rf[1] - ANKLE + pose.lift];
  const fAnkleT: V = [pose.ff[0], pose.ff[1] - ANKLE + pose.lift];
  const rLeg = ik([hip[0] - 3, hip[1]], rAnkleT, thigh, shin, -1);
  const fLeg = ik([hip[0] + 4, hip[1]], fAnkleT, thigh, shin, -1);

  const rS: V = [shoulder[0] - 2, shoulder[1] + 3];
  const fS: V = [shoulder[0] + 3, shoulder[1] + 4];
  const rArm = ik(rS, [rS[0] + pose.rh[0], rS[1] + pose.rh[1]], upper, fore, 1);
  const fArm = ik(fS, [fS[0] + pose.fh[0], fS[1] + pose.fh[1]], upper, fore, 1);

  const toeAng = (knee: V, ankle: V) => {
    const lifted = ankle[1] < -ANKLE + pose.lift - 9;
    if (!lifted) return 0;
    const a = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]);
    return Math.max(-Math.PI * 0.55, Math.min(Math.PI * 0.45, a * 0.85));
  };

  return {
    hip, shoulder, headC, lean, headAng,
    rKnee: rLeg.mid, rAnkle: rLeg.end, rToeAng: toeAng(rLeg.mid, rLeg.end),
    fKnee: fLeg.mid, fAnkle: fLeg.end, fToeAng: toeAng(fLeg.mid, fLeg.end),
    rElbow: rArm.mid, rHand: rArm.end,
    fElbow: fArm.mid, fHand: fArm.end,
    pose,
  };
}

// ---------------------------------------------------------------------------------------------
// ATTACK LIBRARY: [windup, strike]
// ---------------------------------------------------------------------------------------------
type Strike = { wind: Pose; hit: Pose };

function strikeFor(id: string): Strike {
  const i = id.toLowerCase();
  const crouchBase = { hip: [0, -46] as V, lean: 30, rf: [-32, 0] as V, ff: [36, 0] as V };

  if (i.includes('super') || i.includes('max')) {
    return {
      wind: P({ lean: -14, hip: [-6, -78], rf: [-34, 0], ff: [20, 0], fh: [-30, -22], rh: [-34, -8], face: 'grit' }),
      hit: P({ lean: 30, hip: [16, -80], rf: [-26, 0], ff: [52, 0], fh: [80, -10], rh: [74, -20], face: 'shout' }),
    };
  }
  if (i.includes('5a')) {
    return {
      wind: P({ lean: 3, fh: [16, 8] }),
      hit: P({ lean: 13, hip: [6, -89], ff: [35, 0], fh: [72, -7], rh: [20, -18], face: 'shout' }),
    };
  }
  if (i.includes('5c')) {
    return {
      wind: P({ lean: -5, hip: [-5, -88], rh: [4, 12], fh: [34, -8] }),
      hit: P({ lean: 26, hip: [13, -83], rf: [-24, 0], ff: [46, 0], rh: [76, -6], fh: [20, -10], face: 'shout' }),
    };
  }
  if (i.includes('5b')) {
    return {
      wind: P({ ff: [32, -30], lean: 4 }),
      hit: P({ lean: -4, hip: [-2, -92], ff: [72, -40], fh: [26, -14], rh: [8, -4], face: 'shout' }),
    };
  }
  if (i.includes('5d')) {
    return {
      wind: P({ ff: [26, -66], lean: -4, hip: [-4, -91] }),
      hit: P({ lean: -18, hip: [-8, -90], rf: [-24, 0], ff: [88, -98], fh: [20, 12], rh: [-30, -10], face: 'shout', head: 8 }),
    };
  }
  if (i.includes('2d')) {
    return {
      wind: P({ ...crouchBase, fh: [30, 14], rh: [8, 20] }),
      hit: P({ hip: [-10, -34], lean: 38, rf: [-30, 0], ff: [100, -3], fh: [34, 22], rh: [-10, 28], face: 'shout' }),
    };
  }
  if (i.includes('dp_k')) {
    return {
      wind: P({ ...crouchBase, fh: [20, 10], rh: [6, 14] }),
      hit: P({ hip: [4, -90], lean: -10, rf: [-6, -66], ff: [46, -122], fh: [22, -38], rh: [-8, -44], lift: -40, face: 'shout' }),
    };
  }
  if (i.includes('dp_')) {
    return {
      wind: P({ ...crouchBase, fh: [20, 10], rh: [6, 14] }),
      hit: P({ hip: [6, -90], lean: 6, rf: [-14, -34], ff: [24, -52], fh: [16, -76], rh: [6, -30], lift: -38, face: 'shout' }),
    };
  }
  if (i.includes('qcf_k')) {
    return {
      wind: P({ lean: -6, hip: [-6, -84], ff: [26, -34] }),
      hit: P({ lean: -38, hip: [2, -92], rf: [30, -92], ff: [90, -62], fh: [-6, -24], rh: [-24, -10], lift: -22, face: 'shout' }),
    };
  }
  if (i.includes('qcf')) {
    return {
      wind: P({ lean: -4, hip: [-4, -84], fh: [4, -4], rh: [0, 0], rf: [-30, 0] }),
      hit: P({ lean: 27, hip: [14, -85], rf: [-28, 0], ff: [48, 0], fh: [76, -8], rh: [70, -16], face: 'shout' }),
    };
  }
  if (i.includes('qcb_k')) {
    return {
      wind: P({ lean: -12, rh: [-20, -10], fh: [-16, 0] }),
      hit: P({ lean: -22, hip: [-4, -90], rf: [-42, -4], ff: [92, -82], fh: [-34, -28], rh: [-40, -16], head: 6, lift: -8, face: 'shout' }),
    };
  }
  if (i.includes('qcb')) {
    return {
      wind: P({ hip: [-4, -62], lean: 14, fh: [30, 20], rh: [10, 28] }),
      hit: P({ hip: [8, -60], lean: 22, rf: [-34, 0], ff: [52, 0], fh: [64, 18], rh: [44, 22], face: 'shout' }),
    };
  }
  if (i.includes('hcf')) {
    return {
      wind: P({ lean: 4, fh: [40, -20], rh: [30, -28] }),
      hit: P({ lean: 22, hip: [8, -86], ff: [44, 0], fh: [66, -14], rh: [64, -28], face: 'shout' }),
    };
  }
  // generic strike
  return {
    wind: P({ lean: 2, fh: [18, 8] }),
    hit: P({ lean: 14, hip: [6, -89], ff: [35, 0], fh: [70, -6], face: 'shout' }),
  };
}

// ---------------------------------------------------------------------------------------------
// STATE -> POSE
// ---------------------------------------------------------------------------------------------
export function poseForFighter(f: ActiveFighter, isCasualBouncer: boolean): Pose {
  const t = f.stateFrame;
  const idle = (): Pose => {
    const bob = Math.sin(t * 0.13) * 2.2;
    const sway = Math.sin(t * 0.13 + 1) * 2.5;
    const bounce = isCasualBouncer ? Math.abs(Math.sin(t * 0.2)) * 3 : 0;
    return P({
      hip: [0, -91 + bob - bounce],
      lean: 7 + Math.sin(t * 0.13) * 0.8,
      rh: [26 + sway * 0.4, -16 + bob * 0.6],
      fh: [38 + sway * 0.6, -2 + bob * 0.8],
      rf: [-27 - Math.sin(t * 0.13) * 0.8, 0],
    });
  };

  switch (f.state) {
    case 'IDLE':
      return idle();

    case 'WALK_FWD':
    case 'WALK_BACK': {
      const dir = f.state === 'WALK_FWD' ? 1 : -1;
      const p = t * 0.24 * dir;
      const stride = 24;
      const lift = 15;
      const fx = Math.sin(p) * stride;
      const rx = -Math.sin(p) * stride;
      const fy = -Math.max(0, Math.cos(p)) * lift;
      const ry = -Math.max(0, -Math.cos(p)) * lift;
      const bob = Math.abs(Math.sin(p)) * 3;
      return P({
        hip: [0, -90 + bob], lean: 6 + dir * 2,
        ff: [31 + fx, fy], rf: [-27 + rx, ry],
        fh: [38 - fx * 0.15, -2], rh: [26 + rx * 0.15, -16],
      });
    }

    case 'DASH_FWD': {
      const p = t * 0.55;
      return P({
        hip: [6, -78], lean: 28,
        ff: [34 + Math.sin(p) * 20, -Math.max(0, Math.cos(p)) * 24],
        rf: [-30 - Math.sin(p) * 20, -Math.max(0, -Math.cos(p)) * 24],
        fh: [-6, 18], rh: [-22, 6], face: 'grit',
      });
    }

    case 'DASH_BACK':
      return P({
        hip: [-6, -82], lean: -8, lift: -10,
        ff: [30, -18], rf: [-30, -8],
        fh: [34, -4], rh: [22, -14], face: 'grit',
      });

    case 'JUMP_START':
      return P({ hip: [0, -66], lean: 16, ff: [34, 0], rf: [-30, 0], fh: [20, 14], rh: [4, 12] });

    case 'JUMPING': {
      const rising = f.vy > 0;
      return rising
        ? P({ hip: [0, -86], lean: 8, ff: [26, -48], rf: [-14, -34], fh: [38, -10], rh: [24, -22] })
        : P({ hip: [0, -90], lean: 4, ff: [30, -26], rf: [-24, -34], fh: [30, -26], rh: [14, -32] });
    }

    case 'CROUCH':
      return P({
        hip: [-2, -48 + Math.sin(t * 0.13) * 1.2], lean: 28,
        rf: [-32, 0], ff: [37, 0], fh: [40, 4], rh: [28, -8],
      });

    case 'BLOCK_STAND':
      return P({ hip: [-4, -89], lean: -2, fh: [24, -30], rh: [16, -22], face: 'grit', head: -4 });

    case 'BLOCK_CROUCH':
      return P({ hip: [-6, -48], lean: 20, rf: [-32, 0], ff: [37, 0], fh: [24, -28], rh: [14, -20], face: 'grit' });

    case 'GUARD_CRUSH': {
      const wob = Math.sin(t * 0.4) * 3;
      return P({ hip: [-8, -84], lean: -10 + wob, head: 18, fh: [6, 28], rh: [-8, 30], face: 'dizzy', ff: [26, 0], rf: [-30, 0] });
    }

    case 'HIT': {
      const k = ease(1 - Math.min(1, t / 14));
      return P({
        hip: [-8 * k - 2, -88], lean: -22 * k + 4, head: -16 * k,
        fh: [14, 30 * k], rh: [-4, 24 * k], rf: [-32, 0], ff: [28, 0], face: 'hurt',
      });
    }

    case 'HIT_AIR':
      return P({ hip: [-6, -86], lean: -34, head: -16, rot: -38, ff: [22, -50], rf: [-24, -40], fh: [22, 28], rh: [-6, 32], face: 'hurt' });

    case 'DOWN':
    case 'DEFEAT':
      return mixPose(P({ hip: [-8, -86], lean: -24, head: -14, fh: [14, 30], rh: [-4, 24], face: 'hurt' }), LYING, ease(t / 9));

    case 'WAKE_UP':
      return mixPose({ ...LYING, face: 'grit' }, STANCE, ease(t / 20));

    case 'ROLL_FWD':
    case 'ROLL_BACK': {
      const dir = f.state === 'ROLL_FWD' ? 1 : -1;
      return P({
        hip: [0, -44], lean: 40 * dir, rot: (t * 28 * dir) % 360,
        rf: [-12, -22], ff: [16, -18], fh: [24, 12], rh: [12, 16], face: 'grit',
      });
    }

    case 'VICTORY': {
      const wave = Math.sin(t * 0.18);
      return P({
        hip: [0, -92], lean: 4, rf: [-24, 0], ff: [26, 0],
        fh: [18, -78 + wave * 4], rh: [-14, 6], face: 'smile', head: -6,
      });
    }

    case 'ATTACK': {
      const m = f.currentMove;
      if (!m) return idle();
      const s = strikeFor(m.id);
      const base = idle();
      if (f.movePhase === 'STARTUP') {
        const tt = ease(f.moveFrameCounter / Math.max(1, m.startupFrames));
        return mixPose(base, s.wind, tt);
      }
      if (f.movePhase === 'ACTIVE') {
        const tt = ease((f.moveFrameCounter + 1) / Math.max(1, Math.min(3, m.activeFrames)));
        return mixPose(s.wind, s.hit, tt);
      }
      const tt = ease(f.moveFrameCounter / Math.max(1, m.recoveryFrames));
      return mixPose(s.hit, base, tt);
    }

    default:
      return idle();
  }
}
