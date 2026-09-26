import { useEffect, useState } from 'react';
import Modulateur from '../components/Modulateur';
import { stopAll } from '../utils/audioEngine';
import { DEPART_PAR_VOIX } from '../utils/echauffement';
import { KEYS_DISPONIBLES, demiTonsTonalite } from '../utils/notesDatabase';
import {
  ACCORDS,
  MODES,
  NIVEAUX_ACCORDS,
  NIVEAUX_NOTES,
  cle,
  ecrire,
  jouerAccord,
  jouerComparaison,
  jouerNote,
  jouerQuestion,
  niveauxDuMode,
  nomIntervalle,
  nommer,
  nouvelleQuestion,
} from '../utils/oreille';

const NOMS_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
// Séparateur visible : « s, t, r » se lirait comme une liste à virgules
const suite = (notes) => notes.map(ecrire).join(' · ');
const TOUCHES_NOTES = ['d', 'r', 'm', 'f', 's', 'l', 't'];
const GENRES = {
  majeur: { titre: 'Majeur', detail: 'clair, lumineux', exemple: 'I' },
  mineur: { titre: 'Mineur', detail: 'plus sombre', exemple: 'vi' },
};

// --- Scores, gardés d'une séance à l'autre dans ce navigateur ---

const CLE_SCORES = 'solfa-oreille-scores';
const SCORE_VIDE = { bonnes: 0, total: 0, serie: 0, recents: [] };

function lireScores() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SCORES)) || {};
  } catch {
    return {};
  }
}

function ecrireScores(scores) {
  try {
    localStorage.setItem(CLE_SCORES, JSON.stringify(scores));
  } catch {
    // Stockage indisponible (navigation privée…) : le score reste valable pour la séance
  }
}

// --- Tonalité ---

/** Octave du do : la plus proche du do conseillé pour la voix, pour rester dans sa tessiture. */
function octaveDuDo(key, voix) {
  const depart = DEPART_PAR_VOIX[voix];
  const ecart = demiTonsTonalite(key) - demiTonsTonalite(depart.key);
  return depart.octave + (ecart > 6 ? -1 : ecart < -6 ? 1 : 0);
}

function creerQuestion(mode, niveau, tonalite, precedente) {
  const key =
    tonalite === 'hasard' ? KEYS_DISPONIBLES[Math.floor(Math.random() * KEYS_DISPONIBLES.length)] : tonalite;
  return { ...nouvelleQuestion(mode, niveau, precedente), key };
}

// Après un clic de souris, on rend le focus à la page pour que les raccourcis clavier continuent de marcher
const relacher = (e) => {
  if (e.detail > 0) e.currentTarget.blur();
};

const NIVEAUX_DEPART = { note: 0, intervalle: 0, dictee: 0, accord: 0 };

