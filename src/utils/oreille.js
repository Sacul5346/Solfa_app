// oreille.js
// Questions et sons de la page Oreille : note, intervalle, petite dictée, accord.

import { playChoralSequences } from './audioEngine';
import { SOLFA_SEMITONES, solfaToFrequency } from './notesDatabase';

const TEMPO = 80;

// Une note = { syllable, octaveShift }
const n = (syllable, octaveShift = 0) => ({ syllable, octaveShift });

// Sur les partitions de chorale, fa haussé s'écrit « fe »
const ECRITURE = { d: 'd', r: 'r', m: 'm', f: 'f', fi: 'fe', s: 's', l: 'l', ta: 'ta', t: 't' };
const NOMS = { d: 'do', r: 'ré', m: 'mi', f: 'fa', fi: 'fa♯', s: 'sol', l: 'la', ta: 'si♭', t: 'si' };

/** « s, », « d' », « fe »… */
export function ecrire(note) {
  const marque = note.octaveShift > 0 ? "'" : note.octaveShift < 0 ? ',' : '';
  return ECRITURE[note.syllable] + marque;
}

export const nommer = (note) => NOMS[note.syllable];
/** Hauteur en demi-tons au-dessus du do. */
export const hauteur = (note) => SOLFA_SEMITONES[note.syllable] + 12 * note.octaveShift;
export const cle = (note) => `${note.syllable}${note.octaveShift}`;
export const estAlteree = (note) => note.syllable === 'fi' || note.syllable === 'ta';

// --- Modes et niveaux ---

export const MODES = [
  { id: 'note', titre: 'Note', consigne: 'Tu entends le do, puis une note. Trouve-la sur l’échelle.' },
  { id: 'intervalle', titre: 'Intervalle', consigne: 'Tu entends deux notes. La première est donnée : trouve la seconde.' },
  { id: 'dictee', titre: 'Petite dictée', consigne: 'Tu entends le do, puis une courte mélodie. Retrouve ses notes dans l’ordre.' },
  { id: 'accord', titre: 'Accord', consigne: 'Tu entends le do, puis un accord à trois voix. Lequel est-ce ?' },
];

const GAMME = ['d', 'r', 'm', 'f', 's', 'l', 't'].map((s) => n(s));
const GRAVES = [n('s', -1), n('l', -1), n('t', -1)];

export const NIVEAUX_NOTES = [
  { titre: 'd m s', notes: [n('d'), n('m'), n('s')] },
  { titre: 'd r m s l', notes: ['d', 'r', 'm', 's', 'l'].map((s) => n(s)) },
  { titre: 'Toute la gamme', notes: GAMME },
  { titre: 'Avec les octaves', notes: [...GRAVES, ...GAMME, n('d', 1)] },
  { titre: 'Avec fe et ta', notes: [...GRAVES, ...GAMME, n('fi'), n('ta'), n('d', 1)] },
];

// Accords de la gamme, écrits serrés autour du do
export const ACCORDS = {
  I: { notes: [n('d'), n('m'), n('s')], genre: 'majeur' },
  ii: { notes: [n('r'), n('f'), n('l')], genre: 'mineur' },
  iii: { notes: [n('m'), n('s'), n('t')], genre: 'mineur' },
  IV: { notes: [n('f'), n('l'), n('d', 1)], genre: 'majeur' },
  V: { notes: [n('s', -1), n('t', -1), n('r')], genre: 'majeur' },
  vi: { notes: [n('l', -1), n('d'), n('m')], genre: 'mineur' },
};

export const NIVEAUX_ACCORDS = [
  { titre: 'Majeur ou mineur', accords: Object.keys(ACCORDS), reponses: ['majeur', 'mineur'] },
  { titre: 'I, IV ou V', accords: ['I', 'IV', 'V'], reponses: ['I', 'IV', 'V'] },
  { titre: 'I, ii, IV, V, vi', accords: ['I', 'ii', 'IV', 'V', 'vi'], reponses: ['I', 'ii', 'IV', 'V', 'vi'] },
];

export const niveauxDuMode = (mode) => (mode === 'accord' ? NIVEAUX_ACCORDS : NIVEAUX_NOTES);

// --- Questions ---

const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
const ecart = (a, b) => Math.abs(hauteur(a) - hauteur(b));

/**
 * Tire une question. `precedente` évite de reposer tout de suite la même.
 * La réponse attendue est une liste de clés (une seule, sauf pour la dictée).
 */
