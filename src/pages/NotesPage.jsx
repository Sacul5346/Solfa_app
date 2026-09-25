import { useState } from 'react';
import { solfaToFrequency, SOLFA_SEMITONES, KEYS_DISPONIBLES } from '../utils/notesDatabase';
import { playNote } from '../utils/audioEngine';

const SYLLABES = Object.keys(SOLFA_SEMITONES); // d di r ri m f fi s si l ta t
const OCTAVES = [2, 3, 4, 5, 6];

export default function NotesPage() {
  const [syllable, setSyllable] = useState('d');
  const [key, setKey] = useState('C');
  const [octave, setOctave] = useState(4);

  const frequency = solfaToFrequency(syllable, key, octave);

  return (
    <section className="page-content">
      <p className="eyebrow">Références audio</p>
      <h1>Explorateur de notes</h1>
      <p className="page-intro">
        Choisis une syllabe, une Key et une octave, puis écoute le résultat.
      </p>

      <div className="controls-row">
        <label>
          Syllabe
          <select value={syllable} onChange={(e) => setSyllable(e.target.value)}>
            {SYLLABES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

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
            {OCTAVES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="selection-summary">
        {syllable} · Key {key} · octave {octave} → {frequency.toFixed(2)} Hz
      </p>

      <button type="button" className="qcm-listen" onClick={() => playNote(frequency)}>
        Écouter
      </button>
    </section>
  );
}