export default function ExercisePage() {
  const [mode, setMode] = useState('note');
  const [niveaux, setNiveaux] = useState(NIVEAUX_DEPART);
  const [voix, setVoix] = useState('Soprano');
  const [tonalite, setTonalite] = useState(DEPART_PAR_VOIX.Soprano.key);
  const [question, setQuestion] = useState(() => creerQuestion('note', 0, DEPART_PAR_VOIX.Soprano.key));
  const [choix, setChoix] = useState([]); // notes (ou clé d'accord) données, dans l'ordre
  const [scores, setScores] = useState(lireScores);

  const niveau = niveaux[mode];
  const niveauxMode = niveauxDuMode(mode);
  const modeActuel = MODES.find((m) => m.id === mode);
  const octave = octaveDuDo(question.key, voix);
  const fini = choix.length === question.reponse.length;
  const clesDonnees = choix.map((x) => (typeof x === 'string' ? x : cle(x)));
  const juste = fini && clesDonnees.every((c, i) => c === question.reponse[i]);

  const cleScore = `${mode}-${niveau}`;
  const score = scores[cleScore] ?? SCORE_VIDE;
  const reussitesRecentes = score.recents.filter(Boolean).length;
  const conseilNiveau = score.recents.length >= 10 && reussitesRecentes >= 8 && niveau < niveauxMode.length - 1;

  // --- Actions ---

  const recommencer = (nouveauMode, nouveauNiveau, nouvelleTonalite = tonalite) => {
    stopAll();
    setQuestion(creerQuestion(nouveauMode, nouveauNiveau, nouvelleTonalite));
    setChoix([]);
  };

  const changerMode = (id) => {
    setMode(id);
    recommencer(id, niveaux[id]);
  };

  const changerNiveau = (valeur) => {
    setNiveaux({ ...niveaux, [mode]: valeur });
    recommencer(mode, valeur);
  };

  const changerVoix = (nouvelle) => {
    setVoix(nouvelle);
    if (tonalite !== 'hasard') {
      setTonalite(DEPART_PAR_VOIX[nouvelle].key);
      recommencer(mode, niveau, DEPART_PAR_VOIX[nouvelle].key);
    }
  };

  const changerTonalite = (valeur) => {
    setTonalite(valeur);
    recommencer(mode, niveau, valeur);
  };

  const ecouter = () => jouerQuestion(question, question.key, octave);

  const suivante = () => {
    const q = creerQuestion(mode, niveau, tonalite, question);
    setQuestion(q);
    setChoix([]);
    jouerQuestion(q, q.key, octaveDuDo(q.key, voix));
  };

  const enregistrer = (reponses) => {
    const bonne = reponses.every((x, i) => (typeof x === 'string' ? x : cle(x)) === question.reponse[i]);
    const nouveau = {
      bonnes: score.bonnes + (bonne ? 1 : 0),
      total: score.total + 1,
      serie: bonne ? score.serie + 1 : 0,
      recents: [...score.recents, bonne].slice(-10),
    };
    const tous = { ...scores, [cleScore]: nouveau };
    setScores(tous);
    ecrireScores(tous);
  };

  const repondre = (element) => {
    const reponses = [...choix, element];
    setChoix(reponses);
    if (reponses.length === question.reponse.length) enregistrer(reponses);
  };

  const choisirNote = (note) => {
    // Une fois la question finie, l'échelle sert à écouter les notes
    if (fini || mode === 'dictee') jouerNote(note, question.key, octave);
    if (!fini) repondre(note);
  };

  const choisirAccord = (id) => {
    if (fini) {
      jouerAccord(ACCORDS[id] ? id : GENRES[id].exemple, question.key, octave);
      return;
    }
    repondre(id);
  };

  const effacer = () => setChoix(choix.slice(0, -1));

  const comparer = () => {
    const donnee = mode === 'dictee' ? choix : choix[0];
    jouerComparaison(question, donnee, question.key, octave);
  };

  const remettreAZero = () => {
    const tous = { ...scores, [cleScore]: SCORE_VIDE };
    setScores(tous);
    ecrireScores(tous);
  };

  // Raccourcis clavier : d r m f s l t pour répondre, Espace pour réécouter, Entrée pour continuer
  useEffect(() => {
    const auClavier = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest?.('input, select, textarea')) return;
      // Sur un bouton choisi au clavier, Espace et Entrée gardent leur rôle habituel
      const surBouton = Boolean(e.target.closest?.('button, a'));

      if (e.key === ' ' && !surBouton) {
        e.preventDefault();
        ecouter();
      } else if (e.key === 'Enter' && fini && !surBouton) {
        suivante();
      } else if (e.key === 'Backspace' && mode === 'dictee' && !fini) {
        effacer();
      } else if (mode === 'accord') {
        const reponses = NIVEAUX_ACCORDS[niveau].reponses;
        const index = Number(e.key) - 1;
        if (index >= 0 && index < reponses.length) choisirAccord(reponses[index]);
      } else if (TOUCHES_NOTES.includes(e.key.toLowerCase())) {
        const note = NIVEAUX_NOTES[niveau].notes.find((x) => x.syllable === e.key.toLowerCase() && x.octaveShift === 0);
        if (note) choisirNote(note);
      }
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  });

  // --- Affichage ---

  const etatsModulateur = {};
  if (mode === 'intervalle') etatsModulateur[cle(question.depart)] = 'depart';
  if (fini && (mode === 'note' || mode === 'intervalle')) {
    if (!juste) etatsModulateur[clesDonnees[0]] = 'incorrect';
    etatsModulateur[question.reponse[0]] = 'correct';
  }

  const nomDuDo = `${NOMS_NOTES[demiTonsTonalite(question.key)]}${octave}`;

  return (
    <section className="page-content">
      <p className="eyebrow">Oreille musicale</p>
      <h1>Entraînement de l’oreille</h1>
      <p className="page-intro">
        Reconnaître les notes par rapport au do, c’est ce qui permet de lire une partition en solfa sans instrument.
        Commencez au niveau 1 et montez quand vous réussissez 8 questions sur 10.
      </p>

      <div className="etapes-echauffement" role="tablist" aria-label="Type d’exercice">
        {MODES.map((m, index) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={m.id === mode}
            className={m.id === mode ? 'actif' : undefined}
            onClick={() => changerMode(m.id)}
          >
            <span className="etape-numero">{index + 1}</span> {m.titre}
          </button>
        ))}
      </div>

      <div className="reglages-echauffement">
        <div className="controls-row">
          <label>
            Niveau
            <select value={niveau} onChange={(e) => changerNiveau(Number(e.target.value))}>
              {niveauxMode.map((n, index) => (
                <option key={n.titre} value={index}>{index + 1}. {n.titre}</option>
              ))}
            </select>
          </label>
          <label>
            Voix
            <select value={voix} onChange={(e) => changerVoix(e.target.value)}>
              {Object.keys(DEPART_PAR_VOIX).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Tonalité
            <select value={tonalite} onChange={(e) => changerTonalite(e.target.value)}>
              <option value="hasard">Au hasard</option>
              {KEYS_DISPONIBLES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="selection-summary">
          Do = {nomDuDo}
          {tonalite === 'hasard' && ' (nouvelle tonalité à chaque question)'}
        </p>
      </div>

      <div className="oreille-score" aria-live="polite">
        <span>
          <strong>{score.bonnes}</strong> / {score.total} justes
        </span>
        {score.serie >= 2 && <span>Série : <strong>{score.serie}</strong></span>}
        {score.recents.length >= 5 && (
          <span>{reussitesRecentes} sur les {score.recents.length} dernières</span>
        )}
        {score.total > 0 && (
          <button type="button" className="lien-discret" onClick={remettreAZero}>Remettre à zéro</button>
        )}
      </div>
      {conseilNiveau && (
        <p className="oreille-conseil">
          Très bien : {reussitesRecentes} bonnes réponses sur les 10 dernières.{' '}
          <button type="button" className="lien-discret" onClick={() => changerNiveau(niveau + 1)}>
            Passer au niveau {niveau + 2} →
          </button>
        </p>
      )}

      <div className="oreille-jeu">
        <div className="oreille-panneau">
          <p className="oreille-consigne">{modeActuel.consigne}</p>
          <button type="button" className="qcm-listen" onClick={(e) => { relacher(e); ecouter(); }}>
            ▶ {mode === 'intervalle' ? 'Écouter les deux notes' : 'Écouter'}
          </button>

          <Enonce question={question} choix={choix} fini={fini} />

          {fini && (
            <div className="oreille-resultat">
              <p className={juste ? 'qcm-feedback success' : 'qcm-feedback error'}>
                {juste ? 'Juste !' : 'Pas tout à fait.'} <Explication question={question} />
                {!juste && <TaReponse question={question} choix={choix} />}
              </p>
              <div className="lecture-actions">
                {!juste && (
                  <button type="button" onClick={(e) => { relacher(e); comparer(); }}>
                    ▶ Comparer : la bonne réponse, puis la tienne
                  </button>
                )}
                <button type="button" className="qcm-listen" onClick={suivante}>Question suivante →</button>
              </div>
            </div>
          )}

          {mode === 'dictee' && !fini && choix.length > 0 && (
            <button type="button" className="lien-discret" onClick={effacer}>Effacer la dernière note</button>
          )}

          <p className="oreille-aide">
            {mode === 'accord'
              ? 'Clavier : 1, 2, 3… pour répondre · Espace pour réécouter · Entrée pour continuer.'
              : 'Clavier : d r m f s l t pour répondre · Espace pour réécouter · Entrée pour continuer.'}
            {fini && ' Clique sur une réponse pour l’entendre.'}
          </p>
        </div>

        <div className="oreille-reponses">
          {mode === 'accord' ? (
            <ChoixAccords niveau={niveau} question={question} choix={choix} fini={fini} onChoisir={choisirAccord} />
          ) : (
            <Modulateur notes={NIVEAUX_NOTES[niveau].notes} etats={etatsModulateur} onChoisir={choisirNote} />
          )}
        </div>
      </div>
    </section>
  );
}

