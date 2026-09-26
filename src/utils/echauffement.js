// echauffement.js
// Joue les exercices du catalogue (exercicesVocaux.js) selon les réglages de la page Échauffement.

import { NOMS_VOIX, parseChoralText } from './solfaParser';
import { OCTAVE_PAR_VOIX, demiTonsTonalite, solfaToFrequency } from './notesDatabase';
import { playChoralSequences, playGlides, playRhythmicSequence } from './audioEngine';

// Note de départ conseillée pour chaque voix (vers la3/si3 pour les femmes, la2/si2 pour les hommes)
export const DEPART_PAR_VOIX = {
  Soprano: { key: 'C', octave: 4 },
  Alto: { key: 'A', octave: 3 },
  Ténor: { key: 'C', octave: 3 },
  Basse: { key: 'A', octave: 2 },
};

const SILENCE = (beats) => ({ syllable: null, octaveShift: 0, beats, accent: false, isRest: true });

// Les motifs sont écrits en solfa : on les lit avec le parser de l'application (résultat mis en cache)
const cacheMotifs = new Map();
function notesDuMotif(motif) {
  if (!cacheMotifs.has(motif)) {
    cacheMotifs.set(motif, parseChoralText(`Soprano: ${motif}`).voix.Soprano);
  }
  return cacheMotifs.get(motif);
}

const facteurDemiTons = (demiTons) => 2 ** (demiTons / 12);
const nombreDeTemps = (notes) => notes.reduce((total, note) => total + note.beats, 0);

// Noms des notes, pour les afficher pendant la lecture (« mi », avec « m » en petit)
const NOMS_NOTES = { d: 'do', r: 'ré', m: 'mi', f: 'fa', s: 'sol', l: 'la', t: 'si' };

function etiquette(note) {
  const marque = note.octaveShift > 0 ? "'".repeat(note.octaveShift) : ','.repeat(-note.octaveShift);
  return { nom: NOMS_NOTES[note.syllable] ?? note.syllable, solfa: note.syllable + marque };
}

// Un motif lu mesure par mesure (pour le mode écho)
function mesuresDuMotif(motif) {
  return motif
    .split('|')
    .map((mesure) => mesure.trim())
    .filter(Boolean)
    .map((mesure) => notesDuMotif(`${mesure} |`));
}

// Motif de 4 notes tiré au hasard, qui part du do et avance par petits intervalles
const DEGRES = ['s,', 'l,', 't,', 'd', 'r', 'm', 'f', 's', 'l', 't', "d'"];
function motifAleatoire() {
  let position = DEGRES.indexOf('d');
  const notes = ['d'];
  for (let i = 0; i < 3; i += 1) {
    // Seulement des pas qui restent dans la plage (de l, à d') : jamais deux fois la même note
    const possibles = [-3, -2, -1, 1, 2, 3].filter((pas) => position + pas >= 1 && position + pas < DEGRES.length);
    position += possibles[Math.floor(Math.random() * possibles.length)];
    notes.push(DEGRES[position]);
  }
  return `${notes.join(' : ')} |`;
}

/**
 * Joue un exercice. Les exercices chantés sont répétés `repetitions` fois,
 * en montant d'un demi-ton à chaque fois.
 * @returns {{duree: number, chronologie: object[]}} durée en secondes, et pour les exercices mélodiques
 *   la suite de ce qui est joué : { debut, fin, mode: 'ecoute', note } ou { debut, fin, mode: 'chante', notes }
 */
