import { cle, ecrire, estAlteree, hauteur, nommer } from '../utils/oreille';

const LIBELLES_ETAT = { correct: 'bonne réponse', incorrect: 'ta réponse', depart: 'note de départ' };

/**
 * L'échelle verticale du tonic sol-fa (le « modulateur » de Curwen). Les notes sont espacées
 * selon leur vraie distance : les demi-tons (m-f, t-d') sont plus serrés que les tons,
 * et les notes altérées (fe, ta) sont sur le côté.
 *
 * @param {{ notes: object[], etats?: Object<string, 'correct'|'incorrect'|'depart'>, onChoisir: (note) => void }} props
 */
export default function Modulateur({ notes, etats = {}, onChoisir }) {
  const hauteurs = notes.map(hauteur);
  const haut = Math.max(...hauteurs);
  const bas = Math.min(...hauteurs);
  const avecAlterees = notes.some(estAlteree);

  return (
    <div
      className={avecAlterees ? 'modulateur avec-alterees' : 'modulateur'}
      style={{ gridTemplateRows: `repeat(${haut - bas + 1}, var(--pas-modulateur))` }}
      role="group"
      aria-label="Échelle des notes"
    >
      {notes.map((note) => {
        const etat = etats[cle(note)];
        const classes = ['modulateur-note', estAlteree(note) && 'alteree', note.syllable === 'd' && 'tonique', etat];
        return (
          <button
            key={cle(note)}
            type="button"
            className={classes.filter(Boolean).join(' ')}
            style={{ gridRow: haut - hauteur(note) + 1 }}
            onClick={(e) => {
              if (e.detail > 0) e.currentTarget.blur(); // garder les raccourcis clavier après un clic
              onChoisir(note);
            }}
            aria-label={`${ecrire(note)}, ${nommer(note)}${etat ? `, ${LIBELLES_ETAT[etat]}` : ''}`}
          >
            <span className="modulateur-solfa">{ecrire(note)}</span>
            <span className="modulateur-nom">{nommer(note)}</span>
          </button>
        );
      })}
    </div>
  );
}
