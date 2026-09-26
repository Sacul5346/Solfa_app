import { useEffect, useState } from 'react';
import { stopAll } from './utils/audioEngine';
import { choisirMode, usePartitionStore } from './utils/partitionStore';
import { usePhotoStore } from './utils/photoStore';
import { appliquerTheme, lireThemeEnregistre } from './utils/themes';
import ExercisePage from './pages/ExercisePage';
import PartitionPage from './pages/PartitionPage';
import ThemePage from './pages/ThemePage';
import VoicePage from './pages/VoicePage';
import WarmupPage from './pages/WarmupPage';

// Les onglets du menu, dans l'ordre. Le thème est un réglage : il a son bouton à part.
const PAGES = {
  partition: { label: 'Partition', component: PartitionPage },
  voice: { label: 'Chanter', component: VoicePage },
  exercise: { label: 'Oreille', component: ExercisePage },
  warmup: { label: 'Échauffement', component: WarmupPage },
  theme: { label: 'Thème', component: ThemePage, reglage: true },
};

function App() {
  const [pageId, setPageId] = useState('partition');
  const [theme, setTheme] = useState(lireThemeEnregistre);

  useEffect(() => {
    appliquerTheme(theme);
  }, [theme]);

  // Lecture d'image en cours ou terminée pendant qu'on regarde autre chose
  const photo = usePhotoStore();
  const { mode } = usePartitionStore();
  const surLaPhoto = pageId === 'partition' && mode === 'photo';
  const afficherBandeau = !surLaPhoto && (photo.lecture || photo.nouveauResultat);

  const allerA = (id) => {
    stopAll(); // on ne laisse pas jouer la page qu'on quitte
    setPageId(id);
  };

  const allerALaPhoto = () => {
    choisirMode('photo');
    allerA('partition');
  };

  const ActivePage = PAGES[pageId].component;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-kicker">Solfa studio</p>
          <p className="brand-name">Oreille &amp; voix</p>
        </div>

        <nav aria-label="Navigation principale" className="main-nav">
          {Object.entries(PAGES).map(([id, page]) => (
            <button
              type="button"
              key={id}
              className={`nav-button${page.reglage ? ' nav-reglage' : ''}${pageId === id ? ' active' : ''}`}
              aria-current={pageId === id ? 'page' : undefined}
              onClick={() => allerA(id)}
            >
              {page.reglage && <span aria-hidden="true">◐ </span>}
              {page.label}
            </button>
          ))}
        </nav>
      </header>

      {afficherBandeau && (
        <button
          type="button"
          className={photo.lecture ? 'bandeau-lecture en-cours' : 'bandeau-lecture'}
          onClick={allerALaPhoto}
          aria-live="polite"
        >
          {photo.lecture
            ? 'Lecture de la partition en cours… Tu peux continuer, elle se poursuit.'
            : photo.erreur
              ? 'La lecture de la partition a échoué. Voir le détail →'
              : 'Partition lue ✓ Voir la partition →'}
        </button>
      )}

      <main>
        <ActivePage theme={theme} onThemeChange={setTheme} />
      </main>
    </div>
  );
}

export default App;
