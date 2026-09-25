// solfaParser.js
// Pilier 3.4 du cahier des charges — import de solfa écrit (texte)
// Transforme un texte au format solfa (Key + notation rythmique) en séquence exploitable

const TEMPS_ACCENTUES = {
  '4/4': [1],
  '3/4': [1],
  '6/8': [1, 4],
  '2/4': [1],
};

function tempsAccentuesPour(mesure) {
  return TEMPS_ACCENTUES[mesure] || [1];
}

function parseSequence(texteSequence, mesure) {
  const mesures = texteSequence.split('|').map((m) => m.trim()).filter(Boolean);
  const tempsForts = tempsAccentuesPour(mesure);
  const notes = [];

  mesures.forEach((mesureStr) => {
    const tokens = mesureStr.split(':').map((token) => token.trim());
    let position = 1;

    tokens.forEach((token) => {
      if (token === '-') {
        if (notes.length > 0) {
          notes[notes.length - 1].beats += 1;
        }
        position += 1;
        return;
      }

      if (token === '') {
        notes.push({
          syllable: null,
          octaveShift: 0,
          beats: 1,
          accent: false,
          isRest: true,
        });
        position += 1;
        return;
      }

      let syllable = token;
      let octaveShift = 0;

      if (syllable.endsWith("'")) {
        octaveShift = 1;
        syllable = syllable.slice(0, -1);
      } else if (syllable.startsWith(',')) {
        octaveShift = -1;
        syllable = syllable.slice(1);
      }

      notes.push({
        syllable,
        octaveShift,
        beats: 1,
        accent: tempsForts.includes(position),
        isRest: false,
      });
      position += 1;
    });
  });

  return notes;
}

/**
 * Parse un texte solfa complet.
 *
 * Format attendu :
 *   Key: G
 *   4/4
 *   | d : r : m : d | d : r : m : d | m : f : s : - |
 *
 * @returns {{ key: string, mesure: string, notes: {syllable: string, octaveShift: number, beats: number, accent: boolean}[] }}
 */
export function parseSolfaText(texte) {
  const lignes = texte
    .trim()
    .split('\n')
    .map((ligne) => ligne.trim())
    .filter(Boolean);

  let key = 'C';
  let mesure = '4/4';
  const lignesSequence = [];

  for (const ligne of lignes) {
    const matchKey = ligne.match(/^key\s*:?\s*([A-G](#|b)?)/i);
    if (matchKey) {
      key = matchKey[1];
      continue;
    }

    if (/^\d+\/\d+$/.test(ligne)) {
      mesure = ligne;
      continue;
    }

    lignesSequence.push(ligne);
  }

  return { key, mesure, notes: parseSequence(lignesSequence.join(' '), mesure) };
}

const NOMS_CANONIQUES = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Ténor',
  ténor: 'Ténor',
  basse: 'Basse',
};

export function parseChoralText(texte) {
  const lignes = texte
    .trim()
    .split('\n')
    .map((ligne) => ligne.trim())
    .filter(Boolean);

  let key = 'C';
  let mesure = '4/4';
  const voix = {};
  const regexVoix = /^(soprano|alto|t[ée]nor|basse)\s*:\s*(.+)$/i;

  for (const ligne of lignes) {
    const matchKey = ligne.match(/^key\s*:?\s*([A-G](#|b)?)$/i);
    if (matchKey) {
      key = matchKey[1];
      continue;
    }

    if (/^\d+\/\d+$/.test(ligne)) {
      mesure = ligne;
      continue;
    }

    const matchVoix = ligne.match(regexVoix);
    if (matchVoix) {
      const nom = matchVoix[1].toLowerCase();
      const nomCanonique = NOMS_CANONIQUES[nom] || NOMS_CANONIQUES[nom.replace('é', 'e')];
      voix[nomCanonique] = parseSequence(matchVoix[2], mesure);
    }
  }

  return { key, mesure, voix };
}