export function jouerExercice(exercice, { key, octave, tempo, repetitions, donnerDo }) {
  const secondesParTemps = 60 / tempo;
  const frequence = (note) =>
    solfaToFrequency(note.syllable, key, octave, note.octaveShift) * facteurDemiTons(note.transpo ?? 0);

  if (exercice.type === 'motif' || exercice.type === 'bourdon') {
    const notes = [];
    const bourdon = [];
    const chronologie = [];
    let temps = 0;

    const ajouter = (note, transpo) => {
      notes.push({ ...note, transpo });
      if (!note.isRest) {
        chronologie.push({
          debut: temps * secondesParTemps,
          fin: (temps + note.beats) * secondesParTemps,
          mode: 'ecoute',
          note: etiquette(note),
        });
      }
      temps += note.beats;
    };
    // Silence ; en mode écho, c'est le moment où le chanteur répète les notes entendues
    const silence = (beats, aChanter) => {
      notes.push(SILENCE(beats));
      if (aChanter) {
        chronologie.push({
          debut: temps * secondesParTemps,
          fin: (temps + beats) * secondesParTemps,
          mode: 'chante',
          notes: aChanter.map(etiquette),
        });
      }
      temps += beats;
    };

    for (let k = 0; k < repetitions; k += 1) {
      const transpo = exercice.aleatoire ? 0 : k; // les motifs surprises restent dans la même tonalité
      const debutRepetition = temps;

      // Le do de la nouvelle tonalité, pour que le chœur prenne le ton
      if (donnerDo) {
        ajouter({ syllable: 'd', octaveShift: 0, beats: 1, accent: false, isRest: false }, transpo);
        silence(1);
      }

      const source = exercice.aleatoire ? motifAleatoire() : exercice.motif;
      if (exercice.echo) {
        mesuresDuMotif(source).forEach((mesure) => {
          mesure.forEach((note) => ajouter(note, transpo));
          silence(nombreDeTemps(mesure), mesure.filter((note) => !note.isRest));
        });
      } else {
        notesDuMotif(source).forEach((note) => ajouter(note, transpo));
      }
      silence(1); // le temps de respirer

      // Bourdon : un do grave tenu pendant toute la répétition
      bourdon.push({ syllable: 'd', octaveShift: -1, beats: temps - debutRepetition, accent: false, isRest: false, transpo });
    }

    if (exercice.type === 'bourdon') {
      playChoralSequences(
        [
          { notes, resolveFrequency: frequence },
          { notes: bourdon, resolveFrequency: frequence },
        ],
        tempo
      );
    } else {
      playRhythmicSequence(notes, frequence, tempo);
    }
    return { duree: temps * secondesParTemps, chronologie };
  }

  if (exercice.type === 'glissando') {
    const glissandos = Array.from({ length: repetitions }, (_, k) => ({
      frequences: exercice.points.map((point) => {
        const [note] = notesDuMotif(`${point} |`);
        return solfaToFrequency(note.syllable, key, octave, note.octaveShift) * facteurDemiTons(k);
      }),
      dureeSegment: exercice.dureeSegment,
    }));
    return { duree: playGlides(glissandos), chronologie: [] };
  }

  if (exercice.type === 'choeur' || exercice.type === 'canon') {
    const lignes =
      exercice.type === 'canon' ? Object.fromEntries(NOMS_VOIX.map((nom) => [nom, exercice.motif])) : exercice.voix;
    // Dans les tonalités hautes (F# à B), tout le chœur descend d'une octave pour rester chantable
    const decalageOctave = demiTonsTonalite(key) >= 6 ? -1 : 0;

    const voix = NOMS_VOIX.filter((nom) => lignes[nom]).map((nom, index) => {
      const ligne = notesDuMotif(lignes[nom]);
      const notes = exercice.type === 'canon' && index > 0 ? [SILENCE(index * exercice.decalage)] : [];
      for (let k = 0; k < repetitions; k += 1) {
        ligne.forEach((note) => notes.push({ ...note, transpo: k }));
        if (exercice.type === 'choeur') notes.push(SILENCE(1));
      }
      const octaveVoix = (exercice.octaves?.[nom] ?? OCTAVE_PAR_VOIX[nom]) + decalageOctave;
      return {
        notes,
        resolveFrequency: (note) =>
          solfaToFrequency(note.syllable, key, octaveVoix, note.octaveShift) * facteurDemiTons(note.transpo),
      };
    });

    playChoralSequences(voix, tempo);
    return { duree: Math.max(...voix.map(({ notes }) => nombreDeTemps(notes))) * secondesParTemps, chronologie: [] };
  }

  return { duree: 0, chronologie: [] };
}
