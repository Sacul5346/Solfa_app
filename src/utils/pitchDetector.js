// pitchDetector.js
// Pilier 3.3 du cahier des charges — reconnaissance vocale
// Capte le micro pendant une courte durée et retourne la fréquence chantée la plus fiable

import { PitchDetector } from 'pitchy';

/**
 * Enregistre le micro pendant `durationMs` et retourne la fréquence détectée (Hz),
 * ou `null` si aucun son suffisamment clair n'a été capté.
 *
 * On garde uniquement les lectures avec une clarté > 0.9 (le son doit être net,
 * pas du bruit ambiant), puis on retient celle avec la meilleure clarté.
 */
export async function recordAndDetectPitch(durationMs = 1500) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const detector = PitchDetector.forFloat32Array(analyser.fftSize);
  const buffer = new Float32Array(analyser.fftSize);

  return new Promise((resolve) => {
    const readings = [];
    const startTime = performance.now();

    function tick() {
      analyser.getFloatTimeDomainData(buffer);
      const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate);

      if (clarity > 0.9) {
        readings.push({ pitch, clarity });
      }

      if (performance.now() - startTime < durationMs) {
        requestAnimationFrame(tick);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();

        if (readings.length === 0) {
          resolve(null);
        } else {
          const meilleure = readings.reduce((a, b) => (b.clarity > a.clarity ? b : a));
          resolve(meilleure.pitch);
        }
      }
    }

    tick();
  });
}

/**
 * Calcule l'écart en cents entre une fréquence chantée et une fréquence cible.
 * 100 cents = un demi-ton. Utile pour évaluer la justesse.
 */
export function ecartEnCents(frequenceChantee, frequenceCible) {
  return 1200 * Math.log2(frequenceChantee / frequenceCible);
}