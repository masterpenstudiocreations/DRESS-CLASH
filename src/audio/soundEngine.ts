// Neo Geo Inspired Procedural Web Audio Engine
// Provides high-energy fighting game synth BGM, crisp punch/kick SFX, crowd cheers, and announcer cues

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmTimer: number | null = null;
  private currentStageBgm: string = 'rock';
  private bgmStep: number = 0;
  private isPlayingBgm: boolean = false;

  private sfxVol: number = 0.8;
  private bgmVol: number = 0.5;

  constructor() {
    // Initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVol;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolumes(bgm: number, sfx: number) {
    this.bgmVol = bgm;
    this.sfxVol = sfx;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  // --- SFX GENERATORS ---

  public playLightHit(pitchMod: number = 1) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Pitch sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(70 * pitchMod, t + 0.08);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);

    // Noise snap
    this.playNoiseSnap(0.04, 0.4, 2500);
  }

  public playHeavyHit(pitchMod: number = 1) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Deep sub drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(40 * pitchMod, t + 0.22);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);

    // Heavy distortion snap
    this.playNoiseSnap(0.12, 0.7, 1200);
  }

  public playCounterHit() {
    this.playHeavyHit(1.2);
    this.playAnnouncer('COUNTER!');
    // High resonant chime
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1320, t + 0.05);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playBlock() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Metallic clatter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.setValueAtTime(380, t + 0.02);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playGuardCrush() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Glass shatter sound
    this.playNoiseSnap(0.3, 0.9, 4500);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.35);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);

    this.playAnnouncer('GUARD CRUSH!');
  }

  public playSwing() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playRoll() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // Fast filtered wind whoosh
    this.playNoiseSnap(0.2, 0.45, 1800, 'bandpass');
  }

  public playDash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(260, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playJump() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playSuperFlash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Cinematic freeze chime
    const freqs = [587.33, 739.99, 880, 1174.66]; // D-maj chord
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.02);

      gain.gain.setValueAtTime(0.25, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.02);
      osc.stop(t + 0.6);
    });

    this.playNoiseSnap(0.2, 0.5, 3000);
  }

  public playMaxModeActivate() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Rising arpeggio
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);

      gain.gain.setValueAtTime(0.3, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.03 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.2);
    });
  }

  public playKnockdown() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playKO() {
    this.initCtx();
    this.playHeavyHit(0.7);
    this.playAnnouncer('K.O.!');
    this.playCheer();
  }

  public playCheer() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    // Soft energetic crowd noise
    this.playNoiseSnap(0.8, 0.35, 1200, 'bandpass');
  }

  public playCameraFlash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playMenuBeep(confirm: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = confirm ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(confirm ? 587.33 : 440, t);
    if (confirm) {
      osc.frequency.setValueAtTime(880, t + 0.06);
    }
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (confirm ? 0.16 : 0.06));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (confirm ? 0.16 : 0.06));
  }

  // --- ANNOUNCER VOICE ---
  public playAnnouncer(text: string) {
    if ('speechSynthesis' in window && !this.isMuted) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.15;
        utterance.pitch = 0.9;
        utterance.volume = this.sfxVol;
        // Search for dynamic punchy voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Google')));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback tone
        this.playMenuBeep(true);
      }
    } else {
      this.playMenuBeep(true);
    }
  }

  private playNoiseSnap(duration: number, volume: number, cutoff: number, filterType: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoff;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // --- NEO GEO ARCADE BGM SYNTHESIZER ---

  public startStageBGM(style: string) {
    this.initCtx();
    this.currentStageBgm = style;
    if (this.isPlayingBgm) return;
    this.isPlayingBgm = true;
    this.bgmStep = 0;

    const tempo = 138; // BPM
    const stepInterval = (60 / tempo) / 4; // 16th notes (approx 108ms)

    const tick = () => {
      if (!this.isPlayingBgm) return;
      this.playBgmStep(this.bgmStep, this.currentStageBgm);
      this.bgmStep = (this.bgmStep + 1) % 64;
      this.bgmTimer = window.setTimeout(tick, stepInterval * 1000);
    };

    tick();
  }

  public stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playBgmStep(step: number, style: string) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Bass patterns
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Drum beat: Kick on 0, 8; Snare on 4, 12; Hi-hat on every even step
    if (stepInBar === 0 || stepInBar === 8 || (stepInBar === 10 && bar % 2 === 1)) {
      this.synthKick(t);
    }
    if (stepInBar === 4 || stepInBar === 12) {
      this.synthSnare(t);
    }
    if (stepInBar % 2 === 0) {
      this.synthHihat(t, stepInBar % 4 === 2 ? 0.08 : 0.04);
    }

    // Neo Geo FM Bassline & Chords
    // Scales: D minor / F / G / A
    const rootNotes = [146.83, 130.81, 164.81, 110.0]; // D3, C3, E3, A2
    const root = rootNotes[bar % 4];

    if (stepInBar % 2 === 0) {
      // 8th note driving bassline
      const bassFreq = (stepInBar === 6 || stepInBar === 14) ? root * 1.5 : root;
      this.synthBass(t, bassFreq, style);
    }

    // Lead Arp or melody on key accents
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 10 || stepInBar === 12) {
      const melodyFreq = root * 2 * (stepInBar === 3 ? 1.2 : stepInBar === 6 ? 1.5 : 1);
      this.synthLead(t, melodyFreq, style);
    }
  }

  private synthKick(t: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  private synthSnare(t: number) {
    if (!this.ctx || !this.bgmGain) return;
    // White noise snare + body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // Noise crack
    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    noise.connect(noiseGain);
    noiseGain.connect(this.bgmGain);
    noise.start(t);
    noise.stop(t + 0.14);
  }

  private synthHihat(t: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  private synthBass(t: number, freq: number, style: string) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = style === 'funk' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq / 2, t);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  private synthLead(t: number, freq: number, style: string) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = style === 'orchestral' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }
}

export const sound = new SoundEngine();
