import { useState } from 'react';
import ChoirPage from './pages/ChoirPage';
import ExercisePage from './pages/ExercisePage';
import ImportPage from './pages/ImportPage';
import NotesPage from './pages/NotesPage';
import SequencesPage from './pages/SequencesPage';
import VoicePage from './pages/VoicePage';

const PAGES = {
  notes: {
    label: 'Notes',
    component: NotesPage,
  },
  sequences: {
    label: 'Gammes',
    component: SequencesPage,
  },
  exercise: {
    label: 'Exercice QCM',
    component: ExercisePage,
  },
  import: { label: 'Importer', component: ImportPage },
  voice: { label: 'Chanter', component: VoicePage },
  choir: { label: 'Chœur', component: ChoirPage },
};

function App() {
  const [pageId, setPageId] = useState('notes');
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
              className={pageId === id ? 'nav-button active' : 'nav-button'}
              aria-current={pageId === id ? 'page' : undefined}
              onClick={() => setPageId(id)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <ActivePage />
      </main>
    </div>
  );
}

export default App;
