import { useEffect, useRef, useState } from 'react';
import GuideSouffle from '../components/GuideSouffle';
import SuiviSolfa from '../components/SuiviSolfa';
import { stopAll } from '../utils/audioEngine';
import { DEPART_PAR_VOIX, jouerExercice } from '../utils/echauffement';
import { PHASES } from '../utils/exercicesVocaux';
import { KEYS_DISPONIBLES, demiTonsTonalite } from '../utils/notesDatabase';

const NOMS_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const CLASSE_VOIX = { Soprano: 'voice-soprano', Alto: 'voice-alto', Ténor: 'voice-tenor', Basse: 'voice-basse' };
const ETIQUETTES_TYPE = { souffle: 'Guidé', glissando: 'Glissando', choeur: '4 voix', canon: 'Canon', bourdon: 'Bourdon' };

function etiquetteType(exercice) {
  if (exercice.aleatoire) return 'Écho · surprise';
  if (exercice.echo) return 'Écho';
  return ETIQUETTES_TYPE[exercice.type];
}

// Instant présent, pour caler l'affichage des notes sur le son (appelé seulement au clic sur « Jouer »)
const maintenant = () => performance.now();

/** Nom de la note (ex. « Eb4 ») du do de la tonalité, monté de `demiTons`. */
function nomDuDo(key, octave, demiTons = 0) {
  const position = demiTonsTonalite(key) + demiTons;
  return `${NOMS_NOTES[position % 12]}${octave + Math.floor(position / 12)}`;
}

export default function WarmupPage() {
  const [voix, setVoix] = useState('Soprano');
  const [key, setKey] = useState(DEPART_PAR_VOIX.Soprano.key);
  const [tempo, setTempo] = useState(80);
  const [repetitions, setRepetitions] = useState(4);
  const [donnerDo, setDonnerDo] = useState(true);
  const [phaseId, setPhaseId] = useState(PHASES[0].id);
  const [enCours, setEnCours] = useState(null); // { id, debut, chronologie } de l'exercice qui joue
  const finRef = useRef(null);

  const octave = DEPART_PAR_VOIX[voix].octave;
  const phase = PHASES.find((p) => p.id === phaseId);

  useEffect(() => () => clearTimeout(finRef.current), []);

  const changerVoix = (nouvelle) => {
    setVoix(nouvelle);
    setKey(DEPART_PAR_VOIX[nouvelle].key);
  };

  const jouer = (exercice) => {
    clearTimeout(finRef.current);
    const { duree, chronologie } = jouerExercice(exercice, { key, octave, tempo, repetitions, donnerDo });
    setEnCours({ id: exercice.id, debut: maintenant(), chronologie });
    finRef.current = setTimeout(() => setEnCours(null), duree * 1000 + 300);
  };

  const arreter = () => {
    clearTimeout(finRef.current);
    stopAll();
    setEnCours(null);
  };

  return (
    <section className="page-content">
      <p className="eyebrow">Échauffement</p>
      <h1>Échauffement de chorale</h1>
      <p className="page-intro">
        Une séance se fait dans l’ordre : le corps, le souffle, la résonance, les vocalises, puis l’ensemble.
        Comptez 10 à 15 minutes. Les exercices chantés montent d’un demi-ton à chaque répétition.
      </p>

      <div className="reglages-echauffement">
        <div className="controls-row">
          <label>
            Voix
            <select value={voix} onChange={(e) => changerVoix(e.target.value)}>
              {Object.keys(DEPART_PAR_VOIX).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Tonalité de départ
            <select value={key} onChange={(e) => setKey(e.target.value)}>
              {KEYS_DISPONIBLES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Tempo (BPM)
            <input type="number" min={40} max={160} value={tempo} onChange={(e) => setTempo(Number(e.target.value) || 80)} />
          </label>
          <label>
            Répétitions
            <select value={repetitions} onChange={(e) => setRepetitions(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>{n === 1 ? '1 (sans monter)' : n}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="case-a-cocher">
          <input type="checkbox" checked={donnerDo} onChange={(e) => setDonnerDo(e.target.checked)} />
          Faire entendre le do avant chaque répétition
        </label>
        <p className="selection-summary">
          Départ : do = {nomDuDo(key, octave)}
          {repetitions > 1 && ` · monte jusqu’à ${nomDuDo(key, octave, repetitions - 1)}`}
        </p>
      </div>

      <div className="etapes-echauffement" role="tablist" aria-label="Étapes de l’échauffement">
        {PHASES.map((p, index) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === phaseId}
            className={p.id === phaseId ? 'actif' : undefined}
            onClick={() => setPhaseId(p.id)}
          >
            <span className="etape-numero">{index + 1}</span> {p.titre}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={phase.titre}>
        <p className="phase-resume">
          {phase.resume} <span className="phase-duree">{phase.duree}</span>
        </p>

        <div className="liste-exercices">
          {phase.exercices.map((exercice) => {
            const joue = enCours?.id === exercice.id;
            return (
            <article key={exercice.id} className={joue ? 'exercice joue' : 'exercice'}>
              <div className="exercice-entete">
                <h2>{exercice.titre}</h2>
                {etiquetteType(exercice) && <span className="exercice-type">{etiquetteType(exercice)}</span>}
              </div>

              {exercice.type === 'consigne' ? (
                <ol className="exercice-etapes">
                  {exercice.etapes.map((etape) => (
                    <li key={etape}>{etape}</li>
                  ))}
                </ol>
              ) : (
                <p className="exercice-comment">{exercice.comment}</p>
              )}
              <p className="exercice-but">Pourquoi : {exercice.but}</p>

              {exercice.motif && exercice.type !== 'choeur' && (
                <p className="exercice-motif">{exercice.motif}</p>
              )}
              {exercice.type === 'glissando' && (
                <p className="exercice-motif">Glissando continu : {exercice.points.join('  →  ')}</p>
              )}
              {exercice.type === 'choeur' && (
                <div className="exercice-voix">
                  {Object.entries(exercice.voix).map(([nom, ligne]) => (
                    <p key={nom} className={`exercice-motif ${CLASSE_VOIX[nom]}`}>
                      <span className="voice-tag" title={nom}>{nom[0]}</span> {ligne}
                    </p>
                  ))}
                </div>
              )}

              {exercice.type === 'souffle' && <GuideSouffle etapes={exercice.etapes} />}
              {exercice.type !== 'souffle' && exercice.type !== 'consigne' && (
                <div className="lecture-actions">
                  <button type="button" className="qcm-listen" onClick={() => jouer(exercice)}>
                    {joue ? '▶ Rejouer' : '▶ Jouer'}
                  </button>
                  {joue && <button type="button" onClick={arreter}>■ Stop</button>}
                </div>
              )}

              {joue && enCours.chronologie.length > 0 && (
                <SuiviSolfa key={enCours.debut} chronologie={enCours.chronologie} debut={enCours.debut} />
              )}
            </article>
            );
          })}
        </div>
      </div>

      <p className="sources">
        Exercices rassemblés d’après{' '}
        <a href="https://ressourceschorales.fr/blog/echauffement-vocal-chorale" target="_blank" rel="noreferrer">Ressources Chorales</a>,{' '}
        <a href="https://www.choirmate.com/blog/choir-warm-ups" target="_blank" rel="noreferrer">ChoirMate</a> et{' '}
        <a href="https://www.lacordevocale.org/blog/comment-echauffer-voix-9.html" target="_blank" rel="noreferrer">La Corde Vocale</a>.
      </p>
    </section>
  );
}
