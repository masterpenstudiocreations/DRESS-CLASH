import React, { useEffect } from 'react';
import { sound } from '../audio/soundEngine';
import { GameMode } from '../types/fighter';
import { Volume2, VolumeX, Sparkles, Monitor, Gamepad2, Info } from 'lucide-react';

interface TitleScreenProps {
  onStartMode: (mode: GameMode) => void;
  onOpenCreator: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartMode,
  onOpenCreator,
  onOpenSettings,
  onToggleSound,
  isMuted,
  scanlinesEnabled,
  onToggleScanlines
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        sound.playMenuBeep(true);
        onStartMode('ARCADE');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartMode]);

  return (
    <div className="relative w-full h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-hidden select-none">
      {/* BACKGROUND HERO ART WITH VIGNETTE */}
      <div className="absolute inset-0">
        <img
          src="/src/assets/images/arcade_hero_art_1792533697379.jpg"
          alt="Arcade Key Art"
          className="w-full h-full object-cover opacity-35 filter saturate-150 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/80" />
      </div>

      {/* TOP BAR: NEO GEO BRANDING & QUICK AUDIO/DISPLAY TOGGLES */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 bg-red-600 text-white font-['Chakra_Petch'] font-black text-xs tracking-wider rounded-sm shadow-md">
            NEO·GEO
          </div>
          <span className="font-mono text-xs text-neutral-400 tracking-wider">
            MAX 330 MEGA · ADVANCED 2D FIGHTING SYSTEM
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { sound.playMenuBeep(false); onToggleScanlines(); }}
            className={`px-3 py-1.5 text-xs font-mono rounded flex items-center gap-1.5 transition-colors border ${
              scanlinesEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            CRT SCANLINES: {scanlinesEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => { sound.playMenuBeep(false); onToggleSound(); }}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Audio Mute Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* CENTER LOGO LOCKUP & TITLE */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center px-4">
        {/* Subtitle kicker */}
        <span className="font-['Chakra_Petch'] font-black text-sm tracking-[0.3em] text-cyan-400 mb-2 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          EL ATUENDO DEFINE EL ESTILO DE COMBATE
        </span>

        {/* BESPOKE ARCADE TITLE LOCKUP */}
        <div className="relative flex flex-col items-center">
          <h1 className="font-['Bebas_Neue'] text-8xl md:text-9xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-600 drop-shadow-[0_6px_25px_rgba(245,158,11,0.7)] leading-none">
            DRESS CLASH
          </h1>
          <div className="flex items-center gap-3 -mt-2">
            <span className="h-[2px] w-14 bg-cyan-400" />
            <span className="font-['Chakra_Petch'] font-black text-xl md:text-2xl text-cyan-300 tracking-[0.25em] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              NEO GEO ARCADE CLASH
            </span>
            <span className="h-[2px] w-14 bg-cyan-400" />
          </div>
        </div>

        {/* 7 Dress Styles Pills Indicator */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-2xl text-xs font-mono text-neutral-400">
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">Casual</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">Smart Casual</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">Semi Formal</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-bold">Coctel</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">Formal</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">Black Tie</span>
          <span className="text-neutral-600">·</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700/80 text-neutral-300">White Tie</span>
        </div>

        {/* PRIMARY ARCADE MENU BUTTONS */}
        <div className="flex flex-col gap-3 mt-8 w-80">
          <button
            onClick={() => { sound.playMenuBeep(true); onStartMode('ARCADE'); }}
            className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-['Chakra_Petch'] font-black text-lg tracking-wider rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gamepad2 className="w-5 h-5" />
            MODO ARCADE (7 ETAPAS)
          </button>

          <button
            onClick={() => { sound.playMenuBeep(true); onStartMode('VERSUS_CPU'); }}
            className="py-2.5 px-6 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 font-['Chakra_Petch'] font-bold text-sm tracking-wider rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            VERSUS (1P VS CPU / LOCAL 2P)
          </button>

          <button
            onClick={() => { sound.playMenuBeep(true); onStartMode('TRAINING'); }}
            className="py-2.5 px-6 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 font-['Chakra_Petch'] font-bold text-sm tracking-wider rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            MODO ENTRENAMIENTO / LAB
          </button>

          <button
            onClick={() => { sound.playMenuBeep(true); onOpenCreator(); }}
            className="py-2.5 px-6 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 font-['Chakra_Petch'] font-bold text-sm tracking-wider rounded-lg border border-cyan-500/40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            CREADOR DE LUCHADORES
          </button>
        </div>

        {/* BLINKING START HINT */}
        <div className="mt-6">
          <span className="font-['Chakra_Petch'] font-bold text-sm text-amber-400 tracking-widest animate-pulse">
            PRESIONA [ ENTER ] O [ ESPACIO ] PARA INSERTAR MONEDA
          </span>
        </div>
      </div>

      {/* FOOTER CONTROLS HINT */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-t border-neutral-800/80 text-xs font-mono text-neutral-400">
        <span>WASD: Movimiento / Salto corto / Dash doble tap</span>
        <span>J: LP (Puño Débil) · K: LK (Patada Débil) · U: HP (Fuerte) · I: HK (Fuerte) · L: Roll · O: MAX Mode</span>
        <button
          onClick={onOpenSettings}
          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" /> Ver Reglas & Guía
        </button>
      </div>
    </div>
  );
};
