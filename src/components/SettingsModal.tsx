import React, { useState } from 'react';
import { sound } from '../audio/soundEngine';
import { X, Volume2, Monitor, BookOpen, Shirt, MapPin, Swords } from 'lucide-react';
import { STAGES } from '../data/stageData';
import { CharacterRenderer } from '../engine/characterRenderer';

interface SettingsModalProps {
  onClose: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  scanlinesEnabled,
  onToggleScanlines,
  isMuted,
  onToggleMute
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'dresscodes' | 'stages' | 'audio'>('controls');
  const [bgmVol, setBgmVol] = useState<number>(0.5);
  const [sfxVol, setSfxVol] = useState<number>(0.8);

  const handleBgmChange = (val: number) => {
    setBgmVol(val);
    sound.setVolumes(val, sfxVol);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    sound.setVolumes(bgmVol, val);
    sound.playLightHit();
  };

  const [useIllustrated, setUseIllustrated] = useState<boolean>(CharacterRenderer.useIllustratedSprites);

  return (
    <div className="absolute inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-neutral-900 border border-amber-500/40 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white tracking-wider">
              DRESS CLASH: MANUAL DE REGLAS & CONFIGURACIÓN
            </h3>
          </div>
          <button
            onClick={() => { sound.playMenuBeep(false); onClose(); }}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-2 gap-2 shrink-0">
          <button
            onClick={() => { sound.playMenuBeep(false); setActiveTab('controls'); }}
            className={`px-3 py-1.5 rounded text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'controls' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> COMANDOS & MECÁNICAS
          </button>
          <button
            onClick={() => { sound.playMenuBeep(false); setActiveTab('dresscodes'); }}
            className={`px-3 py-1.5 rounded text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'dresscodes' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" /> 7 ESTILOS & ATUENDOS
          </button>
          <button
            onClick={() => { sound.playMenuBeep(false); setActiveTab('stages'); }}
            className={`px-3 py-1.5 rounded text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'stages' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> 7 ESCENARIOS
          </button>
          <button
            onClick={() => { sound.playMenuBeep(false); setActiveTab('audio'); }}
            className={`px-3 py-1.5 rounded text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'audio' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" /> AUDIO & PANTALLA
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-neutral-300 space-y-4">
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800">
                <span className="font-['Chakra_Petch'] font-bold text-amber-400 block mb-2">
                  DISPOSICIÓN DE BOTONES NEO·GEO (4 BOTONES)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span className="text-red-400 font-bold block text-sm">A / Key J</span>
                    <span className="text-[10px] text-neutral-400">Puño Débil (LP)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span className="text-blue-400 font-bold block text-sm">B / Key K</span>
                    <span className="text-[10px] text-neutral-400">Patada Débil (LK)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span className="text-amber-400 font-bold block text-sm">C / Key U</span>
                    <span className="text-[10px] text-neutral-400">Puño Fuerte (HP)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span className="text-emerald-400 font-bold block text-sm">D / Key I</span>
                    <span className="text-[10px] text-neutral-400">Patada Fuerte (HK)</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 space-y-2">
                <span className="font-['Chakra_Petch'] font-bold text-amber-400 block">
                  MOVIMIENTO & DEFENSAS KOF 2002
                </span>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                  <li><strong className="text-white">Carrera Rápida (Dash):</strong> Toca dos veces Adelante (D, D) para esprintar.</li>
                  <li><strong className="text-white">Salto Corto (Short Hop):</strong> Toca Arriba brevemente para presión aérea rápida.</li>
                  <li><strong className="text-white">Súper Salto:</strong> Toca Abajo y luego Arriba-Adelante para cruzar toda la pantalla.</li>
                  <li><strong className="text-white">Rodamiento de Emergencia (Roll A+B / Key L):</strong> Invulnerabilidad a golpes para cruzar por detrás del rival.</li>
                  <li><strong className="text-white">MAX Mode (B+C / Key O):</strong> Consume 1 barra de poder. Permite cancelar cualquier especial en otro especial (Free Cancel Combo KOF 2002).</li>
                  <li><strong className="text-white">Guard Crush:</strong> Bloquear repetidamente agota la barra azul. Al vaciarse, el personaje queda aturdido y vulnerable.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'dresscodes' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-amber-400">1. Casual (Urbano & Parkour)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Estilo callejero, ágil, fintas, barridos de breakdance y agarres improvisados. Mayor velocidad de dash y saltos dinámicos.
                </p>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-cyan-400">2. Smart Casual (Savate & Karate)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Equilibrio geométrico y elegancia dinámica. Cancelación rápida de golpes normales a especiales con trayectorias de corte en arco.
                </p>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-slate-300">3. Semi Formal (Wing Chun & Judo)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Combate táctico de corta distancia. Puños en cadena sin retroceso y contraataques que proyectan al oponente al suelo.
                </p>
              </div>
              <div className="p-3 bg-emerald-950/80 rounded-lg border border-emerald-500/50">
                <span className="font-bold text-emerald-400">4. Coctel (Capoeira Acrobática & Silat Letal)</span>
                <p className="text-[11px] text-emerald-200/80 mt-1">
                  Movilidad elástica y seductora. Giros rítmicos de Ginga combinados con codos y palmas penetrantes de Pencak Silat a corta distancia.
                </p>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-yellow-500">5. Formal (Boxeo & Muay Thai)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Blindaje y alto impacto. Los puños pesados absorben impactos (superarmadura) y causan daño masivo a la barra de guardia.
                </p>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-rose-400">6. Black Tie (Aikido & Esgrima)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Redirección de inercia y contraataques quirúrgicos (+25% daño de Counter Hit). Evasiones aristocráticas y estocadas de filo puro.
                </p>
              </div>
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                <span className="font-bold text-purple-300">7. White Tie (Jiu-Jitsu Imperial & Sambo)</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Máxima sofisticación cortesana. Agarres de comando inbloqueables, sumisiones técnicas y HSDM de dominio absoluto.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-2">
              {STAGES.map((s, idx) => (
                <div key={s.id} className="p-2.5 bg-neutral-950/80 rounded-lg border border-neutral-800 flex items-start gap-3">
                  <span className="font-['Chakra_Petch'] font-bold text-amber-400 text-sm">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{s.name}</span>
                      <span className="text-[10px] text-amber-400">[{s.dressCodeLevel}]</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Motor Gráfico de Peleadores</span>
                  <span className="text-[10px] text-neutral-400">
                    {useIllustrated ? 'Arte Digital Ilustrado HD (Sprites Obra Maestra)' : 'Rig Pixel-Art Neo Geo (Animación Esquelética IK)'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playMenuBeep(false);
                    const next = !useIllustrated;
                    setUseIllustrated(next);
                    CharacterRenderer.useIllustratedSprites = next;
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    useIllustrated ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 inline mr-1" />
                  {useIllustrated ? 'ILUSTRADO HD' : 'RIG PIXEL-ART IK'}
                </button>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Filtro CRT Scanlines</span>
                  <span className="text-[10px] text-neutral-400">Simulación óptica de monitor arcade retro Neo Geo</span>
                </div>
                <button
                  onClick={() => { sound.playMenuBeep(false); onToggleScanlines(); }}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    scanlinesEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1" />
                  {scanlinesEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Silenciar Todo el Audio</span>
                  <span className="text-[10px] text-neutral-400">Mute global Web Audio API</span>
                </div>
                <button
                  onClick={() => { sound.playMenuBeep(false); onToggleMute(); }}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {isMuted ? 'SILENCIADO' : 'ACTIVO'}
                </button>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Volumen BGM Arcade Synth</span>
                    <span className="font-bold text-white">{Math.round(bgmVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={bgmVol}
                    onChange={(e) => handleBgmChange(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Volumen Efectos de Golpe (SFX & Público)</span>
                    <span className="font-bold text-white">{Math.round(sfxVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={sfxVol}
                    onChange={(e) => handleSfxChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
