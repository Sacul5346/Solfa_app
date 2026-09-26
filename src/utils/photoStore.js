// photoStore.js
// État de la page Photo (image, lecture en cours, transcription), gardé hors de la page :
// la lecture continue et son résultat est conservé quand on navigue vers d'autres onglets.

import { useSyncExternalStore } from 'react';
import { parseChoralText } from './solfaParser';
import { preparerImage, transcrireImage } from './transcription';

let etat = {
  fichier: null,
  apercu: null,
  lecture: false,
  debutLecture: null,
  erreur: null,
  codeRequis: false,
  remarques: [],
  texte: null,
  partition: null,
  erreurAnalyse: null,
  tempo: 70,
  // Un résultat (ou une erreur) est arrivé pendant qu'on était sur un autre onglet
  nouveauResultat: false,
};

const abonnes = new Set();

function changer(maj) {
  etat = { ...etat, ...maj };
  abonnes.forEach((abonne) => abonne());
}

function abonner(abonne) {
  abonnes.add(abonne);
  return () => abonnes.delete(abonne);
}

export function usePhotoStore() {
  return useSyncExternalStore(abonner, () => etat);
}

function analyser(texte) {
  try {
    return { partition: parseChoralText(texte), erreurAnalyse: null };
  } catch (e) {
    return { partition: null, erreurAnalyse: e.message };
  }
}

// Demande confirmation avant de recharger ou fermer l'onglet pendant une lecture (déjà payée)
function avertirAvantDeQuitter(event) {
  event.preventDefault();
}

export function choisirImage(fichier) {
  if (etat.lecture) return;
  if (etat.apercu) URL.revokeObjectURL(etat.apercu);
  changer({
    fichier,
    apercu: URL.createObjectURL(fichier),
    erreur: null,
    codeRequis: false,
    remarques: [],
    texte: null,
    partition: null,
    erreurAnalyse: null,
    nouveauResultat: false,
  });
}

export async function lirePartition(codeAcces) {
  if (!etat.fichier || etat.lecture) return;

  changer({ lecture: true, debutLecture: Date.now(), erreur: null, codeRequis: false, remarques: [] });
  window.addEventListener('beforeunload', avertirAvantDeQuitter);

  try {
    const image = await preparerImage(etat.fichier);
    const resultat = await transcrireImage(image, codeAcces);
    changer({
      texte: resultat.partition,
      remarques: resultat.remarques || [],
      ...analyser(resultat.partition),
    });
  } catch (e) {
    changer({ erreur: e.message, remarques: e.remarques || [], codeRequis: Boolean(e.codeRequis) });
  } finally {
    window.removeEventListener('beforeunload', avertirAvantDeQuitter);
    changer({ lecture: false, debutLecture: null, nouveauResultat: true });
  }
}

export function modifierTexte(texte) {
  changer({ texte });
}

export function mettreAJourPartition() {
  changer(analyser(etat.texte));
}

export function modifierTempo(tempo) {
  changer({ tempo });
}

/** La page Photo est ouverte : le résultat a été vu. */
export function marquerResultatVu() {
  if (etat.nouveauResultat) changer({ nouveauResultat: false });
}
