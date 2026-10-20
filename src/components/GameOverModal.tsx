import React from 'react';
import { FighterDefinition, GameMode, StageDefinition } from '../types/fighter';
import { sound } from '../audio/soundEngine';
import { Trophy, RotateCcw, Users, Home, ArrowRight } from 'lucide-react';

interface GameOverModalProps {
  winner: 1 | 2 | 0;
  p1Def: FighterDefinition;
  p2Def: FighterDefinition;
  stage: StageDefinition;
  gameMode: GameMode;
  stats: { p1Hp: number; p2Hp: number; maxCombo: number };
  onRematch: () => void;
  onCharacterSelect: () => void;
  onNextStage?: () => void;
  hasNextStage: boolean;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  p1Def,
  p2Def,
  stage,
  gameMode,
  stats,
  onRematch,
  onCharacterSelect,
  onNextStage,
  hasNextStage,
  onMainMenu
}) => {
  const winnerDef = winner === 1 ? p1Def : (winner === 2 ? p2Def : null);
  const winQuote = winnerDef ? winnerDef.quotes.win[0] : '¡Un empate legendario en el asfalto!';

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-neutral-900 border-2 border-amber-500/60 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.3)]">
        {/* TOP TROPHY OR BANNER */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
          <Trophy className="w-8 h-8 text-neutral-950" />
        </div>

        <span className="font-mono text-xs text-amber-400 tracking-widest uppercase">
          {gameMode.replace('_', ' ')} · {stage.name}
        </span>

        <h2 className="font-['Bebas_Neue'] text-5xl md:text-6xl text-white tracking-wider my-1 drop-shadow-md">
          {winner === 0 ? 'EMPATE TÉCNICO' : (winner === 1 ? 'VICTORIA JUGADOR 1' : 'VICTORIA JUGADOR 2')}
        </h2>

        {winnerDef && (
          <div className="my-2 flex flex-col items-center">
            {winnerDef.portraitUrl && (
              <div className="w-20 h-20 rounded-lg border-2 border-amber-400 overflow-hidden shadow-[0_0_18px_rgba(251,191,36,0.5)] mb-2">
                <img src={winnerDef.portraitUrl} alt={winnerDef.name} className="w-full h-full object-cover object-top" />
              </div>
            )}
            <span className="font-['Chakra_Petch'] font-black text-xl text-amber-400">
              {winnerDef.name.toUpperCase()}
            </span>
            <div className="text-xs font-mono text-neutral-400">
              [{winnerDef.dressCode} · {winnerDef.martialArt}]
            </div>
            <p className="text-sm italic text-neutral-200 mt-2 px-4 py-2 bg-neutral-950/70 border border-neutral-800 rounded-lg">
              "{winQuote}"
            </p>
          </div>
        )}

        {/* STATS BREAKDOWN */}
        <div className="w-full grid grid-cols-2 gap-3 my-4 font-mono text-xs text-neutral-300">
          <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">COMBO MÁS LARGO</span>
            <span className="font-['Chakra_Petch'] font-black text-lg text-cyan-400">
              {stats.maxCombo > 0 ? `${stats.maxCombo} HITS` : '1 HIT'}
            </span>
          </div>
          <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">NIVEL DE ETIQUETA</span>
            <span className="font-['Chakra_Petch'] font-black text-lg text-amber-400">
              {stage.dressCodeLevel}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          {gameMode === 'ARCADE' && winner === 1 && hasNextStage && onNextStage && (
            <button
              onClick={() => { sound.playMenuBeep(true); onNextStage(); }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-['Chakra_Petch'] font-black text-base rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all"
            >
              SIGUIENTE ESCENARIO <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => { sound.playMenuBeep(true); onRematch(); }}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-['Chakra_Petch'] font-bold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors border border-neutral-700"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" /> REVANCHA
          </button>

          <button
            onClick={() => { sound.playMenuBeep(false); onCharacterSelect(); }}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-['Chakra_Petch'] font-bold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors border border-neutral-700"
          >
            <Users className="w-4 h-4 text-amber-400" /> CAMBIAR LUCHADORES / ESCENARIO
          </button>

          <button
            onClick={() => { sound.playMenuBeep(false); onMainMenu(); }}
            className="w-full py-2 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white font-mono text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Volver a la Portada
          </button>
        </div>
      </div>
    </div>
  );
};
