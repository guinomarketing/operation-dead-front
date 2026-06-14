/**
 * AudioSystem — sonido del juego.
 * SFX 100% procedurales con WebAudio (sin assets) + música por loops (mp3).
 * Volúmenes persistidos en localStorage. Singleton estático.
 */
type SfxName =
  | 'shoot' | 'hit' | 'explosion' | 'deploy' | 'enemyDeath' | 'allyDeath'
  | 'uiClick' | 'victory' | 'defeat' | 'waveStart' | 'heal' | 'baseHit';

type MusicKey = 'menu' | 'combat';

const MUSIC_FILES: Record<MusicKey, string> = {
  menu: '/assets/audio/music-menu.mp3',
  combat: '/assets/audio/music-combat.mp3',
};

class AudioSystemImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  sfxVolume = 0.55;
  musicVolume = 0.32;
  muted = false;

  private music: HTMLAudioElement | null = null;
  private currentMusic: MusicKey | null = null;
  private lastShoot = 0;

  constructor() {
    try {
      const s = localStorage.getItem('audioPrefs');
      if (s) {
        const p = JSON.parse(s);
        if (typeof p.sfx === 'number') this.sfxVolume = p.sfx;
        if (typeof p.music === 'number') this.musicVolume = p.music;
        if (typeof p.muted === 'boolean') this.muted = p.muted;
      }
    } catch (e) { /* ignore */ }
  }

  /** Desbloquea el AudioContext tras el primer gesto del usuario. */
  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AC();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(ctx.destination);
      const sfxGain = ctx.createGain();
      sfxGain.gain.value = this.sfxVolume;
      sfxGain.connect(master);
      // buffer de ruido reutilizable
      const len = ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.sfxGain = sfxGain;
      this.noiseBuffer = noiseBuffer;
    } catch (e) { /* audio not available */ }
  }

  private persist(): void {
    try { localStorage.setItem('audioPrefs', JSON.stringify({ sfx: this.sfxVolume, music: this.musicVolume, muted: this.muted })); } catch (e) { /* ignore */ }
  }

  setSfxVolume(v: number): void { this.sfxVolume = Math.max(0, Math.min(1, v)); if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume; this.persist(); }
  setMusicVolume(v: number): void { this.musicVolume = Math.max(0, Math.min(1, v)); if (this.music) this.music.volume = this.musicVolume; this.persist(); }
  toggleMute(): boolean { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 1; if (this.music) this.music.muted = this.muted; this.persist(); return this.muted; }

  // ── primitivas ──
  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain: number, filterType: BiquadFilterType, freq: number, freqEnd?: number): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) filt.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt); filt.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  play(name: SfxName): void {
    if (!this.ctx) return;
    switch (name) {
      case 'shoot': {
        const now = performance.now();
        if (now - this.lastShoot < 55) return; // throttle
        this.lastShoot = now;
        this.noise(0.07, 0.35, 'highpass', 1400);
        this.tone(220, 0.05, 'square', 0.10, 90);
        break;
      }
      case 'hit': this.tone(160, 0.08, 'triangle', 0.18, 70); break;
      case 'explosion':
        this.noise(0.5, 0.6, 'lowpass', 800, 80);
        this.tone(90, 0.4, 'sawtooth', 0.25, 35);
        break;
      case 'deploy':
        this.tone(330, 0.10, 'square', 0.14, 520);
        this.tone(520, 0.10, 'square', 0.10);
        break;
      case 'enemyDeath': this.tone(260, 0.22, 'sawtooth', 0.16, 70); this.noise(0.18, 0.18, 'bandpass', 600, 200); break;
      case 'allyDeath': this.tone(200, 0.3, 'triangle', 0.18, 80); break;
      case 'uiClick': this.tone(680, 0.04, 'square', 0.12); break;
      case 'heal': this.tone(520, 0.18, 'sine', 0.14, 780); break;
      case 'baseHit': this.noise(0.25, 0.3, 'lowpass', 500, 120); this.tone(70, 0.2, 'square', 0.18); break;
      case 'waveStart':
        this.tone(180, 0.5, 'sawtooth', 0.16, 150);
        this.tone(182, 0.5, 'sawtooth', 0.14, 152);
        break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'square', 0.16), i * 130));
        break;
      case 'defeat':
        [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sawtooth', 0.16), i * 180));
        break;
    }
  }

  // ── música ──
  playMusic(key: MusicKey): void {
    if (this.currentMusic === key && this.music && !this.music.paused) return;
    this.stopMusic();
    const el = new Audio(MUSIC_FILES[key]);
    el.loop = true;
    el.volume = this.musicVolume;
    el.muted = this.muted;
    el.play().catch(() => { /* esperando gesto del usuario */ });
    this.music = el;
    this.currentMusic = key;
  }

  stopMusic(): void {
    if (this.music) { try { this.music.pause(); } catch (e) { /* ignore */ } this.music = null; }
    this.currentMusic = null;
  }
}

export const Audio2 = new AudioSystemImpl();
