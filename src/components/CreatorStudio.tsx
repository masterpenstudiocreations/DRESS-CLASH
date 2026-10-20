import React, { useState } from 'react';
import { DressCode, FighterDefinition, MoveFrameData, MoveType, GuardType } from '../types/fighter';
import { sound } from '../audio/soundEngine';
import { GoogleGenAI } from '@google/genai';
import { Plus, Trash2, Save, Download, Sparkles, RefreshCw, ArrowLeft, Check, Shield, Zap, Swords } from 'lucide-react';

interface CreatorStudioProps {
  roster: FighterDefinition[];
  onSaveFighter: (fighter: FighterDefinition) => void;
  onClose: () => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  roster,
  onSaveFighter,
  onClose
}) => {
  const [selectedBaseId, setSelectedBaseId] = useState<string>(roster[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fighter Form State
  const [name, setName] = useState<string>('Luchador Personalizado');
  const [title, setTitle] = useState<string>('El Prodigio del Código');
  const [origin, setOrigin] = useState<string>('Distrito Vanguardia');
  const [dressCode, setDressCode] = useState<DressCode>('Smart Casual');
  const [martialArt, setMartialArt] = useState<string>('Karate Tradicional & Savate');
  const [bio, setBio] = useState<string>('Atuendo impecable que canaliza impactos con fluidez y precisión milimétrica.');
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState<string>('#0f172a');
  const [accentColor, setAccentColor] = useState<string>('#f59e0b');

  // Stats
  const [health, setHealth] = useState<number>(1000);
  const [dashSpeed, setDashSpeed] = useState<number>(10.5);
  const [attackMod, setAttackMod] = useState<number>(1.0);
  const [defenseMod, setDefenseMod] = useState<number>(1.0);

  const [portraitUrl, setPortraitUrl] = useState<string>(roster[0]?.portraitUrl || '');

  // Moves
  const [moves, setMoves] = useState<MoveFrameData[]>(roster[0]?.moves ? JSON.parse(JSON.stringify(roster[0].moves)) : []);

  // Load a base fighter into the editor
  const handleLoadBase = (id: string) => {
    setSelectedBaseId(id);
    const found = roster.find(r => r.id === id);
    if (!found) return;

    setName(found.name + ' (Custom)');
    setTitle(found.title);
    setOrigin(found.origin);
    setDressCode(found.dressCode);
    setMartialArt(found.martialArt);
    setBio(found.bio);
    setPrimaryColor(found.palette.primary);
    setSecondaryColor(found.palette.secondary);
    setAccentColor(found.palette.accent);
    setHealth(found.stats.health);
    setDashSpeed(found.stats.dashSpeed);
    setAttackMod(found.stats.attackModifier);
    setDefenseMod(found.stats.defenseModifier);
    setPortraitUrl(found.portraitUrl || '');
    setMoves(JSON.parse(JSON.stringify(found.moves)));
    sound.playMenuBeep(false);
  };

  // Add Move
  const handleAddMove = () => {
    sound.playMenuBeep(false);
    const newMove: MoveFrameData = {
      id: `custom_move_${Date.now()}`,
      name: 'Nuevo Ataque Especial',
      input: '236P',
      inputDisplayName: '↓↘→ + Puño',
      type: 'Special',
      guard: 'Mid',
      damage: 125,
      meterGain: 20,
      meterCost: 0,
      startupFrames: 9,
      activeFrames: 5,
      recoveryFrames: 14,
      onHitAdvantage: 3,
      onBlockAdvantage: -2,
      guardDamage: 20,
      stunDamage: 110,
      knockdown: false,
      canSuperCancel: true,
      canMaxCancel: true,
      reach: 85,
      height: 'body',
      description: 'Ataque especial configurable con propiedades equilibradas de KOF 2002.'
    };
    setMoves([...moves, newMove]);
  };

  const handleUpdateMove = (index: number, field: keyof MoveFrameData, value: unknown) => {
    const updated = [...moves];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate frame advantages if frames change
    if (field === 'recoveryFrames' || field === 'startupFrames') {
      const rec = Number(field === 'recoveryFrames' ? value : updated[index].recoveryFrames);
      updated[index].onBlockAdvantage = Math.round(12 - rec);
      updated[index].onHitAdvantage = Math.round(18 - rec);
    }

    setMoves(updated);
  };

  const handleDeleteMove = (index: number) => {
    sound.playMenuBeep(false);
    setMoves(moves.filter((_, idx) => idx !== index));
  };

  // AI Generation via Gemini
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    sound.playMenuBeep(true);

    try {
      const ai = new GoogleGenAI();
      const promptText = `Eres un diseñador senior de sistemas de juegos de pelea 2D estilo Neo Geo KOF 2002.
Crea la ficha técnica de un personaje original para el juego "DRESS CLASH" basado en esta idea: "${aiPrompt}".
Los 7 arquetipos de atuendo y estilo permitidos son:
- Casual (Kickboxing, parkour, agilidad callejera)
- Smart Casual (Karate, Savate, balance dinámico)
- Semi Formal (Judo, Wing Chun, movimientos compactos)
- Coctel (Capoeira acrobática, Pencak Silat letal, fintas elásticas)
- Formal (Boxeo, Muay Thai, alto impacto y blindaje)
- Black Tie (Aikido, esgrima manos libres, contraataques quirúrgicos)
- White Tie (Jiu-Jitsu imperial, Sambo, sumisiones de gala)

Responde ÚNICAMENTE un JSON con esta estructura exacta:
{
  "name": "Nombre del personaje",
  "title": "Título marcial",
  "origin": "Lugar de procedencia",
  "dressCode": "Casual" | "Smart Casual" | "Semi Formal" | "Coctel" | "Formal" | "Black Tie" | "White Tie",
  "martialArt": "Artes marciales",
  "bio": "Descripción de trasfondo, atuendo y técnica",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "health": 1000,
  "dashSpeed": 10.5,
  "attackModifier": 1.05,
  "defenseModifier": 1.0,
  "moves": [
    {
      "name": "Nombre",
      "input": "236P",
      "inputDisplayName": "↓↘→ + Puño",
      "type": "Special",
      "guard": "Mid",
      "damage": 120,
      "startupFrames": 8,
      "activeFrames": 5,
      "recoveryFrames": 14,
      "reach": 85,
      "height": "body",
      "description": "Detalle técnico"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        if (data.name) setName(data.name);
        if (data.title) setTitle(data.title);
        if (data.origin) setOrigin(data.origin);
        if (data.dressCode) setDressCode(data.dressCode);
        if (data.martialArt) setMartialArt(data.martialArt);
        if (data.bio) setBio(data.bio);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
        if (data.accentColor) setAccentColor(data.accentColor);
        if (data.health) setHealth(data.health);
        if (data.dashSpeed) setDashSpeed(data.dashSpeed);
        if (data.attackModifier) setAttackMod(data.attackModifier);
        if (data.defenseModifier) setDefenseMod(data.defenseModifier);

        if (Array.isArray(data.moves)) {
          // Merge AI moves with standard normals
          const standardNormals = roster[0]?.moves.filter(m => m.type === 'Normal') || [];
          const generatedMoves: MoveFrameData[] = data.moves.map((m: Partial<MoveFrameData>, idx: number) => ({
            id: `ai_move_${Date.now()}_${idx}`,
            name: m.name || 'Golpe Especial',
            input: m.input || '236P',
            inputDisplayName: m.inputDisplayName || '↓↘→ + P',
            type: (m.type as MoveType) || 'Special',
            guard: (m.guard as GuardType) || 'Mid',
            damage: m.damage || 120,
            meterGain: 20,
            meterCost: m.input?.includes('236236') ? 100 : 0,
            startupFrames: m.startupFrames || 8,
            activeFrames: m.activeFrames || 5,
            recoveryFrames: m.recoveryFrames || 15,
            onHitAdvantage: Math.max(1, 18 - (m.recoveryFrames || 15)),
            onBlockAdvantage: 12 - (m.recoveryFrames || 15),
            guardDamage: Math.round((m.damage || 120) * 0.18),
            stunDamage: m.damage || 120,
            knockdown: m.type === 'SuperDM' || m.damage! > 130,
            canSuperCancel: true,
            canMaxCancel: true,
            reach: m.reach || 80,
            height: (m.height as 'head' | 'body' | 'low') || 'body',
            description: m.description || 'Movimiento generado y balanceado.'
          }));
          setMoves([...standardNormals, ...generatedMoves]);
        }
      }
    } catch (err) {
      console.error('Error generating with Gemini:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to roster
  const handleSave = () => {
    sound.playMenuBeep(true);
    const newFighter: FighterDefinition = {
      id: `custom_${Date.now()}`,
      name,
      title,
      origin,
      dressCode,
      martialArt,
      bio,
      height: '180 cm',
      weight: '75 kg',
      voicePitch: 1.0,
      palette: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        skin: '#e0a97a',
        hair: '#1e1b18',
        details: '#ffffff'
      },
      alternatePalette: {
        primary: accentColor,
        secondary: primaryColor,
        accent: '#ffffff',
        skin: '#d49b6a',
        hair: '#facc15',
        details: '#f8fafc'
      },
      stats: {
        health,
        walkSpeed: 4.8,
        dashSpeed,
        jumpForce: 15.5,
        defenseModifier: defenseMod,
        attackModifier: attackMod,
        guardCrushMax: 100
      },
      quotes: {
        intro: ['¡Prepárate para sentir la técnica pura!', 'El código se respeta en el cuadrilátero.'],
        win: ['Victoria ejecutada con precisión.', 'Un estilo inigualable.'],
        taunt: '¿Eso es todo lo que tienes?'
      },
      portraitUrl: portraitUrl || undefined,
      moves
    };

    onSaveFighter(newFighter);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Download JSON Ficha Técnica
  const handleExportJSON = () => {
    const exportData = {
      name,
      title,
      origin,
      dressCode,
      martialArt,
      bio,
      palette: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      stats: { health, dashSpeed, attackModifier: attackMod, defenseModifier: defenseMod },
      moves
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_ficha_tecnica.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-screen bg-neutral-950 text-neutral-100 flex flex-col p-6 overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { sound.playMenuBeep(false); onClose(); }}
            className="px-3 py-1.5 text-xs font-['Chakra_Petch'] font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> VOLVER
          </button>
          <div>
            <h1 className="font-['Chakra_Petch'] font-black text-2xl text-cyan-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              CREADOR DE LUCHADORES & FRAME DATA STUDIO
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              Sistema de balance de daño, frames (startup / active / recovery) y combinaciones marciales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <select
            value={selectedBaseId}
            onChange={(e) => handleLoadBase(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-xs font-mono px-3 py-2 rounded text-neutral-200"
          >
            <option value="">Cargar Base Preexistente...</option>
            {roster.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.dressCode})</option>
            ))}
          </select>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 text-xs font-mono font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> EXPORTAR FICHA
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-['Chakra_Petch'] font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-neutral-950 rounded flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-neutral-950" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? '¡GUARDADO EN ROSTER!' : 'GUARDAR Y JUGAR'}
          </button>
        </div>
      </div>

      {/* AI GENERATOR STRIP */}
      <div className="my-3 p-3 bg-neutral-900/90 border border-cyan-500/30 rounded-xl flex items-center gap-3 shrink-0">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Escribe una idea en lenguaje natural (ej: 'Un maestro de Savate con ropa Semi Formal que usa patadas de hacha y fintas')..."
          className="flex-1 bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs text-white rounded font-mono focus:border-cyan-400 outline-none"
        />
        <button
          onClick={handleAiGenerate}
          disabled={isGenerating || !aiPrompt.trim()}
          className="px-4 py-1.5 text-xs font-['Chakra_Petch'] font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isGenerating ? 'GENERANDO BALANCE...' : 'GENERAR FICHA CON IA'}
        </button>
      </div>

      {/* 2-COLUMN WORKBENCH */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: IDENTITY, PALETTE & STATS */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Identity Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
            <span className="font-['Chakra_Petch'] font-bold text-xs text-amber-400 tracking-wider">
              IDENTIDAD & ESTILO DE COMBATE
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono text-neutral-400">NOMBRE DEL LUCHADOR</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs rounded text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400">TÍTULO MARCIAL</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs rounded text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">ESTILO / ATUENDO</label>
                  <select
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value as DressCode)}
                    className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs rounded text-amber-300 font-mono"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Smart Casual">Smart Casual</option>
                    <option value="Semi Formal">Semi Formal</option>
                    <option value="Coctel">Coctel</option>
                    <option value="Formal">Formal</option>
                    <option value="Black Tie">Black Tie</option>
                    <option value="White Tie">White Tie</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">PROCEDENCIA</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1.5 text-xs rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400">ARTES MARCIALES BASE</label>
                <input
                  type="text"
                  value={martialArt}
                  onChange={(e) => setMartialArt(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-xs rounded text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400">BIOGRAFÍA & CONCEPTO</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-700 p-2 text-xs rounded text-white font-mono resize-none"
                />
              </div>
            </div>
          </div>

          {/* Color Palette Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
            <span className="font-['Chakra_Petch'] font-bold text-xs text-amber-400 tracking-wider">
              PALETA DE COLORES DEL ATUENDO
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-neutral-400">COLOR PRIMARIO</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent cursor-pointer border border-neutral-700"
                  />
                  <span className="text-[11px] font-mono">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-neutral-400">SECUNDARIO</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent cursor-pointer border border-neutral-700"
                  />
                  <span className="text-[11px] font-mono">{secondaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-neutral-400">ACENTO / SEDA</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent cursor-pointer border border-neutral-700"
                  />
                  <span className="text-[11px] font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Balance Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
            <span className="font-['Chakra_Petch'] font-bold text-xs text-amber-400 tracking-wider">
              BALANCES DE RENDIMIENTO
            </span>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-400" /> Salud Base</span>
                  <span className="font-bold text-white">{health} HP</span>
                </div>
                <input
                  type="range"
                  min={900}
                  max={1200}
                  step={20}
                  value={health}
                  onChange={(e) => setHealth(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Velocidad de Dash</span>
                  <span className="font-bold text-white">{dashSpeed.toFixed(1)} px/f</span>
                </div>
                <input
                  type="range"
                  min={8.0}
                  max={13.0}
                  step={0.5}
                  value={dashSpeed}
                  onChange={(e) => setDashSpeed(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-rose-400" /> Modificador de Daño</span>
                  <span className="font-bold text-white">{Math.round(attackMod * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.9}
                  max={1.25}
                  step={0.02}
                  value={attackMod}
                  onChange={(e) => setAttackMod(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MOVES, FRAME DATA & HITBOX WORKSHOP */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
            <div>
              <span className="font-['Chakra_Petch'] font-bold text-sm text-amber-400 tracking-wider">
                FRAME DATA & REPERTORIO MARCIAL ({moves.length} MOVIMIENTOS)
              </span>
              <p className="text-[11px] font-mono text-neutral-400">
                Ajuste fino de cuadros de animación: Startup (arranque), Active (golpe activo) y Recovery (recuperación)
              </p>
            </div>
            <button
              onClick={handleAddMove}
              className="px-3 py-1.5 text-xs font-['Chakra_Petch'] font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> AÑADIR MOVIMIENTO
            </button>
          </div>

          {/* Moves List with Frame Editor */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {moves.map((m, idx) => (
              <div
                key={m.id || idx}
                className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg flex flex-col gap-2.5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleUpdateMove(idx, 'name', e.target.value)}
                      className="font-bold text-xs bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-white font-mono flex-1"
                    />
                    <input
                      type="text"
                      value={m.inputDisplayName}
                      onChange={(e) => handleUpdateMove(idx, 'inputDisplayName', e.target.value)}
                      className="text-xs bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-amber-300 font-mono w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={m.type}
                      onChange={(e) => handleUpdateMove(idx, 'type', e.target.value as MoveType)}
                      className="bg-neutral-900 border border-neutral-700 text-[11px] px-2 py-1 rounded text-cyan-300 font-mono"
                    >
                      <option value="Normal">Normal</option>
                      <option value="CommandNormal">Comando</option>
                      <option value="Special">Especial</option>
                      <option value="SuperDM">Super DM (1 Barra)</option>
                      <option value="MAX_SDM">MAX Climax (2 Barras)</option>
                      <option value="Throw">Agarre</option>
                      <option value="Counter">Contraataque</option>
                    </select>

                    <button
                      onClick={() => handleDeleteMove(idx)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Technical Frame Data Row */}
                <div className="grid grid-cols-6 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">STARTUP</span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={m.startupFrames}
                      onChange={(e) => handleUpdateMove(idx, 'startupFrames', Number(e.target.value))}
                      className="w-full text-center bg-transparent text-cyan-400 font-bold"
                    />
                  </div>
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">ACTIVE</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={m.activeFrames}
                      onChange={(e) => handleUpdateMove(idx, 'activeFrames', Number(e.target.value))}
                      className="w-full text-center bg-transparent text-amber-400 font-bold"
                    />
                  </div>
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">RECOVERY</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={m.recoveryFrames}
                      onChange={(e) => handleUpdateMove(idx, 'recoveryFrames', Number(e.target.value))}
                      className="w-full text-center bg-transparent text-rose-400 font-bold"
                    />
                  </div>
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">DAÑO</span>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={m.damage}
                      onChange={(e) => handleUpdateMove(idx, 'damage', Number(e.target.value))}
                      className="w-full text-center bg-transparent text-white font-bold"
                    />
                  </div>
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">VENTAJA HIT</span>
                    <span className={`font-bold ${m.onHitAdvantage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.onHitAdvantage >= 0 ? `+${m.onHitAdvantage}f` : `${m.onHitAdvantage}f`}
                    </span>
                  </div>
                  <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block">VENTAJA BLOCK</span>
                    <span className={`font-bold ${m.onBlockAdvantage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.onBlockAdvantage >= 0 ? `+${m.onBlockAdvantage}f` : `${m.onBlockAdvantage}f`}
                    </span>
                  </div>
                </div>

                {/* Additional Properties & Description */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 gap-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.knockdown}
                        onChange={(e) => handleUpdateMove(idx, 'knockdown', e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Derribo (Knockdown)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.canSuperCancel}
                        onChange={(e) => handleUpdateMove(idx, 'canSuperCancel', e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Super Cancel</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => handleUpdateMove(idx, 'description', e.target.value)}
                    placeholder="Descripción del movimiento..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] text-neutral-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
