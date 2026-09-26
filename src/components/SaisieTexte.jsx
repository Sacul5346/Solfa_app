import { useEffect, useRef } from 'react';
import Partition from './Partition';
import { analyserTexte, modifierTempo, modifierTexte, usePartitionStore } from '../utils/partitionStore';

/** Mode « Coller le texte » de la page Partition. */
export default function SaisieTexte() {
  const { texte, tempo, partition, erreur } = usePartitionStore();
  const texteRef = useRef(null);

  // La zone de texte grandit avec son contenu (jusqu'à une hauteur maximale, puis elle défile)
  useEffect(() => {
    const textarea = texteRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  }, [texte]);

  return (
    <>
      <p className="page-intro">
        Colle la partition comme sur papier : la tonalité (<code>Do dia G</code> ou <code>Key: G</code>), puis pour
        chaque système ses lignes de musique (Soprano, Alto, Ténor, Basse, de haut en bas) et les paroles dessous.
      </p>

      <details className="aide-solfa">
        <summary>Aide sur l'écriture</summary>
        <ul>
          <li><code>|</code> barre de mesure, <code>!</code> demi-barre, <code>:</code> entre les temps</li>
          <li><code>d.r</code> demi-temps · <code>d.,r</code> pointé · <code>d.,d.d</code> quart + quart + demi · <code>-</code> prolonge · temps vide = silence</li>
          <li><code>d'</code> octave au-dessus · <code>s,</code> octave en dessous · <code>te</code>, <code>fe</code>… acceptés</li>
          <li>Une ligne vide sépare deux systèmes. Les lignes de texte sous un système sont ses paroles.</li>
          <li>Une mélodie seule est jouée en Soprano ; pour une autre voix, commence la ligne par <code>Ténor:</code>, <code>Alto:</code>…</li>
        </ul>
      </details>

      <div className="choir-layout">
        <div className="choir-editor">
          <textarea
            ref={texteRef}
            className="solfa-input"
            rows={12}
            wrap="off"
            spellCheck={false}
            aria-label="Partition solfa"
            value={texte}
            onChange={(e) => modifierTexte(e.target.value)}
          />

          <div className="controls-row">
            <label>
              Tempo (BPM)
              <input
                type="number"
                min={40}
                max={200}
                value={tempo}
                onChange={(e) => modifierTempo(Number(e.target.value))}
              />
            </label>
            <button type="button" className="choir-analyze" onClick={analyserTexte}>
              Analyser la partition
            </button>
          </div>
        </div>

        {erreur && <p className="qcm-feedback error">{erreur}</p>}
        {partition && <Partition partition={partition} tempo={tempo} />}
      </div>
    </>
  );
}
