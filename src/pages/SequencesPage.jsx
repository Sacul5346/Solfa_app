import { useState } from 'react';
import {
  KEYS_DISPONIBLES,
  OCTAVE_PAR_VOIX,
  solfaToFrequency,
} from '../utils/notesDatabase';
import { playNote, playSequence } from '../utils/audioEngine';

const GAMME_SYLLABES = ['d', 'r', 'm', 'f', 's', 'l', 't'];

export default function SequencesPage() {
  const [key, setKey] = useState('C');
  const [voix, setVoix] = useState('Soprano');
  const octave = OCTAVE_PAR_VOIX[voix];

  const gammeFrequences = [
    ...GAMME_SYLLABES.map((syllable) => solfaToFrequency(syllable, key, octave)),
    solfaToFrequency('d', key, octave, 1),
  ];

  const changerKey = (event) => {
    const nouvelleKey = event.target.value;
    setKey(nouvelleKey);
    playNote(solfaToFrequency('d', nouvelleKey, octave));
  };

  const changerVoix = (event) => {
    const nouvelleVoix = event.target.value;
    setVoix(nouvelleVoix);
    playNote(solfaToFrequency('d', key, OCTAVE_PAR_VOIX[nouvelleVoix]));
  };

  return (
    <section className="page-content">
      <p className="eyebrow">Entraînement mélodique</p>
      <h1>Gammes et séquences</h1>
      <p className="page-intro">Choisis une tonalité et une tessiture, puis écoute la gamme dans les deux sens.</p>

      <div className="controls-row">
        <label>
          Key des séquences
          <select value={key} onChange={changerKey}>
            {KEYS_DISPONIBLES.map((availableKey) => (
              <option key={availableKey} value={availableKey}>{availableKey}</option>
            ))}
          </select>
        </label>

        <label>
          Type de voix
          <select value={voix} onChange={changerVoix}>
            {Object.keys(OCTAVE_PAR_VOIX).map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="selection-summary">Key {key} · {voix} · octave {octave}</p>

      <div className="feature-list">
        <article className="feature-item">
          <div>
            <h2>Gamme montante</h2>
            <p>d r m f s l t d'</p>
          </div>
          <button type="button" onClick={() => playSequence(gammeFrequences)}>Écouter la gamme</button>
        </article>

        <article className="feature-item">
          <div>
            <h2>Gamme descendante</h2>
            <p>d' t l s f m r d</p>
          </div>
          <button type="button" onClick={() => playSequence([...gammeFrequences].reverse())}>Écouter la gamme descendante</button>
        </article>
      </div>
    </section>
  );
}
