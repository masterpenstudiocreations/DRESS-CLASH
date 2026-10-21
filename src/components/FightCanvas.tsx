import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActiveFighter, FighterDefinition, GameMode, InputState, StageDefinition } from '../types/fighter';
import { FightingEngine } from '../engine/fightingEngine';
import { CharacterRenderer } from '../engine/characterRenderer';
import { StageRenderer } from '../engine/stageRenderer';
import { ArcadeHUD } from './ArcadeHUD';
import { sound } from '../audio/soundEngine';
import { Pause, RotateCcw, ArrowLeft, Eye, ShieldAlert, Zap } from 'lucide-react';

interface FightCanvasProps {
  p1Def: FighterDefinition;
  p2Def: FighterDefinition;
  stage: StageDefinition;
  gameMode: GameMode;
  onMatchEnd: (winner: 1 | 2 | 0, stats: { p1Hp: number; p2Hp: number; maxCombo: number }) => void;
  onExitFight: () => void;
  scanlinesEnabled: boolean;
}

export const FightCanvas: React.FC<FightCanvasProps> = ({
  p1Def,
  p2Def,
  stage,
  gameMode,
  onMatchEnd,
  onExitFight,
  scanlinesEnabled
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FightingEngine | null>(null);

  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<string | null>('ROUND 1');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showHitboxes, setShowHitboxes] = useState<boolean>(false);
  const [cameraShake, setCameraShake] = useState<number>(0);

  // Training lab states
  const [dummyGuard, setDummyGuard] = useState<'none' | 'all' | 'random'>('none');
  const [, setRenderTrigger] = useState<boolean>(false);

  // Input States
  const p1Inputs = useRef<InputState>({
    up: false, down: false, left: false, right: false,
    lightPunch: false, lightKick: false, heavyPunch: false, heavyKick: false,
    roll: false, maxMode: false
  });

  const p2Inputs = useRef<InputState>({
    up: false, down: false, left: false, right: false,
    lightPunch: false, lightKick: false, heavyPunch: false, heavyKick: false,
    roll: false, maxMode: false
  });

  // Combo HUD state tracking
  const [comboP1, setComboP1] = useState<{ count: number; damage: number }>({ count: 0, damage: 0 });
  const [comboP2, setComboP2] = useState<{ count: number; damage: number }>({ count: 0, damage: 0 });
  const [roundTime, setRoundTime] = useState<number>(99);

  // Initialize engine
  useEffect(() => {
    const isTraining = gameMode === 'TRAINING';
    engineRef.current = new FightingEngine(p1Def, p2Def, isTraining);
    sound.startStageBGM(stage.musicStyle);
    sound.playAnnouncer('ROUND 1... FIGHT!');

    const timeout = setTimeout(() => {
      setAnnouncement(null);
    }, 1800);

    return () => {
      sound.stopBGM();
      clearTimeout(timeout);
    };
  }, [p1Def, p2Def, stage, gameMode]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }

      // Player 1 Keys: WASD + J/K/U/I/L/O
      if (e.code === 'KeyW') p1Inputs.current.up = true;
      if (e.code === 'KeyS') p1Inputs.current.down = true;
      if (e.code === 'KeyA') p1Inputs.current.left = true;
      if (e.code === 'KeyD') p1Inputs.current.right = true;
      if (e.code === 'KeyJ') p1Inputs.current.lightPunch = true;
      if (e.code === 'KeyK') p1Inputs.current.lightKick = true;
      if (e.code === 'KeyU') p1Inputs.current.heavyPunch = true;
      if (e.code === 'KeyI') p1Inputs.current.heavyKick = true;
      if (e.code === 'KeyL') p1Inputs.current.roll = true;
      if (e.code === 'KeyO') p1Inputs.current.maxMode = true;

      // Player 2 Keys (for 2P Versus mode)
      if (gameMode === 'VERSUS_2P') {
        if (e.code === 'ArrowUp') p2Inputs.current.up = true;
        if (e.code === 'ArrowDown') p2Inputs.current.down = true;
        if (e.code === 'ArrowLeft') p2Inputs.current.left = true;
        if (e.code === 'ArrowRight') p2Inputs.current.right = true;
        if (e.code === 'Numpad4' || e.code === 'KeyF') p2Inputs.current.lightPunch = true;
        if (e.code === 'Numpad5' || e.code === 'KeyG') p2Inputs.current.lightKick = true;
        if (e.code === 'Numpad7' || e.code === 'KeyR') p2Inputs.current.heavyPunch = true;
        if (e.code === 'Numpad8' || e.code === 'KeyT') p2Inputs.current.heavyKick = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') p1Inputs.current.up = false;
      if (e.code === 'KeyS') p1Inputs.current.down = false;
      if (e.code === 'KeyA') p1Inputs.current.left = false;
      if (e.code === 'KeyD') p1Inputs.current.right = false;
      if (e.code === 'KeyJ') p1Inputs.current.lightPunch = false;
      if (e.code === 'KeyK') p1Inputs.current.lightKick = false;
      if (e.code === 'KeyU') p1Inputs.current.heavyPunch = false;
      if (e.code === 'KeyI') p1Inputs.current.heavyKick = false;
      if (e.code === 'KeyL') p1Inputs.current.roll = false;
      if (e.code === 'KeyO') p1Inputs.current.maxMode = false;

      if (gameMode === 'VERSUS_2P') {
        if (e.code === 'ArrowUp') p2Inputs.current.up = false;
        if (e.code === 'ArrowDown') p2Inputs.current.down = false;
        if (e.code === 'ArrowLeft') p2Inputs.current.left = false;
        if (e.code === 'ArrowRight') p2Inputs.current.right = false;
        if (e.code === 'Numpad4' || e.code === 'KeyF') p2Inputs.current.lightPunch = false;
        if (e.code === 'Numpad5' || e.code === 'KeyG') p2Inputs.current.lightKick = false;
        if (e.code === 'Numpad7' || e.code === 'KeyR') p2Inputs.current.heavyPunch = false;
        if (e.code === 'Numpad8' || e.code === 'KeyT') p2Inputs.current.heavyKick = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      const engine = engineRef.current;
      if (!engine || isPaused) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      // Check CPU control
      const isCpu = gameMode === 'ARCADE' || gameMode === 'VERSUS_CPU';

      // Engine simulation step
      const events = engine.update(p1Inputs.current, p2Inputs.current, isCpu);

      // Process events
      for (const ev of events) {
        if (ev.type === 'SUPER_FLASH' && ev.text) {
          setAnnouncement(ev.text);
          setCameraShake(18);
          setTimeout(() => setAnnouncement(null), 1200);
        } else if (ev.type === 'COUNTER') {
          setAnnouncement('COUNTER HIT!');
          setCameraShake(12);
          setTimeout(() => setAnnouncement(null), 800);
        } else if (ev.type === 'GUARD_CRUSH') {
          setAnnouncement('GUARD CRUSH!');
          setCameraShake(14);
          setTimeout(() => setAnnouncement(null), 900);
        } else if (ev.type === 'KO') {
          setAnnouncement(ev.text || 'K.O.!');
          setCameraShake(22);
          setTimeout(() => {
            const nextP1Wins = engine.winner === 1 ? p1Wins + 1 : p1Wins;
            const nextP2Wins = engine.winner === 2 ? p2Wins + 1 : p2Wins;
            setP1Wins(nextP1Wins);
            setP2Wins(nextP2Wins);

            // Best of 3 check (or end of match)
            if (nextP1Wins >= 2 || nextP2Wins >= 2 || gameMode === 'ARCADE') {
              onMatchEnd(engine.winner || 1, {
                p1Hp: engine.p1.health,
                p2Hp: engine.p2.health,
                maxCombo: Math.max(engine.p1.comboCount, engine.p2.comboCount)
              });
            } else {
              // Reset for next round
              engineRef.current = new FightingEngine(p1Def, p2Def, gameMode === 'TRAINING');
              setAnnouncement('ROUND 2');
              sound.playAnnouncer('ROUND 2... FIGHT!');
              setTimeout(() => setAnnouncement(null), 1500);
            }
          }, 2600);
        }
      }

      // Sync state to React HUD
      setComboP1({ count: engine.p1.comboCount, damage: engine.p1.comboDamage });
      setComboP2({ count: engine.p2.comboCount, damage: engine.p2.comboDamage });
      setRoundTime(engine.roundTime);

      // Screen Clear & Shake
      ctx.save();
      const shakeX = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake : 0;
      const shakeY = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake : 0;
      ctx.translate(shakeX, shakeY);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // 1. Render Stage (Parallax & Animated Crowd)
      StageRenderer.render(ctx, stage, engine.cameraX, width, height, engine.groundY, engine.superDim);

      // 2. Render Fighters
      CharacterRenderer.render(ctx, engine.p1, showHitboxes, engine.groundY);
      CharacterRenderer.render(ctx, engine.p2, showHitboxes, engine.groundY);

      // 3. Render Hit Sparks
      for (const h of engine.hitEffects) {
        CharacterRenderer.renderHitSpark(ctx, h.x, h.y, h.isCounter, h.isSuper);
      }

      ctx.restore();

      // Camera shake decay
      if (cameraShake > 0) {
        setCameraShake(prev => Math.max(0, prev - 1.2));
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [p1Def, p2Def, stage, gameMode, isPaused, showHitboxes, cameraShake, p1Wins, p2Wins, onMatchEnd]);

  // Touch Virtual Button Handlers
  const handleTouchDown = (key: keyof InputState) => {
    p1Inputs.current[key] = true;
  };
  const handleTouchUp = (key: keyof InputState) => {
    p1Inputs.current[key] = false;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 2D CANVAS ARENA */}
      <canvas
        ref={canvasRef}
        width={1100}
        height={550}
        className="w-full h-full object-contain block mx-auto"
      />

      {/* CRT SCANLINE OVERLAY */}
      {scanlinesEnabled && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] z-30" />
      )}

      {/* ARCADE HUD */}
      {engineRef.current && (
        <ArcadeHUD
          p1={engineRef.current.p1}
          p2={engineRef.current.p2}
          roundTime={roundTime}
          p1Wins={p1Wins}
          p2Wins={p2Wins}
          comboP1={comboP1}
          comboP2={comboP2}
          announcement={announcement}
        />
      )}

      {/* TRAINING LAB DOCK (Only in Training Mode) */}
      {gameMode === 'TRAINING' && engineRef.current && (
        <div className="absolute top-20 left-4 z-40 bg-neutral-950/85 border border-cyan-500/40 p-3 rounded-lg flex flex-col gap-2 font-mono text-xs shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-neutral-800 pb-1">
            <Zap className="w-3.5 h-3.5" />
            LAB: FRAME DATA & HITBOXES
          </div>
          <button
            onClick={() => setShowHitboxes(!showHitboxes)}
            className={`px-2.5 py-1 rounded flex items-center justify-between text-[11px] ${
              showHitboxes ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400' : 'bg-neutral-900 text-neutral-400'
            }`}
          >
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Hitbox Overlay</span>
            <span className="font-bold">{showHitboxes ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={() => {
              CharacterRenderer.useIllustratedSprites = !CharacterRenderer.useIllustratedSprites;
              setRenderTrigger(prev => !prev);
            }}
            className="px-2.5 py-1 rounded flex items-center justify-between text-[11px] bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          >
            <span>Estilo:</span>
            <span className="font-bold text-amber-300">
              {CharacterRenderer.useIllustratedSprites ? 'ILUSTRADO HD' : 'RIG PIXEL-ART IK'}
            </span>
          </button>
          <div className="text-[10px] text-neutral-400 space-y-0.5 pt-1">
            <div>1P State: <span className="text-amber-300 font-bold">{engineRef.current.p1.state}</span></div>
            <div>Move Phase: <span className="text-cyan-300">{engineRef.current.p1.movePhase}</span></div>
            {engineRef.current.p1.currentMove && (
              <div>Move: <span className="text-white">{engineRef.current.p1.currentMove.name} ({engineRef.current.p1.currentMove.damage} dmg)</span></div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE / ON-SCREEN TOUCH ARCADE BUTTONS */}
      <div className="absolute bottom-4 inset-x-4 flex items-end justify-between pointer-events-none z-40 md:opacity-85">
        {/* Virtual Directional Cross */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 bg-neutral-950/40 p-2 rounded-2xl border border-neutral-800 backdrop-blur-sm">
          <button
            onPointerDown={() => handleTouchDown('up')}
            onPointerUp={() => handleTouchUp('up')}
            className="w-12 h-12 bg-neutral-900 active:bg-amber-500 text-neutral-200 active:text-neutral-950 rounded-lg flex items-center justify-center font-bold text-sm shadow cursor-pointer"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onPointerDown={() => handleTouchDown('left')}
              onPointerUp={() => handleTouchUp('left')}
              className="w-12 h-12 bg-neutral-900 active:bg-amber-500 text-neutral-200 active:text-neutral-950 rounded-lg flex items-center justify-center font-bold text-sm shadow cursor-pointer"
            >
              ◀
            </button>
            <button
              onPointerDown={() => handleTouchDown('down')}
              onPointerUp={() => handleTouchUp('down')}
              className="w-12 h-12 bg-neutral-900 active:bg-amber-500 text-neutral-200 active:text-neutral-950 rounded-lg flex items-center justify-center font-bold text-sm shadow cursor-pointer"
            >
              ▼
            </button>
            <button
              onPointerDown={() => handleTouchDown('right')}
              onPointerUp={() => handleTouchUp('right')}
              className="w-12 h-12 bg-neutral-900 active:bg-amber-500 text-neutral-200 active:text-neutral-950 rounded-lg flex items-center justify-center font-bold text-sm shadow cursor-pointer"
            >
              ▶
            </button>
          </div>
        </div>

        {/* 4 Neo Geo Arcade Action Buttons + Roll + MAX */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 bg-neutral-950/40 p-2 rounded-2xl border border-neutral-800 backdrop-blur-sm">
          <div className="flex gap-2">
            <button
              onPointerDown={() => handleTouchDown('roll')}
              onPointerUp={() => handleTouchUp('roll')}
              className="px-3 py-1.5 bg-neutral-800 active:bg-sky-500 text-sky-300 active:text-white rounded text-xs font-mono font-bold cursor-pointer"
            >
              ROLL (A+B)
            </button>
            <button
              onPointerDown={() => handleTouchDown('maxMode')}
              onPointerUp={() => handleTouchUp('maxMode')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 active:from-amber-400 text-white rounded text-xs font-mono font-bold cursor-pointer"
            >
              MAX MODE (B+C)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onPointerDown={() => handleTouchDown('lightPunch')}
              onPointerUp={() => handleTouchUp('lightPunch')}
              className="w-14 h-14 bg-red-600/90 active:bg-red-500 text-white font-['Chakra_Petch'] font-black text-sm rounded-full shadow-[0_0_12px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center cursor-pointer"
            >
              <span>A</span>
              <span className="text-[9px] font-mono">LP</span>
            </button>
            <button
              onPointerDown={() => handleTouchDown('heavyPunch')}
              onPointerUp={() => handleTouchUp('heavyPunch')}
              className="w-14 h-14 bg-amber-500/90 active:bg-amber-400 text-neutral-950 font-['Chakra_Petch'] font-black text-sm rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center cursor-pointer"
            >
              <span>C</span>
              <span className="text-[9px] font-mono">HP</span>
            </button>
            <button
              onPointerDown={() => handleTouchDown('lightKick')}
              onPointerUp={() => handleTouchUp('lightKick')}
              className="w-14 h-14 bg-blue-600/90 active:bg-blue-500 text-white font-['Chakra_Petch'] font-black text-sm rounded-full shadow-[0_0_12px_rgba(37,99,235,0.5)] flex flex-col items-center justify-center cursor-pointer"
            >
              <span>B</span>
              <span className="text-[9px] font-mono">LK</span>
            </button>
            <button
              onPointerDown={() => handleTouchDown('heavyKick')}
              onPointerUp={() => handleTouchUp('heavyKick')}
              className="w-14 h-14 bg-emerald-600/90 active:bg-emerald-500 text-white font-['Chakra_Petch'] font-black text-sm rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center cursor-pointer"
            >
              <span>D</span>
              <span className="text-[9px] font-mono">HK</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP RIGHT PAUSE BUTTON */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => { sound.playMenuBeep(false); setIsPaused(!isPaused); }}
          className="p-2 rounded bg-neutral-900/90 border border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer shadow-lg"
          title="Pause (Esc)"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center">
          <div className="w-80 bg-neutral-900 border border-amber-500/50 p-6 rounded-xl flex flex-col gap-4 text-center shadow-2xl">
            <h3 className="font-['Chakra_Petch'] font-black text-2xl text-amber-400 tracking-wider">
              PAUSA DEL COMBATE
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              Escenario: {stage.name} · Modo: {gameMode}
            </p>

            <button
              onClick={() => { sound.playMenuBeep(true); setIsPaused(false); }}
              className="py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-['Chakra_Petch'] font-bold rounded cursor-pointer transition-colors"
            >
              CONTINUAR
            </button>

            <button
              onClick={() => {
                sound.playMenuBeep(false);
                engineRef.current = new FightingEngine(p1Def, p2Def, gameMode === 'TRAINING');
                setIsPaused(false);
              }}
              className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-['Chakra_Petch'] font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> REINICIAR ASALTO
            </button>

            <button
              onClick={() => { sound.playMenuBeep(false); onExitFight(); }}
              className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-rose-400 font-['Chakra_Petch'] font-bold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> VOLVER AL MENÚ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
