// solfaParser.js
// Pilier 3.4 du cahier des charges — import de solfa écrit (texte)
// Transforme un texte au format solfa (Key + notation rythmique) en séquence exploitable

import { KEYS_DISPONIBLES, SOLFA_ALIAS, SOLFA_SEMITONES, estTonaliteConnue } from './notesDatabase';

export const NOMS_VOIX = ['Soprano', 'Alto', 'Ténor', 'Basse'];

const TEMPS_ACCENTUES = {
  '4/4': [1],
  '3/4': [1],
  '6/8': [1, 4],
  '2/4': [1],
};

function tempsAccentuesPour(mesure) {
  return TEMPS_ACCENTUES[mesure] || [1];
}

/**
 * Uniformise une ligne copiée d'un document : apostrophes et tirets typographiques,
 * demi-barre « ¦ » écrite « ! ».
 */
function normaliserLigne(ligne) {
  return ligne
    .replace(/[’‘´`]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/¦/g, '!')
    .trim();
}

/**
 * Lit la tonalité : « Key: G », « Key: F# », « Do dia Bb », « Do = E♭ ».
 * Retourne null si la ligne n'en est pas une. Lève une erreur si la tonalité n'est pas reconnue.
 */
function lireKey(ligne) {
  const match = ligne.match(/^(?:key\b|do\s*(?:dia\b|=|:))\s*[:=]?\s*([A-G])(#|b|♯|♭)?/i);
  if (!match) {
    if (/^key\b/i.test(ligne)) {
      throw new Error(`Tonalité illisible : « ${ligne} » (exemples : Key: G, Key: F#, Do dia Bb).`);
    }
    return null;
  }

  const alteration = (match[2] || '').replace('♯', '#').replace('♭', 'b').toLowerCase();
  const key = match[1].toUpperCase() + alteration;
  if (!estTonaliteConnue(key)) {
    throw new Error(`Tonalité « ${key} » non prise en charge (disponibles : ${KEYS_DISPONIBLES.join(', ')}).`);
  }
  return key;
}

/** Lit une mesure chiffrée (« 4/4 », « 6/8 ») n'importe où dans la ligne. */
function lireChiffrage(ligne) {
  const match = ligne.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  return match ? `${match[1]}/${match[2]}` : null;
}

/** Une ligne de musique : séparateurs de temps ou de mesure, et seulement des caractères solfa. */
function estLigneMusique(ligne) {
  return /[:|]/.test(ligne) && /^[\s|!:.,'a-z-]+$/i.test(ligne) && /[a-z-]/i.test(ligne);
}

/** Repères de structure : DC, D.C., DS1, S1, Fin… */
function estRepere(ligne) {
  return /^(?:\s*(?:d\.?\s*c\.?|d\.?\s*s\.?\s*\d*|s\s*\d+|fin(?:e)?|al\s+fine|𝄋|𝄌)\s*)+$/i.test(ligne);
}

/**
 * Découpe un temps (le texte entre deux « : » ou « ! ») en parts avec leur durée.
 *   « d »        → d (1)
 *   « d.r »      → d (½) + r (½)
 *   « d,r.m »    → d (¼) + r (¼) + m (½)
 *   « d.r,m »    → d (½) + r (¼) + m (¼)
 *   « d.,r »     → rythme pointé : d (¾) + r (¼)
 *   « d.,r.m »   → d (¼) + r (¼) + m (½)  (écriture courante des partitions malgaches)
 *   « d.r.m »    → triolet, un tiers chacun
 *   « .d », « -.r » → silence ou prolongation (½) puis la note (½)
 * Octaves : « d' », « d'' » au-dessus ; « s, », « s,, » en dessous (« ,s » en début de temps aussi).
 */
function lireTemps(brut) {
  const s = brut.replace(/\s+/g, '');
  if (s === '') return [{ type: 'silence', duree: 1 }];

  const parts = [];
  const separateurs = [];
  let courant = null;
  let i = 0;

  const fermer = () => {
    parts.push(courant ?? { type: 'silence' });
    courant = null;
  };

  while (i < s.length) {
    const c = s[i];

    if (/[a-z]/i.test(c) || (i === 0 && c === ',')) {
      if (courant) throw new Error(`deux notes sans séparateur dans « ${s} »`);

      let octaveShift = 0;
      while (s[i] === ',') {
        octaveShift -= 1;
        i += 1;
      }

      let j = i;
      while (j < s.length && /[a-z]/i.test(s[j])) j += 1;
      const ecrite = s.slice(i, j).toLowerCase();
      const syllable = SOLFA_ALIAS[ecrite] ?? ecrite;
      if (SOLFA_SEMITONES[syllable] === undefined) {
        throw new Error(`syllabe inconnue « ${s.slice(i, j) || s} »`);
      }

      while (s[j] === "'") {
        octaveShift += 1;
        j += 1;
      }
      // Une virgule collée à la note est une marque d'octave basse,
      // sauf si elle est suivie d'une note : c'est alors un séparateur de quart de temps
      while (s[j] === ',' && !/[a-z-]/i.test(s[j + 1] ?? '')) {
        octaveShift -= 1;
        j += 1;
      }

      courant = { type: 'note', syllable, octaveShift };
      i = j;
    } else if (c === '-') {
      if (courant) throw new Error(`« - » mal placé dans « ${s} »`);
      courant = { type: 'tenue' };
      i += 1;
    } else if (c === '.') {
      fermer();
      if (s[i + 1] === ',') {
        separateurs.push('.,');
        i += 2;
      } else {
        separateurs.push('.');
        i += 1;
      }
    } else if (c === ',') {
      fermer();
      separateurs.push(',');
      i += 1;
    } else {
      throw new Error(`caractère inattendu « ${c} » dans « ${s} »`);
    }
  }
  fermer();

  // Position de chaque séparateur dans le temps
  const positions = [0];
  let pointVu = false;
  separateurs.forEach((sep, k) => {
    if (sep === '.') {
      positions.push(0.5);
      pointVu = true;
    } else if (sep === ',') {
      positions.push(pointVu ? 0.75 : 0.25);
    } else {
      positions.push(separateurs.slice(k + 1).includes('.') ? 0.25 : 0.75);
      pointVu = true;
    }
  });
  positions.push(1);

  const croissant = positions.every((p, k) => k === 0 || p > positions[k - 1]);
  return parts.map((part, k) => ({
    ...part,
    duree: croissant ? positions[k + 1] - positions[k] : 1 / parts.length,
  }));
}

/**
 * Lit une ligne de musique : mesures séparées par « | », temps par « : » ou « ! » (demi-barre).
 * @returns {{ texte: string, temps: { parts: object[], apresDemiBarre: boolean }[] }[]}
 */
function lireLigne(ligne, contexte) {
  const mesures = ligne.split(/\|+/).map((m) => m.trim()).filter(Boolean);

  return mesures.map((texteMesure, indexMesure) => {
    const morceaux = texteMesure.split(/([:!])/);
    const temps = [];
    for (let k = 0; k < morceaux.length; k += 2) {
      try {
        temps.push({ parts: lireTemps(morceaux[k]), apresDemiBarre: morceaux[k - 1] === '!' });
      } catch (e) {
        throw new Error(`${contexte}, mesure ${indexMesure + 1} : ${e.message}.`, { cause: e });
      }
    }
    const texte = texteMesure.replace(/\s*([:!])\s*/g, ' $1 ').replace(/\s+/g, ' ').trim();
    return { texte, temps };
  });
}

/**
 * Ajoute à `notes` les notes des mesures lues. Une prolongation « - » allonge la note
 * précédente (même si elle est dans la ligne d'avant) ; sans note précédente, c'est un silence.
 */
function ajouterNotes(notes, mesures, tempsForts) {
  mesures.forEach(({ temps }) => {
    temps.forEach(({ parts, apresDemiBarre }, index) => {
      const fort = tempsForts.includes(index + 1) || apresDemiBarre;

      parts.forEach((part, indexPart) => {
        if (part.type === 'tenue' && notes.length > 0) {
          notes[notes.length - 1].beats += part.duree;
          return;
        }

        if (part.type !== 'note') {
          notes.push({ syllable: null, octaveShift: 0, beats: part.duree, accent: false, isRest: true });
          return;
        }

        notes.push({
          syllable: part.syllable,
          octaveShift: part.octaveShift,
          beats: part.duree,
          accent: indexPart === 0 && fort,
          isRest: false,
        });
      });
    });
  });
  return notes;
}

const NOMS_CANONIQUES = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Ténor',
  ténor: 'Ténor',
  basse: 'Basse',
  bass: 'Basse',
};

/**
 * Parse une partition chorale complète, écrite comme sur papier :
 *
 *   Titre
 *   Do dia G   4/4
 *   d : r ! m : d | …      ← Soprano
 *   s, : t, ! d : s, | …   ← Alto
 *   m : s ! s : m | …      ← Ténor
 *   d : s, ! d : d | …     ← Basse
 *   Pa - ro - les du sys - tè - me
 *   (système suivant…)
 *   2. Couplets en fin de partition
 *
 * Chaque groupe de 1 à 4 lignes de musique est un système (Soprano, Alto, Ténor, Basse dans cet ordre).
 * Une ligne seule est jouée en Soprano, sauf si elle est préfixée (« Ténor: … »).
 * On peut aussi préfixer les lignes : « Soprano: … », « Alto: … », « Ténor: … », « Basse: … ».
 * Les lignes de texte sous un système sont ses paroles ; « DC », « DS1 », « S1 »… sont des repères.
 */
export function parseChoralText(texte) {
  let key = 'C';
  let mesure = '4/4';
  let titre = null;
  const systemes = [];
  const couplets = [];
  let reperesEnAttente = [];
  let courant = null;
  let enCouplets = false;
  // Une ligne vide termine le système en cours (comme le blanc entre deux systèmes sur papier)
  let ligneVide = false;

  const nouveauSysteme = () => {
    courant = { lignes: [], paroles: [], reperes: reperesEnAttente };
    reperesEnAttente = [];
    ligneVide = false;
    systemes.push(courant);
  };
  const systemeTermine = () => !courant || ligneVide || courant.paroles.length > 0;

  const regexVoix = /^(soprano|alto|t[ée]nor|basse|bass)\s*:\s*(.*)$/i;

  texte.split('\n').map(normaliserLigne).forEach((ligne) => {
    if (!ligne) {
      if (courant?.lignes.length) ligneVide = true;
      return;
    }

    const keyLue = lireKey(ligne);
    if (keyLue) {
      key = keyLue;
      mesure = lireChiffrage(ligne) ?? mesure;
      return;
    }

    const matchVoix = ligne.match(regexVoix);
    if (matchVoix) {
      const nom = NOMS_CANONIQUES[matchVoix[1].toLowerCase()];
      if (systemeTermine() || courant.lignes.some((l) => l.voix === nom)) {
        nouveauSysteme();
      }
      courant.lignes.push({ voix: nom, texte: matchVoix[2] });
      return;
    }

    if (estLigneMusique(ligne)) {
      if (systemeTermine() || courant.lignes.length >= NOMS_VOIX.length) {
        nouveauSysteme();
      }
      courant.lignes.push({ voix: null, texte: ligne });
      return;
    }

    if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(ligne)) {
      mesure = lireChiffrage(ligne);
      return;
    }

    if (estRepere(ligne)) {
      reperesEnAttente.push(ligne.toUpperCase().replace(/\s+/g, ' '));
      return;
    }

    // « 2. », « 2- », « 3) » après la musique : début des couplets
    if (systemes.length > 0 && /^\d+\s*[-.)]\s*\S/.test(ligne)) enCouplets = true;

    if (enCouplets) couplets.push(ligne);
    else if (courant) courant.paroles.push(ligne);
    else if (!titre) titre = ligne;
  });

  if (systemes.length === 0) {
    throw new Error('Aucune ligne de musique trouvée. Chaque ligne de musique doit contenir des « : » entre les temps.');
  }

  const tempsForts = tempsAccentuesPour(mesure);
  const voix = Object.fromEntries(NOMS_VOIX.map((nom) => [nom, []]));
  const avertissements = [];

  // Les lignes sans nom prennent les voix restantes, dans l'ordre S, A, T, B
  systemes.forEach((systeme, indexSysteme) => {
    if (systeme.lignes.length > NOMS_VOIX.length) {
      throw new Error(`Système ${indexSysteme + 1} : ${systeme.lignes.length} lignes de musique, 4 au maximum.`);
    }
    const nomsLibres = NOMS_VOIX.filter((nom) => !systeme.lignes.some((l) => l.voix === nom));
    systeme.lignes.forEach((l) => {
      if (!l.voix) l.voix = nomsLibres.shift();
    });
  });

  // Voix présentes dans au moins un système (1 à 4 : une mélodie seule est acceptée)
  const nomsVoix = NOMS_VOIX.filter((nom) => systemes.some((s) => s.lignes.some((l) => l.voix === nom)));

  systemes.forEach((systeme, indexSysteme) => {
    const numero = indexSysteme + 1;
    systeme.voixPresentes = nomsVoix.filter((nom) => systeme.lignes.some((l) => l.voix === nom));

    systeme.mesures = {};
    systeme.notes = {};
    systeme.lignes.forEach(({ voix: nom, texte: ligne }) => {
      const mesures = lireLigne(ligne, `Système ${numero}, ${nom}`);
      systeme.mesures[nom] = mesures.map((m) => ({ texte: m.texte, nbTemps: m.temps.length }));
      systeme.notes[nom] = ajouterNotes([], mesures, tempsForts);
      ajouterNotes(voix[nom], mesures, tempsForts);
    });

    // Une voix absente de ce système (passage à l'unisson…) se tait pendant sa durée,
    // pour rester alignée avec les autres dans la suite du chant
    const nbTemps = Math.max(
      ...systeme.voixPresentes.map((nom) => systeme.mesures[nom].reduce((total, m) => total + m.nbTemps, 0))
    );
    nomsVoix
      .filter((nom) => !systeme.voixPresentes.includes(nom))
      .forEach((nom) => {
        const silence = { syllable: null, octaveShift: 0, beats: nbTemps, accent: false, isRest: true };
        systeme.notes[nom] = [{ ...silence }];
        voix[nom].push({ ...silence });
      });

    // Vérifie que les voix du système ont le même nombre de temps dans chaque mesure
    systeme.mesuresSuspectes = [];
    const nbMesures = Math.max(...systeme.voixPresentes.map((nom) => systeme.mesures[nom].length));
    for (let k = 0; k < nbMesures; k += 1) {
      const temps = systeme.voixPresentes.map((nom) => systeme.mesures[nom][k]?.nbTemps ?? 0);
      if (new Set(temps).size > 1) {
        systeme.mesuresSuspectes.push(k);
        const detail = systeme.voixPresentes.map((nom, v) => `${nom} ${temps[v]}`).join(', ');
        avertissements.push(`Système ${numero}, mesure ${k + 1} : les voix n'ont pas le même nombre de temps (${detail}).`);
      }
    }
    systeme.nbMesures = nbMesures;
    delete systeme.lignes;
  });

  const voixPresentes = Object.fromEntries(nomsVoix.map((nom) => [nom, voix[nom]]));

  return { titre, key, mesure, nomsVoix, systemes, voix: voixPresentes, couplets, avertissements };
}