/** Ce qui est demandé, et ce qui a déjà été répondu. */
function Enonce({ question, choix, fini }) {
  if (question.mode === 'intervalle') {
    return (
      <p className="oreille-enonce">
        <span className="oreille-note">{ecrire(question.depart)}</span>
        <span aria-hidden="true">→</span>
        <span className="oreille-note">{fini ? ecrire(question.cible) : '?'}</span>
      </p>
    );
  }

  if (question.mode === 'dictee') {
    return (
      <ol className="oreille-dictee" aria-label="Tes notes">
        {question.cibles.map((cible, i) => {
          const donnee = choix[i];
          const etat = fini ? (cle(donnee) === cle(cible) ? 'correct' : 'incorrect') : donnee ? 'rempli' : '';
          return (
            <li key={i} className={etat}>
              <span className="oreille-note">{donnee ? ecrire(donnee) : ''}</span>
              {fini && etat === 'incorrect' && <span className="oreille-attendu">{ecrire(cible)}</span>}
            </li>
          );
        })}
      </ol>
    );
  }

  if (question.mode === 'note') {
    return (
      <p className="oreille-enonce">
        <span className="oreille-note">{fini ? ecrire(question.cible) : '?'}</span>
      </p>
    );
  }

  return null;
}

/** La réponse attendue, en clair. */
function Explication({ question }) {
  if (question.mode === 'note') {
    return <>C’était {ecrire(question.cible)} ({nommer(question.cible)}).</>;
  }
  if (question.mode === 'intervalle') {
    return (
      <>
        {ecrire(question.depart)} → {ecrire(question.cible)} : {nomIntervalle(question.depart, question.cible)}.
      </>
    );
  }
  if (question.mode === 'dictee') {
    return <>La mélodie était {suite(question.cibles)}.</>;
  }
  const accord = ACCORDS[question.accord];
  return (
    <>
      C’était l’accord {question.accord} ({suite(accord.notes)}), {accord.genre}.
    </>
  );
}

