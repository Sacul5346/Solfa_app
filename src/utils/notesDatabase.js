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

// Autres écritures du tonic sol-fa (notation anglaise de Curwen), ramenées aux syllabes ci-dessus.
// « re » et « la » sont exclus : en solfège français ils désignent ré et la ordinaires.
export const SOLFA_ALIAS = {
  te: 't', // 7e degré, écrit « te » en toutes lettres
  fe: 'fi', // fa haussé
  se: 'si', // sol haussé
  de: 'di', // do haussé
  ma: 'ri', // mi baissé (même son que ri)
  ra: 'di', // ré baissé (même son que di)
};

// Les 12 tonalités proposées dans les menus, avec l'orthographe la plus courante
export const KEYS_DISPONIBLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Décalage en demi-tons depuis C — les équivalents enharmoniques (C# = Db…) sont acceptés à l'import
const KEY_OFFSETS = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

/** Écart en demi-tons entre C et la tonalité (0 pour C, 7 pour G…). */
export function demiTonsTonalite(key) {
  return KEY_OFFSETS[key] ?? 0;
}

export function estTonaliteConnue(key) {
  return KEY_OFFSETS[key] !== undefined;
}

export const OCTAVE_PAR_VOIX = {
  Soprano: 5,
  Alto: 4,
  Ténor: 3,
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
