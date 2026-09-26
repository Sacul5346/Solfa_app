import { useState } from 'react';
import { solfaToFrequency, frequencyToSolfa, KEYS_DISPONIBLES } from '../utils/notesDatabase';
import { playNoteWithReference } from '../utils/audioEngine';
import { recordAndDetectPitch, ecartEnCents } from '../utils/pitchDetector';

const SYLLABES_BASE = ['d', 'r', 'm', 'f', 's', 'l', 't'];

function tirerCibleAuHasard() {
  return SYLLABES_BASE[Math.floor(Math.random() * SYLLABES_BASE.length)];
}

export default function VoicePage() {
  const [key, setKey] = useState('C');
  const [octave, setOctave] = useState(4);
  const [cible, setCible] = useState(tirerCibleAuHasard);
  const [statut, setStatut] = useState('idle'); // idle | ecoute | resultat | erreur
  const [resultat, setResultat] = useState(null);

  const frequenceCible = solfaToFrequency(cible, key, octave);

  const ecouterCible = () => {
    playNoteWithReference(solfaToFrequency('d', key, octave), frequenceCible);
  };

  const chanter = async () => {
    setStatut('ecoute');
    setResultat(null);

    try {
      const frequenceChantee = await recordAndDetectPitch(1500);

      if (frequenceChantee === null) {
        setStatut('erreur');
        return;
      }

      const cents = ecartEnCents(frequenceChantee, frequenceCible);
      const identifie = frequencyToSolfa(frequenceChantee, key);

      setResultat({
        frequenceChantee,
        cents,
        syllabeIdentifiee: identifie.syllable,
      });
      setStatut('resultat');
    } catch {
      setStatut('erreur');
    }
  };

  const nouvelleCible = () => {
    setCible(tirerCibleAuHasard());
    setStatut('idle');
    setResultat(null);
  };

  const niveauJustesse = (cents) => {
    const ecart = Math.abs(cents);
    if (ecart < 25) return { label: 'Juste !', classe: 'success' };
    if (ecart < 60) return { label: 'Presque', classe: 'warning' };
    return { label: 'Pas encore', classe: 'error' };
  };

  return (
    <section className="page-content">
      <p className="eyebrow">Reconnaissance vocale</p>
      <h1>Chante la note</h1>
      <p className="page-intro">
        Écoute le do (d) puis la cible, et chante-la. L'application évalue ta justesse.
      </p>

      <div className="controls-row">
        <label>
          Key
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {KEYS_DISPONIBLES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label>
          Octave
          <select value={octave} onChange={(e) => setOctave(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="selection-summary">Cible : {cible} · Key {key} · octave {octave}</p>

      <button type="button" className="qcm-listen" onClick={ecouterCible}>
        Écouter do + la cible
      </button>

      <div className="qcm-panel">
        <button
          type="button"
          onClick={chanter}
          disabled={statut === 'ecoute'}
        >
          {statut === 'ecoute' ? '🎤 Écoute en cours…' : '🎤 Chanter'}
        </button>

        {statut === 'erreur' && (
          <p className="qcm-feedback error">
            Aucun son net détecté — vérifie l'accès au micro et réessaie.
          </p>
        )}

        {statut === 'resultat' && resultat && (
          <>
            <p className={`qcm-feedback ${niveauJustesse(resultat.cents).classe}`}>
              {niveauJustesse(resultat.cents).label} — écart de {resultat.cents.toFixed(0)} cents
              {' '}(tu as chanté environ "{resultat.syllabeIdentifiee}")
            </p>
            <button type="button" className="qcm-next" onClick={nouvelleCible}>
              Nouvelle cible →
            </button>
          </>
        )}
      </div>
    </section>
  );
}