import React, { useState, useEffect } from 'react';
import { FighterDefinition, GameMode, StageDefinition } from './types/fighter';
import { INITIAL_ROSTER } from './data/rosterData';
import { STAGES } from './data/stageData';
import { TitleScreen } from './components/TitleScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { FightCanvas } from './components/FightCanvas';
import { CreatorStudio } from './components/CreatorStudio';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { sound } from './audio/soundEngine';

type Screen = 'TITLE' | 'SELECT' | 'FIGHT' | 'CREATOR';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('TITLE');
  const [roster, setRoster] = useState<FighterDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('dress_code_custom_roster');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge initial roster with saved custom fighters
          const customOnly = parsed.filter((p: FighterDefinition) => p.id.startsWith('custom_'));
          return [...INITIAL_ROSTER, ...customOnly];
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_ROSTER;
  });

  const [gameMode, setGameMode] = useState<GameMode>('ARCADE');
  const [p1Def, setP1Def] = useState<FighterDefinition>(INITIAL_ROSTER[0]);
  const [p2Def, setP2Def] = useState<FighterDefinition>(INITIAL_ROSTER[1]);
  const [currentStage, setCurrentStage] = useState<StageDefinition>(STAGES[0]);
  const [arcadeStageIndex, setArcadeStageIndex] = useState<number>(0);

  // Settings
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // End of Match Modal
  const [matchResult, setMatchResult] = useState<{
    winner: 1 | 2 | 0;
    stats: { p1Hp: number; p2Hp: number; maxCombo: number };
  } | null>(null);

  // Save new custom fighters to local storage
  const handleSaveFighter = (newFighter: FighterDefinition) => {
    const updated = [newFighter, ...roster.filter(f => f.id !== newFighter.id)];
    setRoster(updated);
    try {
      localStorage.setItem('dress_code_custom_roster', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setP1Def(newFighter);
  };

  // Start a match from Character Select
  const handleStartFight = (
    p1: FighterDefinition,
    p2: FighterDefinition,
    stage: StageDefinition,
    mode: GameMode
  ) => {
    setP1Def(p1);
    setP2Def(p2);
    setCurrentStage(stage);
    setGameMode(mode);
    setArcadeStageIndex(STAGES.findIndex(s => s.id === stage.id) || 0);
    setMatchResult(null);
    setCurrentScreen('FIGHT');
  };

  // Match ended (K.O. or timeout)
  const handleMatchEnd = (
    winner: 1 | 2 | 0,
    stats: { p1Hp: number; p2Hp: number; maxCombo: number }
  ) => {
    setMatchResult({ winner, stats });
  };

  // Rematch
  const handleRematch = () => {
    setMatchResult(null);
    // Triggers fresh render of FightCanvas
    setCurrentScreen('SELECT');
    setTimeout(() => {
      setCurrentScreen('FIGHT');
    }, 50);
  };

  // Next Arcade Stage
  const handleNextStage = () => {
    const nextIdx = arcadeStageIndex + 1;
    if (nextIdx < STAGES.length) {
      setArcadeStageIndex(nextIdx);
      setCurrentStage(STAGES[nextIdx]);
      // Next opponent from roster
      const nextOpponent = roster[(nextIdx + 1) % roster.length];
      setP2Def(nextOpponent);
      setMatchResult(null);
      setCurrentScreen('FIGHT');
      sound.playAnnouncer(`STAGE ${nextIdx + 1}... READY!`);
    } else {
      // Beat the final Colosseum boss!
      sound.playAnnouncer('CHAMPION! YOU HAVE CONQUERED THE FASHION CODES!');
      setCurrentScreen('TITLE');
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none relative">
      {/* 1. TITLE SCREEN */}
      {currentScreen === 'TITLE' && (
        <TitleScreen
          onStartMode={(mode) => {
            setGameMode(mode);
            setCurrentScreen('SELECT');
          }}
          onOpenCreator={() => setCurrentScreen('CREATOR')}
          onOpenSettings={() => setShowSettings(true)}
          onToggleSound={toggleSound}
          isMuted={isMuted}
          scanlinesEnabled={scanlinesEnabled}
          onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
        />
      )}

      {/* 2. CHARACTER SELECT SCREEN */}
      {currentScreen === 'SELECT' && (
        <CharacterSelect
          roster={roster}
          initialMode={gameMode}
          onStartFight={handleStartFight}
          onOpenCreator={() => setCurrentScreen('CREATOR')}
          onBackToTitle={() => setCurrentScreen('TITLE')}
        />
      )}

      {/* 3. ACTIVE FIGHT ARENA */}
      {currentScreen === 'FIGHT' && (
        <FightCanvas
          p1Def={p1Def}
          p2Def={p2Def}
          stage={currentStage}
          gameMode={gameMode}
          onMatchEnd={handleMatchEnd}
          onExitFight={() => {
            setMatchResult(null);
            setCurrentScreen('SELECT');
          }}
          scanlinesEnabled={scanlinesEnabled}
        />
      )}

      {/* 4. CREATOR & FRAME DATA STUDIO */}
      {currentScreen === 'CREATOR' && (
        <CreatorStudio
          roster={roster}
          onSaveFighter={handleSaveFighter}
          onClose={() => setCurrentScreen('SELECT')}
        />
      )}

      {/* GAME OVER / VICTORY MODAL OVERLAY */}
      {matchResult && (
        <GameOverModal
          winner={matchResult.winner}
          p1Def={p1Def}
          p2Def={p2Def}
          stage={currentStage}
          gameMode={gameMode}
          stats={matchResult.stats}
          onRematch={handleRematch}
          onCharacterSelect={() => {
            setMatchResult(null);
            setCurrentScreen('SELECT');
          }}
          onNextStage={handleNextStage}
          hasNextStage={arcadeStageIndex < STAGES.length - 1}
          onMainMenu={() => {
            setMatchResult(null);
            setCurrentScreen('TITLE');
          }}
        />
      )}

      {/* SETTINGS & MANUAL MODAL */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          scanlinesEnabled={scanlinesEnabled}
          onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
          isMuted={isMuted}
          onToggleMute={toggleSound}
        />
      )}
    </div>
  );
}