/** Après une erreur : ce qui a été répondu (pour la note et l'intervalle). */
function TaReponse({ question, choix }) {
  const [donnee] = choix;
  if (question.mode === 'note') {
    return <span className="oreille-ta-reponse">Tu as répondu {ecrire(donnee)} ({nommer(donnee)}).</span>;
  }
  if (question.mode === 'intervalle') {
    return (
      <span className="oreille-ta-reponse">
        Tu as répondu {ecrire(donnee)} : {nomIntervalle(question.depart, donnee)}.
      </span>
    );
  }
  return null;
}

function ChoixAccords({ niveau, question, choix, fini, onChoisir }) {
  return (
    <div className="oreille-accords" role="group" aria-label="Réponses">
      {NIVEAUX_ACCORDS[niveau].reponses.map((id, index) => {
        let etat = '';
        if (fini && id === question.reponse[0]) etat = 'correct';
        else if (fini && id === choix[0]) etat = 'incorrect';
        const genre = GENRES[id];
        return (
          <button key={id} type="button" className={`oreille-accord ${etat}`}
            onClick={(e) => {
              relacher(e);
              onChoisir(id);
            }}
          >
            <span className="oreille-accord-touche" aria-hidden="true">{index + 1}</span>
            <span className="oreille-accord-nom">{genre ? genre.titre : id}</span>
            <span className="oreille-accord-detail">
              {genre ? genre.detail : suite(ACCORDS[id].notes)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
