import React from 'react';
import { ActiveFighter } from '../types/fighter';

interface ArcadeHUDProps {
  p1: ActiveFighter;
  p2: ActiveFighter;
  roundTime: number;
  p1Wins: number;
  p2Wins: number;
  comboP1: { count: number; damage: number };
  comboP2: { count: number; damage: number };
  announcement: string | null;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  p1,
  p2,
  roundTime,
  p1Wins,
  p2Wins,
  comboP1,
  comboP2,
  announcement
}) => {
  const p1HpPercent = Math.max(0, Math.min(100, (p1.health / p1.maxHealth) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (p2.health / p2.maxHealth) * 100));

  const p1GuardPercent = Math.max(0, Math.min(100, (p1.guardMeter / p1.maxGuardMeter) * 100));
  const p2GuardPercent = Math.max(0, Math.min(100, (p2.guardMeter / p2.maxGuardMeter) * 100));

  const p1Stocks = Math.floor(p1.superMeter / 100);
  const p1Partial = p1.superMeter % 100;

  const p2Stocks = Math.floor(p2.superMeter / 100);
  const p2Partial = p2.superMeter % 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* TOP HEADER: HEALTH BARS & TIMER */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* PLAYER 1 HEALTH & GUARD */}
        <div className="flex-1 flex items-start gap-2.5">
          {p1.definition.portraitUrl && (
            <div className="w-12 h-12 rounded-sm border-2 border-amber-500 overflow-hidden shadow-lg shrink-0 bg-neutral-900">
              <img src={p1.definition.portraitUrl} alt={p1.definition.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 flex flex-col items-start">
            {/* Name & Dress Code Tag */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-['Chakra_Petch'] font-bold text-lg tracking-wider text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {p1.definition.name.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono tracking-wider px-2 py-0.5 bg-neutral-900/90 text-cyan-300 border border-cyan-500/40 rounded">
                {p1.definition.dressCode}
              </span>
              {/* Round Win Dots */}
              <div className="flex gap-1 ml-2">
                <span className={`w-3 h-3 rounded-full border border-yellow-500 ${p1Wins >= 1 ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-neutral-800'}`} />
                <span className={`w-3 h-3 rounded-full border border-yellow-500 ${p1Wins >= 2 ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-neutral-800'}`} />
              </div>
            </div>

            {/* Health Bar Container */}
            <div className="w-full h-7 bg-neutral-950/90 border-2 border-neutral-700 rounded-sm p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative overflow-hidden">
              {/* Background Red Damage Trail */}
              <div
                className="h-full bg-red-600 transition-all duration-500 ease-out absolute left-0 top-0.5 bottom-0.5"
                style={{ width: `${p1HpPercent}%` }}
              />
              {/* Active Green/Yellow Bar */}
              <div
                className={`h-full relative z-10 transition-all duration-75 ${
                  p1HpPercent < 25 ? 'bg-gradient-to-r from-red-600 to-amber-500 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-amber-400'
                }`}
                style={{ width: `${p1HpPercent}%` }}
              />
            </div>

            {/* Guard Meter */}
            <div className="w-3/4 h-2 bg-neutral-900 border border-neutral-700 mt-1 relative overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  p1GuardPercent < 30 ? 'bg-red-500 animate-ping' : 'bg-sky-400'
                }`}
                style={{ width: `${p1GuardPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* CENTER TIME CLOCK */}
        <div className="flex flex-col items-center justify-center shrink-0 px-4">
          <div className="w-16 h-14 bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/80 rounded flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <span className="font-['Chakra_Petch'] font-black text-3xl text-amber-400 tracking-tighter tabular-nums drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]">
              {roundTime === 999 ? '∞' : String(roundTime).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[9px] font-['Chakra_Petch'] font-bold text-neutral-400 tracking-widest mt-0.5">
            DRESS CLASH
          </span>
        </div>

        {/* PLAYER 2 HEALTH & GUARD */}
        <div className="flex-1 flex items-start gap-2.5 justify-end">
          <div className="flex-1 flex flex-col items-end">
            {/* Name & Dress Code Tag */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1 mr-2">
                <span className={`w-3 h-3 rounded-full border border-yellow-500 ${p2Wins >= 2 ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-neutral-800'}`} />
                <span className={`w-3 h-3 rounded-full border border-yellow-500 ${p2Wins >= 1 ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-neutral-800'}`} />
              </div>
              <span className="text-[11px] font-mono tracking-wider px-2 py-0.5 bg-neutral-900/90 text-rose-300 border border-rose-500/40 rounded">
                {p2.definition.dressCode}
              </span>
              <span className="font-['Chakra_Petch'] font-bold text-lg tracking-wider text-rose-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {p2.definition.name.toUpperCase()}
              </span>
            </div>

            {/* Health Bar Container (Flipped Direction) */}
            <div className="w-full h-7 bg-neutral-950/90 border-2 border-neutral-700 rounded-sm p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative overflow-hidden flex justify-end">
              <div
                className="h-full bg-red-600 transition-all duration-500 ease-out absolute right-0 top-0.5 bottom-0.5"
                style={{ width: `${p2HpPercent}%` }}
              />
              <div
                className={`h-full relative z-10 transition-all duration-75 ${
                  p2HpPercent < 25 ? 'bg-gradient-to-l from-red-600 to-amber-500 animate-pulse' : 'bg-gradient-to-l from-emerald-500 to-amber-400'
                }`}
                style={{ width: `${p2HpPercent}%` }}
              />
            </div>

            {/* Guard Meter */}
            <div className="w-3/4 h-2 bg-neutral-900 border border-neutral-700 mt-1 relative overflow-hidden flex justify-end">
              <div
                className={`h-full transition-all duration-100 ${
                  p2GuardPercent < 30 ? 'bg-red-500 animate-ping' : 'bg-sky-400'
                }`}
                style={{ width: `${p2GuardPercent}%` }}
              />
            </div>
          </div>
          {p2.definition.portraitUrl && (
            <div className="w-12 h-12 rounded-sm border-2 border-rose-500 overflow-hidden shadow-lg shrink-0 bg-neutral-900">
              <img src={p2.definition.portraitUrl} alt={p2.definition.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* MID-SCREEN ANNOUNCEMENTS & COMBO COUNTERS */}
      <div className="w-full flex items-center justify-between px-6 pointer-events-none">
        {/* P1 Combo Counter */}
        <div className={`transition-all duration-150 ${comboP1.count > 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          <div className="flex flex-col items-start bg-neutral-950/80 p-3 border-l-4 border-amber-400 rounded-r">
            <div className="flex items-baseline gap-2">
              <span className="font-['Chakra_Petch'] font-black text-4xl text-amber-400 italic drop-shadow-[0_2px_10px_#f59e0b]">
                {comboP1.count}
              </span>
              <span className="font-['Chakra_Petch'] font-bold text-lg text-neutral-200">
                HITS
              </span>
            </div>
            <span className="font-mono text-xs text-amber-200">
              {Math.round(comboP1.damage)} DMG
            </span>
            <span className="font-['Chakra_Petch'] font-bold text-xs tracking-widest text-emerald-400 mt-1">
              {comboP1.count >= 8 ? 'MARVELOUS!!' : comboP1.count >= 5 ? 'EXCELLENT!' : comboP1.count >= 3 ? 'GREAT!' : 'COMBO'}
            </span>
          </div>
        </div>

        {/* Center Announcer Banner */}
        {announcement && (
          <div className="animate-bounce flex flex-col items-center">
            <span className="font-['Chakra_Petch'] font-black text-4xl md:text-5xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-red-600 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] uppercase">
              {announcement}
            </span>
          </div>
        )}

        {/* P2 Combo Counter */}
        <div className={`transition-all duration-150 ${comboP2.count > 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          <div className="flex flex-col items-end bg-neutral-950/80 p-3 border-r-4 border-rose-500 rounded-l">
            <div className="flex items-baseline gap-2">
              <span className="font-['Chakra_Petch'] font-bold text-lg text-neutral-200">
                HITS
              </span>
              <span className="font-['Chakra_Petch'] font-black text-4xl text-rose-400 italic drop-shadow-[0_2px_10px_#f43f5e]">
                {comboP2.count}
              </span>
            </div>
            <span className="font-mono text-xs text-rose-200">
              {Math.round(comboP2.damage)} DMG
            </span>
            <span className="font-['Chakra_Petch'] font-bold text-xs tracking-widest text-cyan-400 mt-1">
              {comboP2.count >= 8 ? 'MARVELOUS!!' : comboP2.count >= 5 ? 'EXCELLENT!' : comboP2.count >= 3 ? 'GREAT!' : 'COMBO'}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM BARS: KOF 2002 STYLE SUPER METERS & MAX MODE */}
      <div className="w-full flex items-end justify-between gap-6 pb-2">
        {/* P1 Super Meter */}
        <div className="w-72 flex flex-col items-start">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-['Chakra_Petch'] font-black text-sm text-amber-400 tracking-wider">
                POWER
              </span>
              <span className="font-['Chakra_Petch'] font-black text-lg text-white bg-amber-600 px-2 rounded-sm shadow-sm">
                x{p1Stocks}
              </span>
            </div>
            {p1.inMaxMode && (
              <span className="font-['Chakra_Petch'] font-bold text-xs px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded animate-pulse">
                MAX MODE ACTIVE
              </span>
            )}
          </div>

          <div className="w-full h-5 bg-neutral-950/90 border border-neutral-700 rounded-sm p-0.5 relative overflow-hidden">
            {p1.inMaxMode ? (
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-400 animate-pulse transition-all duration-75"
                style={{ width: `${(p1.maxModeTimer / 400) * 100}%` }}
              />
            ) : (
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-100"
                style={{ width: `${p1Partial}%` }}
              />
            )}
          </div>
        </div>

        {/* P2 Super Meter */}
        <div className="w-72 flex flex-col items-end">
          <div className="flex items-center justify-between w-full mb-1">
            {p2.inMaxMode && (
              <span className="font-['Chakra_Petch'] font-bold text-xs px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded animate-pulse">
                MAX MODE ACTIVE
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-['Chakra_Petch'] font-black text-lg text-white bg-rose-600 px-2 rounded-sm shadow-sm">
                x{p2Stocks}
              </span>
              <span className="font-['Chakra_Petch'] font-black text-sm text-rose-400 tracking-wider">
                POWER
              </span>
            </div>
          </div>

          <div className="w-full h-5 bg-neutral-950/90 border border-neutral-700 rounded-sm p-0.5 relative overflow-hidden flex justify-end">
            {p2.inMaxMode ? (
              <div
                className="h-full bg-gradient-to-l from-amber-500 via-rose-500 to-yellow-400 animate-pulse transition-all duration-75"
                style={{ width: `${(p2.maxModeTimer / 400) * 100}%` }}
              />
            ) : (
              <div
                className="h-full bg-gradient-to-l from-rose-600 to-pink-400 transition-all duration-100"
                style={{ width: `${p2Partial}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
