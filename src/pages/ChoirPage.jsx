import { useEffect, useRef, useState } from 'react';
import { solfaToFrequency, OCTAVE_PAR_VOIX } from '../utils/notesDatabase';
import { playChoralSequences, playRhythmicSequence } from '../utils/audioEngine';
import { parseChoralText } from '../utils/solfaParser';

const NOMS_VOIX = ['Soprano', 'Alto', 'Ténor', 'Basse'];

const EXEMPLE = `Key: C
4/4
Soprano: | s : - : - : - | d' : - : - : - | r' : - : - : - | s : - : - : - |
Alto:    | m : - : - : - | l : - : - : - | t : - : - : - | m : - : - : - |
Ténor:   | d : - : - : - | f : - : - : - | s : - : - : - | d : - : - : - |
Basse:   | d : - : - : - | f : - : - : - | s : - : - : - | d : - : - : - |`;

export default function ChoirPage() {
  const [texte, setTexte] = useState(EXEMPLE);
  const [tempo, setTempo] = useState(70);
  const [sequenceParsee, setSequenceParsee] = useState(null);
  const [erreur, setErreur] = useState(null);
  const texteRef = useRef(null);

  useEffect(() => {
    const textarea = texteRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [texte]);

  const analyser = () => {
    try {
      const resultat = parseChoralText(texte);
      const voixManquantes = NOMS_VOIX.filter((nom) => !resultat.voix[nom]);

      if (voixManquantes.length > 0) {
        setErreur(`Voix manquante(s) : ${voixManquantes.join(', ')}`);
        setSequenceParsee(null);
        return;
      }

      setSequenceParsee(resultat);
      setErreur(null);
    } catch {
      setErreur('Erreur de lecture du texte.');
      setSequenceParsee(null);
    }
  };

  const jouer = () => {
    if (!sequenceParsee) return;

    const voixAJouer = NOMS_VOIX.map((nomVoix) => ({
      notes: sequenceParsee.voix[nomVoix],
      resolveFrequency: (note) =>
        solfaToFrequency(note.syllable, sequenceParsee.key, OCTAVE_PAR_VOIX[nomVoix], note.octaveShift),
    }));

    playChoralSequences(voixAJouer, tempo);
  };

  const jouerUneVoix = (nomVoix) => {
    if (!sequenceParsee) return;

    playRhythmicSequence(
      sequenceParsee.voix[nomVoix],
      (note) =>
        solfaToFrequency(note.syllable, sequenceParsee.key, OCTAVE_PAR_VOIX[nomVoix], note.octaveShift),
      tempo
    );
  };

  return (
    <section className="page-content">
      <p className="eyebrow">Chant choral</p>
      <h1>4 voix, un accord</h1>
      <p className="page-intro">
        Une seule zone de texte : une ligne par voix (Soprano, Alto, Ténor, Basse), jouées ensemble.
      </p>

      <div className="choir-layout">
        <div className="choir-editor">
          <textarea
            ref={texteRef}
            className="solfa-input"
            rows={7}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />

          <div className="controls-row">
            <label>
              Tempo (BPM)
              <input
                type="number"
                min={40}
                max={200}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
              />
            </label>
          </div>

          <button type="button" className="choir-analyze" onClick={analyser}>
            Analyser les 4 voix
          </button>
        </div>

        <div className="qcm-panel">
          {erreur && <p className="qcm-feedback error">{erreur}</p>}

          {sequenceParsee && (
            <>
              <p className="selection-summary">
                4 voix prêtes · Key {sequenceParsee.key} · mesure {sequenceParsee.mesure}
              </p>
              <button type="button" className="qcm-listen" onClick={jouer}>
                Écouter l'accord
              </button>

              <ul className="voice-list">
                {NOMS_VOIX.map((nomVoix) => (
                  <li key={nomVoix} className="voice-list-item">
                    <span>
                      {nomVoix}{' '}
                      <span className="voice-octave">(octave {OCTAVE_PAR_VOIX[nomVoix]})</span>
                    </span>
                    <button type="button" onClick={() => jouerUneVoix(nomVoix)}>
                      ▶ Écouter seule
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
