import { useState } from 'react';
import { solfaToFrequency, OCTAVE_PAR_VOIX } from '../utils/notesDatabase';
import { playRhythmicSequence } from '../utils/audioEngine';
import { parseSolfaText } from '../utils/solfaParser';

const EXEMPLE = `Key: G
4/4
| d : r : m : d | d : r : m : d | m : f : s : - | m : f : s : - |`;

export default function ImportPage() {
  const [texte, setTexte] = useState(EXEMPLE);
  const [voix, setVoix] = useState('Soprano');
  const [tempo, setTempo] = useState(90);
  const [parseError, setParseError] = useState(null);
  const [sequenceParsee, setSequenceParsee] = useState(null);

  const octave = OCTAVE_PAR_VOIX[voix];

  const analyser = () => {
    try {
      const resultat = parseSolfaText(texte);
      if (resultat.notes.length === 0) {
        setParseError('Aucune note reconnue — vérifie la syntaxe.');
        setSequenceParsee(null);
        return;
      }
      setSequenceParsee(resultat);
      setParseError(null);
    } catch {
      setParseError('Erreur de lecture de la séquence.');
      setSequenceParsee(null);
    }
  };

  const jouer = () => {
    if (!sequenceParsee) return;
    playRhythmicSequence(
      sequenceParsee.notes,
      (note) => solfaToFrequency(note.syllable, sequenceParsee.key, octave, note.octaveShift),
      tempo
    );
  };

  return (
    <section className="page-content import-page">
      <p className="eyebrow">Import de solfa</p>
      <h1>Importer une séquence</h1>
      <p className="page-intro">
        Colle une séquence au format solfa (Key + notation rythmique), puis écoute-la.
      </p>

      <textarea
        className="solfa-input"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={4}
      />

      <div className="controls-row">
        <label>
          Voix
          <select value={voix} onChange={(e) => setVoix(e.target.value)}>
            {Object.keys(OCTAVE_PAR_VOIX).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

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

      <div className="qcm-panel">
        <button type="button" onClick={analyser}>Analyser la séquence</button>

        {parseError && <p className="qcm-feedback error">{parseError}</p>}

        {sequenceParsee && (
          <>
            <p className="selection-summary">
              Key {sequenceParsee.key} · mesure {sequenceParsee.mesure} · {sequenceParsee.notes.length} notes
            </p>

            <div className="solfa-preview" aria-label="Aperçu de la séquence">
              {sequenceParsee.notes.map((note, index) => (
                <span
                  key={`${note.syllable}-${index}`}
                  className={note.accent ? 'solfa-token accent' : 'solfa-token'}
                >
                  {note.syllable}
                </span>
              ))}
            </div>

            <button type="button" className="qcm-listen" onClick={jouer}>
              Écouter la séquence
            </button>
          </>
        )}
      </div>
    </section>
  );
}