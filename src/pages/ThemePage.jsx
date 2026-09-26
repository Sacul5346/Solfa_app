import { THEMES } from '../utils/themes';

const VOIX_APERCU = [
  { lettre: 'S', classe: 'voice-soprano' },
  { lettre: 'A', classe: 'voice-alto' },
  { lettre: 'T', classe: 'voice-tenor' },
  { lettre: 'B', classe: 'voice-basse' },
];

export default function ThemePage({ theme, onThemeChange }) {
  return (
    <section className="page-content">
      <p className="eyebrow">Apparence</p>
      <h1>Choisir un thème</h1>
      <p className="page-intro">
        Le thème change les couleurs et les polices de toute l'application. Ton choix est gardé sur cet appareil.
      </p>

      <div className="theme-grid">
        {THEMES.map((t) => {
          const actif = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="theme-card"
              data-app-theme={t.id}
              aria-pressed={actif}
              onClick={() => onThemeChange(t.id)}
            >
              <span className="theme-card-head">
                <span className="theme-card-name">{t.nom}</span>
                {actif && <span className="theme-card-check">Actif</span>}
              </span>
              <span className="theme-card-body">
                <span className="theme-card-desc">{t.description}</span>
                <span className="theme-card-voices" aria-hidden="true">
                  {VOIX_APERCU.map((v) => (
                    <span key={v.lettre} className={`voice-tag ${v.classe}`}>{v.lettre}</span>
                  ))}
                  <span className="theme-card-solfa">d r m f s</span>
                </span>
                <span className="theme-card-button" aria-hidden="true">▶ Écouter</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