export function nouvelleQuestion(mode, niveau, precedente) {
  if (mode === 'accord') {
    const { accords, reponses } = NIVEAUX_ACCORDS[niveau];
    const possibles = accords.filter((a) => a !== precedente?.accord);
    const accord = auHasard(possibles.length ? possibles : accords);
    const reponse = reponses.includes(accord) ? accord : ACCORDS[accord].genre;
    return { mode, accord, reponse: [reponse] };
  }

  const notes = NIVEAUX_NOTES[niveau].notes;

  if (mode === 'note') {
    const possibles = notes.filter((x) => !precedente?.cible || cle(x) !== cle(precedente.cible));
    const cible = auHasard(possibles);
    return { mode, cible, reponse: [cle(cible)] };
  }

  if (mode === 'intervalle') {
    const depart = auHasard(notes);
    const cible = auHasard(notes.filter((x) => cle(x) !== cle(depart) && ecart(x, depart) <= 12));
    return { mode, depart, cible, reponse: [cle(cible)] };
  }

  // Dictée : part d'une note de l'accord de do, puis avance par pas d'au plus une quinte
  const longueur = niveau < 2 ? 3 : 4;
  const departs = notes.filter((x) => x.octaveShift === 0 && ['d', 'm', 's'].includes(x.syllable));
  const cibles = [auHasard(departs)];
  while (cibles.length < longueur) {
    const derniere = cibles.at(-1);
    cibles.push(auHasard(notes.filter((x) => cle(x) !== cle(derniere) && ecart(x, derniere) <= 7)));
  }
  return { mode, cibles, reponse: cibles.map(cle) };
}

const INTERVALLES = [
  'unisson', 'seconde mineure', 'seconde majeure', 'tierce mineure', 'tierce majeure', 'quarte juste', 'triton',
  'quinte juste', 'sixte mineure', 'sixte majeure', 'septième mineure', 'septième majeure', 'octave',
];

/** « tierce majeure montante »… */
export function nomIntervalle(de, vers) {
  const demiTons = hauteur(vers) - hauteur(de);
  const nom = INTERVALLES[Math.abs(demiTons)];
  if (demiTons === 0) return nom;
  return `${nom} ${demiTons > 0 ? 'montante' : 'descendante'}`;
}

// --- Sons ---

// Un morceau = des notes jouées ensemble pendant `beats` temps (aucune note : silence)
const seule = (note, beats = 1) => ({ notes: [note], beats });
const silence = (beats) => ({ notes: [], beats });
const DO = seule(n('d'));

function jouer(morceaux, key, octave) {
  const nbVoix = Math.max(1, ...morceaux.map((m) => m.notes.length));
  const voix = Array.from({ length: nbVoix }, (_, i) => ({
    notes: morceaux.map((m) => (m.notes[i] ? { ...m.notes[i], beats: m.beats } : { isRest: true, beats: m.beats })),
    resolveFrequency: (note) => solfaToFrequency(note.syllable, key, octave, note.octaveShift),
  }));
  playChoralSequences(voix, TEMPO);
}

const accord = (id, beats = 2.5) => ({ notes: ACCORDS[id].notes, beats });
const melodie = (notes) => notes.map((note, i) => seule(note, i === notes.length - 1 ? 1.5 : 1));

/** Fait entendre la question. */
export function jouerQuestion(question, key, octave) {
  const morceaux = {
    note: () => [DO, silence(0.5), seule(question.cible, 1.5)],
    intervalle: () => [seule(question.depart), seule(question.cible, 1.5)],
    dictee: () => [DO, silence(1), ...melodie(question.cibles)],
    accord: () => [DO, silence(0.5), accord(question.accord)],
  }[question.mode]();
  jouer(morceaux, key, octave);
}

/**
 * Après une erreur : la bonne réponse, un silence, puis celle qui a été donnée.
 * `donnee` est une note (note, intervalle), une liste de notes (dictée) ou une clé d'accord.
 */
export function jouerComparaison(question, donnee, key, octave) {
  const morceaux = {
    note: () => [DO, silence(0.5), seule(question.cible, 1.5), silence(1), seule(donnee, 1.5)],
    intervalle: () => [seule(question.depart), seule(question.cible, 1.5), silence(1), seule(question.depart), seule(donnee, 1.5)],
    dictee: () => [DO, silence(1), ...melodie(question.cibles), silence(1.5), ...melodie(donnee)],
    // Accord : si la réponse était un genre, on l'égrène note par note puis on le rejoue
    accord: () =>
      ACCORDS[donnee]
        ? [accord(question.accord), silence(1), accord(donnee)]
        : [...ACCORDS[question.accord].notes.map((note) => seule(note, 0.75)), silence(0.5), accord(question.accord)],
  }[question.mode]();
  jouer(morceaux, key, octave);
}

export const jouerNote = (note, key, octave) => jouer([seule(note, 1)], key, octave);
export const jouerAccord = (id, key, octave) => jouer([accord(id, 2)], key, octave);
