let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let toneToggle = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignore autoplay restrictions before user gesture
    });
  }
  return audioCtx;
}

function playBeep(freqHz: number, durationSec = 0.18) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freqHz, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio synthesis errors in restricted environments
  }
}

export function startAlarmLoop(): void {
  if (typeof window === 'undefined') return;
  if (alarmIntervalId !== null) return;

  toneToggle = false;
  playBeep(880);

  alarmIntervalId = window.setInterval(() => {
    toneToggle = !toneToggle;
    playBeep(toneToggle ? 660 : 880);
  }, 300);
}

export function stopAlarmLoop(): void {
  if (alarmIntervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}
