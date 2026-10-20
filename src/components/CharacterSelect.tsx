import React, { useState } from 'react';
import { FighterDefinition, StageDefinition, DressCode, GameMode } from '../types/fighter';
import { STAGES } from '../data/stageData';
import { sound } from '../audio/soundEngine';
import { Shield, Zap, Swords, Shirt, Play, Sparkles } from 'lucide-react';

interface CharacterSelectProps {
  roster: FighterDefinition[];
  onStartFight: (p1: FighterDefinition, p2: FighterDefinition, stage: StageDefinition, mode: GameMode) => void;
  onOpenCreator: () => void;
  onBackToTitle: () => void;
  initialMode: GameMode;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  roster,
  onStartFight,
  onOpenCreator,
  onBackToTitle,
  initialMode
}) => {
  const [selectedP1Index, setSelectedP1Index] = useState<number>(0);
  const [selectedP2Index, setSelectedP2Index] = useState<number>(1);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [activeTab, setActiveTab] = useState<'fighters' | 'stages'>('fighters');
  const [p1Palette, setP1Palette] = useState<number>(0);

  const p1 = roster[selectedP1Index] || roster[0];
  const p2 = roster[selectedP2Index] || roster[1];
  const stage = STAGES[selectedStageIndex];

  const handleSelectP1 = (idx: number) => {
    setSelectedP1Index(idx);
    sound.playMenuBeep(false);
  };

  const handleSelectP2 = (idx: number) => {
    setSelectedP2Index(idx);
    sound.playMenuBeep(false);
  };

  const handleStart = () => {
    sound.playMenuBeep(true);
    sound.playAnnouncer('READY... FIGHT!');
    onStartFight(
      { ...p1, stats: { ...p1.stats } },
      { ...p2, stats: { ...p2.stats } },
      stage,
      gameMode
    );
  };

  return (
    <div className="relative w-full h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Neo Geo Arcade Scanlines & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,27,75,0.4)_0%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />

      {/* HEADER BAR */}
      <div className="relative z-10 flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { sound.playMenuBeep(false); onBackToTitle(); }}
            className="px-3 py-1 text-xs font-['Chakra_Petch'] font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 rounded transition-colors"
          >
            ← SALIR AL TÍTULO
          </button>
          <div className="flex items-baseline gap-2">
            <span className="font-['Chakra_Petch'] font-black text-2xl text-amber-400 tracking-wider drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]">
              SELECT YOUR FIGHTER
            </span>
            <span className="text-xs font-mono text-neutral-400">
              DRESS CLASH · ARCADE 2002
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800">
          {(['ARCADE', 'VERSUS_CPU', 'VERSUS_2P', 'TRAINING'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => { sound.playMenuBeep(false); setGameMode(mode); }}
              className={`px-3 py-1.5 text-xs font-['Chakra_Petch'] font-bold rounded transition-colors ${
                gameMode === mode
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={() => { sound.playMenuBeep(true); onOpenCreator(); }}
            className="ml-2 px-3 py-1.5 text-xs font-['Chakra_Petch'] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            CREADOR STUDIO
          </button>
        </div>
      </div>

      {/* MAIN SELECT GRID & DETAIL PREVIEW */}
      <div className="relative z-10 grid grid-cols-12 gap-6 my-auto max-h-[82vh] overflow-y-auto">
        {/* LEFT COLUMN: ROSTER GRID */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Chakra_Petch'] font-bold text-sm text-neutral-400 tracking-wider">
              PERSONAJES REGISTRADOS ({roster.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { sound.playMenuBeep(false); setActiveTab('fighters'); }}
                className={`px-3 py-1 text-xs font-['Chakra_Petch'] font-semibold rounded ${activeTab === 'fighters' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-neutral-400'}`}
              >
                LUCHADORES
              </button>
              <button
                onClick={() => { sound.playMenuBeep(false); setActiveTab('stages'); }}
                className={`px-3 py-1 text-xs font-['Chakra_Petch'] font-semibold rounded ${activeTab === 'stages' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-neutral-400'}`}
              >
                ESCENARIO: {stage.name}
              </button>
            </div>
          </div>

          {activeTab === 'fighters' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roster.map((f, idx) => {
                const isP1 = selectedP1Index === idx;
                const isP2 = selectedP2Index === idx;

                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelectP1(idx)}
                    onContextMenu={(e) => { e.preventDefault(); handleSelectP2(idx); }}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all border ${
                      isP1
                        ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                        : isP2
                        ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {/* Badge 1P / 2P Indicator */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/80 text-neutral-300 border border-neutral-700">
                        {f.dressCode}
                      </span>
                      <div className="flex gap-1">
                        {isP1 && (
                          <span className="text-[10px] font-['Chakra_Petch'] font-black px-1.5 bg-amber-400 text-neutral-950 rounded">
                            1P
                          </span>
                        )}
                        {isP2 && (
                          <span className="text-[10px] font-['Chakra_Petch'] font-black px-1.5 bg-rose-500 text-white rounded">
                            2P
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Character Human Portrait Box */}
                    <div className="w-full h-28 rounded flex items-center justify-center relative overflow-hidden mb-2 bg-neutral-950 border border-neutral-800">
                      {f.portraitUrl ? (
                        <img
                          src={f.portraitUrl}
                          alt={f.name}
                          className="w-full h-full object-cover object-top filter contrast-110 hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${f.palette.primary} 0%, #000 100%)` }}
                        >
                          <span className="text-xl font-bold font-['Chakra_Petch'] text-white/50">{f.name[0]}</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-2 text-2xl font-black text-white/40 font-['Chakra_Petch'] drop-shadow">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="font-['Chakra_Petch'] font-bold text-sm text-neutral-100 truncate">
                      {f.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {f.martialArt}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            /* STAGES SELECTOR GRID */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STAGES.map((s, idx) => {
                const isSelected = selectedStageIndex === idx;
                return (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedStageIndex(idx); sound.playMenuBeep(false); }}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="w-full h-20 rounded bg-neutral-950 relative overflow-hidden mb-2 flex items-center justify-center">
                      {s.imageKey ? (
                        <img src={s.imageKey} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${s.bgGradient} flex items-center justify-center`}>
                          <span className="text-xs font-mono text-neutral-400">STAGE 0{idx + 1}</span>
                        </div>
                      )}
                      <span className="absolute top-1 left-1 text-[9px] font-mono px-1 py-0.5 bg-neutral-950/90 text-amber-300 rounded">
                        {s.dressCodeLevel}
                      </span>
                    </div>
                    <h5 className="font-['Chakra_Petch'] font-bold text-xs text-neutral-100 truncate">
                      {s.name}
                    </h5>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {s.location}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FIGHTER DETAILED FICHA TÉCNICA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-2xl">
          {/* Heroic Portrait Banner */}
          {p1.portraitUrl && (
            <div className="w-full h-36 rounded-lg overflow-hidden border border-amber-500/40 relative shadow-md">
              <img src={p1.portraitUrl} alt={p1.name} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent flex items-end p-3">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                    {p1.title}
                  </span>
                  <h3 className="font-['Chakra_Petch'] font-black text-xl text-white tracking-wide leading-none">
                    {p1.name}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {p1.dressCode}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {p1.martialArt}
                </span>
              </div>
            </div>

            {/* Costume Color Toggle */}
            <button
              onClick={() => { sound.playMenuBeep(false); setP1Palette(p1Palette === 0 ? 1 : 0); }}
              className="text-xs font-['Chakra_Petch'] font-bold px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded transition-colors"
            >
              COLOR: {p1Palette === 0 ? 'COLOR 1' : 'COLOR 2'}
            </button>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            {p1.bio}
          </p>

          {/* Core Stats Overview */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" /> SALUD
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {p1.stats.health} HP
              </span>
            </div>
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> VELOCIDAD
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {p1.stats.dashSpeed.toFixed(1)} DASH
              </span>
            </div>
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Swords className="w-3 h-3 text-rose-400" /> PODER
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {Math.round(p1.stats.attackModifier * 100)}% DMG
              </span>
            </div>
          </div>

          {/* Move List Spec (Ficha Técnica de Movimientos) */}
          <div className="flex-1 flex flex-col min-h-0">
            <span className="font-['Chakra_Petch'] font-bold text-xs text-neutral-400 tracking-wider mb-2">
              LISTA DE MOVIMIENTOS & ESPECIALES
            </span>
            <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 font-mono text-xs">
              {p1.moves.map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-200">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-amber-400">
                      {m.inputDisplayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                    <span>{m.damage} DMG</span>
                    <span className="text-cyan-400">{m.startupFrames}f Startup</span>
                    <span className={`px-1 rounded ${m.onHitAdvantage >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {m.onHitAdvantage >= 0 ? `+${m.onHitAdvantage}` : m.onHitAdvantage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* START FIGHT CTA BUTTON */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-neutral-950 font-['Chakra_Petch'] font-black text-lg tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            ¡INICIAR COMBATE!
          </button>
        </div>
      </div>

      {/* FOOTER CONTROLS HINT */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono text-neutral-400 border-t border-neutral-800 pt-3">
        <span>Click izquierdo: Seleccionar 1P · Click derecho: Seleccionar 2P</span>
        <span>Modo KOF 2002: Dash doble tap · Roll (A+B) · MAX Mode (B+C)</span>
      </div>
    </div>
  );
};
