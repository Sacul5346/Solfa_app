import SaisiePhoto from '../components/SaisiePhoto';
import SaisieTexte from '../components/SaisieTexte';
import { choisirMode, usePartitionStore } from '../utils/partitionStore';

const MODES = [
  { id: 'texte', label: 'Coller le texte' },
  { id: 'photo', label: 'Importer une photo' },
];

export default function PartitionPage() {
  const { mode } = usePartitionStore();

  return (
    <section className="page-content">
      <p className="eyebrow">Chant choral</p>
      <h1>Partition</h1>

      <div className="choix-mode" role="group" aria-label="Comment ajouter la partition">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={mode === m.id ? 'actif' : undefined}
            aria-pressed={mode === m.id}
            onClick={() => choisirMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'texte' ? <SaisieTexte /> : <SaisiePhoto />}
    </section>
  );
}
