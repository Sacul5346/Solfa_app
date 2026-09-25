export const SOLFA_SEMITONES = {
  d: 0,
  di: 1,
  r: 2,
  ri: 3,
  m: 4,
  f: 5,
  fi: 6,
  s: 7,
  si: 8,
  l: 9,
  ta: 10,
  t: 11,
};

export const KEYS_DISPONIBLES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const KEY_OFFSETS = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export const OCTAVE_PAR_VOIX = {
  Soprano: 5,
  Alto: 4,
  Tenor: 3,
  Basse: 2,
};

const SYLLABLES_BY_SEMITONE = Object.entries(SOLFA_SEMITONES)
  .reduce((syllables, [syllable, semitones]) => {
    syllables[semitones] = syllable;
    return syllables;
  }, {});

export function solfaToFrequency(syllable, key = 'C', octave = 4, octaveShift = 0) {
  const semitones = SOLFA_SEMITONES[syllable];
  const keyOffset = KEY_OFFSETS[key];

  if (semitones === undefined || keyOffset === undefined) {
    throw new Error(`Note solfa ou tonalité inconnue : ${syllable} / ${key}`);
  }

  const midiNote = 12 * (octave + octaveShift + 1) + keyOffset + semitones;
  return 440 * 2 ** ((midiNote - 69) / 12);
}

export function frequencyToSolfa(frequency, key = 'C') {
  const keyOffset = KEY_OFFSETS[key];

  if (keyOffset === undefined || !Number.isFinite(frequency) || frequency <= 0) {
    throw new Error(`Fréquence ou tonalité invalide : ${frequency} / ${key}`);
  }

  const midiNote = 69 + 12 * Math.log2(frequency / 440);
  const semitonesFromKey = Math.round(midiNote - keyOffset) % 12;
  const normalizedSemitones = (semitonesFromKey + 12) % 12;

  return {
    syllable: SYLLABLES_BY_SEMITONE[normalizedSemitones],
    midiNote,
  };
}
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
 * Joue une séquence de notes dont chacune a sa propre durée (en "temps"/beats),
 * pour respecter le rythme réel d'une séquence importée (pilier 3.5).
 *
 * @param {{syllable: string, octaveShift: number, beats: number}[]} notes - séquence parsée
 * @param {(note: object) => number} resolveFrequency - fonction qui calcule la fréquence d'une note
 * @param {number} tempoBPM - tempo en battements par minute (défaut 90)
 */
export function playRhythmicSequence(notes, resolveFrequency, tempoBPM = 90) {
  const ctx = getAudioContext();
  const secondsPerBeat = 60 / tempoBPM;
  let curseur = ctx.currentTime;

  notes.forEach((note) => {
    const duration = note.beats * secondsPerBeat;
    const frequency = resolveFrequency(note);

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, curseur);
    gainNode.gain.linearRampToValueAtTime(0.3, curseur + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, curseur + duration - 0.03);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(curseur);
    oscillator.stop(curseur + duration);

    curseur += duration;
  });
}