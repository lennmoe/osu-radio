/**
 * Synthesised "nightcore" beat, scheduled with a Web Audio look-ahead clock.
 * Runs in its own AudioContext so it never touches the <audio> element graph.
 * Kick on every beat, clap on the backbeat, hats on every 8th.
 */
export class NightcoreBeat {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private bpm: number;

  private static readonly LOOKAHEAD = 0.25;
  private static readonly TICK_MS = 40;

  constructor(bpm: number) {
    this.bpm = bpm > 0 ? bpm : 180;
  }

  setBpm(bpm: number): void {
    if (bpm > 0) this.bpm = bpm;
  }

  start(): void {
    if (this.ctx) return;

    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    const len = Math.floor(this.ctx.sampleRate * 0.3);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
    }
  }

  private scheduler = (): void => {
    if (!this.ctx) return;

    const eighth = 30 / this.bpm; // seconds per 8th note
    while (this.nextNoteTime < this.ctx.currentTime + NightcoreBeat.LOOKAHEAD) {
      this.scheduleStep(this.step % 8, this.nextNoteTime);
      this.nextNoteTime += eighth;
      this.step++;
    }

    this.timer = setTimeout(this.scheduler, NightcoreBeat.TICK_MS);
  };

  private scheduleStep(index: number, time: number): void {
    this.hat(time, index % 2 === 0 ? 0.35 : 0.18);
    if (index === 0 || index === 4) this.kick(time);
    if (index === 4) this.clap(time);
  }

  private kick(time: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  private hat(time: number, level: number): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    src.connect(hp).connect(gain).connect(this.master);
    src.start(time);
    src.stop(time + 0.05);
  }

  private clap(time: number): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    src.connect(bp).connect(gain).connect(this.master);
    src.start(time);
    src.stop(time + 0.14);
  }
}
