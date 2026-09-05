let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

/** Sonido motivante al completar una tarea: arpegio ascendente de Do mayor */
export function playCompleteSound() {
  const audio = getCtx();
  if (!audio) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const start = audio.currentTime + i * 0.06;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.start(start);
    osc.stop(start + 0.45);
  });

  const shimmer = audio.createOscillator();
  const shimmerGain = audio.createGain();
  shimmer.connect(shimmerGain);
  shimmerGain.connect(audio.destination);
  shimmer.frequency.value = 2093;
  shimmer.type = 'triangle';
  const sStart = audio.currentTime + 0.18;
  shimmerGain.gain.setValueAtTime(0, sStart);
  shimmerGain.gain.linearRampToValueAtTime(0.08, sStart + 0.02);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, sStart + 0.3);
  shimmer.start(sStart);
  shimmer.stop(sStart + 0.3);
}
