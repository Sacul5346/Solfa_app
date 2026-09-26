// partitionStore.js
// État de la page Partition en mode « texte » (et le mode choisi), gardé hors de la page :
// le texte saisi et la partition analysée restent quand on change de mode ou d'onglet.
// Le mode « photo » a son propre état dans photoStore.js.

import { useSyncExternalStore } from 'react';
import { parseChoralText } from './solfaParser';

export const EXEMPLE = `Gloria
Do dia C   4/4

m    : m    ! f  : m  | r  : - ! m : - |
d    : d    ! d  : d  | t, : - ! d : - |
s    : s    ! l  : s  | s  : - ! s : - |
d    : d    ! f  : d  | s  : - ! d : - |
Al - le - lu - ia,  A - men

S1
s.,f   : m.r  ! d  : - | r  : - ! d : - |
m.,r   : d.t, ! l, : - | t, : - ! d : - |
d'.,d' : s.s  ! f  : - | s  : - ! m : - |
d.,d   : d.d  ! f  : - | s  : - ! d : - |
Glo - ri - a  in  ex - cel - sis

2. Al - le - lu - ia, chan - tons, A - men`;

let etat = {
  mode: 'texte', // 'texte' | 'photo'
  texte: EXEMPLE,
  tempo: 70,
  partition: null,
  erreur: null,
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

export function usePartitionStore() {
  return useSyncExternalStore(abonner, () => etat);
}

export function choisirMode(mode) {
  changer({ mode });
}

export function modifierTexte(texte) {
  changer({ texte });
}

export function modifierTempo(tempo) {
  changer({ tempo });
}

export function analyserTexte() {
  try {
    changer({ partition: parseChoralText(etat.texte), erreur: null });
  } catch (e) {
    changer({ partition: null, erreur: e.message });
  }
}
