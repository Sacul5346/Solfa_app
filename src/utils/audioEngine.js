// audioEngine.js
// Pilier 3.2 du cahier des charges — lecture audio
// Joue une fréquence donnée via un oscillateur Web Audio API

// Un seul AudioContext partagé pour toute l'app (les navigateurs limitent le nombre d'instances)
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Joue une note à une fréquence donnée pendant une durée donnée.
 *
 * @param {number} frequency - fréquence en Hz (ex: résultat de solfaToFrequency)
 * @param {number} durationSeconds - durée du son en secondes (défaut 0.8s)
 */
export function playNote(frequency, durationSeconds = 0.8) {
  const ctx = getAudioContext();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine'; // son pur, simple pour commencer
  oscillator.frequency.value = frequency;

  // Petit fondu en entrée/sortie pour éviter les "clics" audio
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + durationSeconds);
}

/**
 * Joue une suite de fréquences les unes après les autres (ex: une gamme complète).
 * Utilise le temps interne du AudioContext pour un timing précis,
 * plutôt que des setTimeout qui peuvent dériver.
 *
 * @param {number[]} frequencies - liste de fréquences en Hz, dans l'ordre à jouer
 * @param {number} noteDuration - durée de chaque note en secondes (défaut 0.5s)
 */
export function playSequence(frequencies, noteDuration = 0.5) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  frequencies.forEach((frequency, index) => {
    const startTime = now + index * noteDuration;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + noteDuration);
  });
}

/**
 * Joue une séquence de notes avec leurs durées et respecte les silences.
 *
 * @param {{syllable: string|null, octaveShift: number, beats: number, accent?: boolean, isRest?: boolean}[]} notes
 * @param {(note: object) => number} resolveFrequency
 * @param {number} tempoBPM
 */
export function playRhythmicSequence(notes, resolveFrequency, tempoBPM = 90) {
  const ctx = getAudioContext();
  const secondsPerBeat = 60 / tempoBPM;
  let startTime = ctx.currentTime;

  notes.forEach((note) => {
    const duration = note.beats * secondsPerBeat;

    if (note.isRest) {
      startTime += duration;
      return;
    }

    const frequency = resolveFrequency(note);
    const volumeCrete = note.accent ? 0.42 : 0.26;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volumeCrete, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + Math.max(0.02, duration - 0.03));

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    startTime += duration;
  });
}

/**
 * Joue plusieurs voix en même temps (ex: Soprano, Alto, Ténor, Basse),
 * chacune ayant sa propre séquence de notes — pour former des accords.
 * Toutes les voix démarrent au même instant, chacune suit ensuite son propre rythme.
 *
 * @param {{notes: object[], resolveFrequency: (note: object) => number}[]} voix
 * @param {number} tempoBPM
 */
export function playChoralSequences(voix, tempoBPM = 90) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const secondsPerBeat = 60 / tempoBPM;

  voix.forEach(({ notes, resolveFrequency }) => {
    let curseur = now;

    notes.forEach((note) => {
      const duration = note.beats * secondsPerBeat;

      if (note.isRest) {
        curseur += duration;
        return;
      }

      const frequency = resolveFrequency(note);
      const volumeCrete = note.accent ? 0.28 : 0.2;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0, curseur);
      gainNode.gain.linearRampToValueAtTime(volumeCrete, curseur + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, curseur + Math.max(0.02, duration - 0.03));

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(curseur);
      oscillator.stop(curseur + duration);

      curseur += duration;
    });
  });
}