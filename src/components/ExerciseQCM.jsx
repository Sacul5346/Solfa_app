import { useState } from 'react';
import { solfaToFrequency, KEYS_DISPONIBLES, OCTAVE_PAR_VOIX } from '../utils/notesDatabase';
import { playNote } from '../utils/audioEngine';

const SYLLABES_BASE = ['d', 'r', 'm', 'f', 's', 'l', 't'];

/**
 * Mélange un tableau et retourne les `count` premiers éléments.
 */
function tirerAuHasard(tableau, count) {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie.slice(0, count);
}

/**
 * Génère une nouvelle question : une syllabe correcte + 3 syllabes distractrices.
 */
function genererQuestion() {
  const bonneReponse = SYLLABES_BASE[Math.floor(Math.random() * SYLLABES_BASE.length)];
  const distracteurs = tirerAuHasard(
    SYLLABES_BASE.filter((s) => s !== bonneReponse),
    3
  );
  const choix = tirerAuHasard([bonneReponse, ...distracteurs], 4);
  return { bonneReponse, choix };
}

export default function ExerciseQCM() {
  const [musicKey, setMusicKey] = useState('C');
  const [voix, setVoix] = useState('Soprano');
  const octave = OCTAVE_PAR_VOIX[voix];

  const [question, setQuestion] = useState(genererQuestion);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'faux'
  const [reponseDonnee, setReponseDonnee] = useState(null);
  const [score, setScore] = useState({ bonnes: 0, total: 0 });

  const rejouerLaNote = () => {
    playNote(solfaToFrequency(question.bonneReponse, musicKey, octave));
  };

  const repondre = (syllabeChoisie) => {
    const estCorrect = syllabeChoisie === question.bonneReponse;
    setReponseDonnee(syllabeChoisie);
    setFeedback(estCorrect ? 'correct' : 'faux');
    setScore((prev) => ({
      bonnes: prev.bonnes + (estCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const questionSuivante = () => {
    setQuestion(genererQuestion());
    setFeedback(null);
    setReponseDonnee(null);
  };

  return (
    <div className="qcm-shell">
      <div className="qcm-header">
        <div>
          <p className="qcm-label">Défi en cours</p>
          <h2>Quelle syllabe as-tu entendue ?</h2>
        </div>
        <div className="qcm-score" aria-label={`Score : ${score.bonnes} bonnes réponses sur ${score.total}`}>
          <span className="qcm-score-value">{score.bonnes}</span>
          <span className="qcm-score-label">/ {score.total} justes</span>
        </div>
      </div>

      <div className="qcm-controls">
        <label>
          <span>Key</span>
          <select value={musicKey} onChange={(e) => setMusicKey(e.target.value)}>
            {KEYS_DISPONIBLES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Voix</span>
          <select value={voix} onChange={(e) => setVoix(e.target.value)}>
            {Object.keys(OCTAVE_PAR_VOIX).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <span className="qcm-context">Octave {octave}</span>
      </div>

      <div className="qcm-listening-zone">
        <div className="qcm-wave" aria-hidden="true">
          {[18, 34, 24, 46, 30, 54, 22, 42, 28, 38, 18].map((height, index) => (
            <span key={index} style={{ height: `${height}px` }} />
          ))}
        </div>
        <p>Prête ton oreille, puis choisis la syllabe.</p>
        <button type="button" className="qcm-listen-button" onClick={rejouerLaNote}>
          <span aria-hidden="true">▶</span> Écouter la note
        </button>
      </div>

      <div className="qcm-answer-section">
        <p className="qcm-section-label">Ta réponse</p>
        <div className="qcm-answer-grid">
        {question.choix.map((syllabe) => (
          <button
            key={syllabe}
            type="button"
            className={feedback !== null
              ? syllabe === question.bonneReponse
                ? 'qcm-answer correct'
                : syllabe === reponseDonnee
                  ? 'qcm-answer incorrect'
                  : 'qcm-answer muted'
              : 'qcm-answer'}
            onClick={() => repondre(syllabe)}
            disabled={feedback !== null}
          >
            {syllabe}
          </button>
        ))}
        </div>
      </div>

      {feedback === 'correct' && <p className="qcm-feedback success">Bonne réponse, bien entendu.</p>}
      {feedback === 'faux' && (
        <p className="qcm-feedback error">La bonne réponse était « {question.bonneReponse} ».</p>
      )}

      {feedback !== null && (
        <button type="button" className="qcm-next-button" onClick={questionSuivante}>Question suivante →</button>
      )}
    </div>
  );
}