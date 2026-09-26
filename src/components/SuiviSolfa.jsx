import { useEffect, useState } from 'react';

/**
 * Affiche en grand la note en train d'être jouée (« mi », avec « m » en petit),
 * et en mode écho les notes à chanter pendant le silence qui suit.
 *
 * @param {{ chronologie: object[], debut: number }} props - debut : performance.now() au lancement
 */
export default function SuiviSolfa({ chronologie, debut }) {
  const [ecoule, setEcoule] = useState(0);

  useEffect(() => {
    let image;
    const avancer = () => {
      setEcoule((performance.now() - debut) / 1000);
      image = requestAnimationFrame(avancer);
    };
    image = requestAnimationFrame(avancer);
    return () => cancelAnimationFrame(image);
  }, [debut]);

  const moment = chronologie.find((m) => ecoule >= m.debut && ecoule < m.fin);

  return (
    <div className="suivi-solfa" aria-live="off">
      {!moment && <p className="suivi-mode">…</p>}

      {moment?.mode === 'ecoute' && (
        <>
          <p className="suivi-mode">Écoute</p>
          <p className="suivi-note">{moment.note.nom}</p>
          <p className="suivi-solfa-texte">{moment.note.solfa}</p>
        </>
      )}

      {moment?.mode === 'chante' && (
        <>
          <p className="suivi-mode a-toi">À toi de chanter</p>
          <p className="suivi-note">{moment.notes.map((n) => n.nom).join(' – ')}</p>
          <p className="suivi-solfa-texte">{moment.notes.map((n) => n.solfa).join(' ')}</p>
        </>
      )}
    </div>
  );
}
