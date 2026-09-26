import { useEffect, useState } from 'react';
import { playNote, playSequence, stopAll } from '../utils/audioEngine';

// Signal sonore au début de chaque étape, pour pouvoir suivre les yeux fermés
const SIGNAUX = {
  inspire: () => playNote(660, 0.25),
  retiens: () => playNote(550, 0.25),
  expire: () => playNote(440, 0.25),
  tics: () => playSequence(Array(8).fill(880), 0.3), // un tic par souffle « ch »
};

/** Guide minuté d'un exercice de respiration : une étape après l'autre, avec son décompte. */
export default function GuideSouffle({ etapes }) {
  const [pas, setPas] = useState(null); // { index, restant } pendant l'exercice

  const enCours = pas !== null;
  const indexCourant = pas?.index ?? -1;

  // Décompte, seconde par seconde
  useEffect(() => {
    if (!enCours) return undefined;
    const minuteur = setInterval(() => {
      setPas((p) => {
        if (!p) return p;
        if (p.restant > 1) return { ...p, restant: p.restant - 1 };
        const suivant = p.index + 1;
        return suivant < etapes.length ? { index: suivant, restant: etapes[suivant].secondes } : null;
      });
    }, 1000);
    return () => clearInterval(minuteur);
  }, [enCours, etapes]);

  // Signal au début de chaque étape
  useEffect(() => {
    if (indexCourant >= 0) SIGNAUX[etapes[indexCourant].signal]?.();
  }, [indexCourant, etapes]);

  const commencer = () => setPas({ index: 0, restant: etapes[0].secondes });
  const arreter = () => {
    stopAll();
    setPas(null);
  };

  if (!enCours) {
    return (
      <button type="button" className="qcm-listen" onClick={commencer}>
        ▶ Commencer le guide
      </button>
    );
  }

  const etape = etapes[pas.index];
  return (
    <div className="guide-souffle" aria-live="polite">
      <p className="guide-etape">
        Étape {pas.index + 1} / {etapes.length}
      </p>
      <p className="guide-consigne">{etape.texte}</p>
      <p className="guide-decompte">{pas.restant}</p>
      <button type="button" onClick={arreter}>■ Arrêter</button>
    </div>
  );
}
