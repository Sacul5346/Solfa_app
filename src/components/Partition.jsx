import { useState } from 'react';
import { solfaToFrequency, OCTAVE_PAR_VOIX } from '../utils/notesDatabase';
import { playChoralSequences, playRhythmicSequence, renderVoicesToWav, stopAll } from '../utils/audioEngine';

// Classe CSS qui donne à chaque voix sa couleur (définie par le thème)
const CLASSE_VOIX = {
  Soprano: 'voice-soprano',
  Alto: 'voice-alto',
  Ténor: 'voice-tenor',
  Basse: 'voice-basse',
};

/**
 * Affiche une partition analysée (résultat de parseChoralText) et permet de l'écouter :
 * en entier, système par système, ou voix par voix.
 */
// Volumes des voix dans le fichier audio, selon la piste choisie
const VOLUMES = {
  choeur: { volume: 0.2, volumeAccent: 0.28 },
  principale: { volume: 0.3, volumeAccent: 0.4 },
  fond: { volume: 0.07, volumeAccent: 0.09 },
};

function nomDeFichier(titre, piste) {
  const base = titre?.replace(/[\\/:*?"<>|“”«»]/g, '').trim() || 'Partition';
  if (piste === 'choeur') return `${base} - Chœur.wav`;
  const [mode, nomVoix] = piste.split(':');
  return `${base} - ${nomVoix} ${mode === 'seule' ? 'seule' : 'mise en avant'}.wav`;
}

export default function Partition({ partition, tempo }) {
  const [piste, setPiste] = useState('choeur');
  const [preparation, setPreparation] = useState(false);
  const [erreurAudio, setErreurAudio] = useState(null);

  const frequenceVoix = (nomVoix) => (note) =>
    solfaToFrequency(note.syllable, partition.key, OCTAVE_PAR_VOIX[nomVoix], note.octaveShift);

  const jouerVoix = (notesParVoix) => {
    playChoralSequences(
      partition.nomsVoix.map((nomVoix) => ({ notes: notesParVoix[nomVoix], resolveFrequency: frequenceVoix(nomVoix) })),
      tempo
    );
  };

  const jouerUneVoix = (nomVoix) => {
    playRhythmicSequence(partition.voix[nomVoix], frequenceVoix(nomVoix), tempo);
  };

  // Calcule le fichier audio de la piste choisie, puis le télécharge
  const telechargerAudio = async () => {
    const [mode, voixChoisie] = piste.split(':');
    const voix = partition.nomsVoix.flatMap((nomVoix) => {
      const base = { notes: partition.voix[nomVoix], resolveFrequency: frequenceVoix(nomVoix) };
      if (mode === 'choeur') return [{ ...base, ...VOLUMES.choeur }];
      if (nomVoix === voixChoisie) return [{ ...base, ...VOLUMES.principale }];
      return mode === 'avant' ? [{ ...base, ...VOLUMES.fond }] : [];
    });

    setPreparation(true);
    setErreurAudio(null);
    try {
      const fichier = await renderVoicesToWav(voix, tempo);
      const url = URL.createObjectURL(fichier);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = nomDeFichier(partition.titre, piste);
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setErreurAudio('Le fichier audio n’a pas pu être créé. Réessaie, ou utilise un autre navigateur.');
    } finally {
      setPreparation(false);
    }
  };

  // Ouvre l'impression du navigateur, qui propose « Enregistrer au format PDF ».
  // Le titre de la page devient le nom de fichier proposé.
  const exporterPdf = () => {
    const titrePage = document.title;
    document.title = partition.titre?.replace(/["“”«»]/g, '').trim() || 'Partition solfa';
    window.addEventListener('afterprint', () => { document.title = titrePage; }, { once: true });
    window.print();
  };

  const nbMesures = partition.systemes.reduce((total, s) => total + s.nbMesures, 0);

  return (
    <>
      <div className="qcm-panel">
        <p className="selection-summary">
          Key {partition.key} · mesure {partition.mesure} · {partition.systemes.length}{' '}
          {partition.systemes.length > 1 ? 'systèmes' : 'système'} · {nbMesures} mesures
        </p>

        {partition.avertissements.length > 0 && (
          <ul className="avertissements">
            {partition.avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}

        <div className="lecture-actions">
          <button type="button" className="qcm-listen" onClick={() => jouerVoix(partition.voix)}>
            ▶ Écouter toute la partition
          </button>
          <button type="button" onClick={stopAll}>■ Stop</button>
          <button type="button" onClick={exporterPdf}>Exporter en PDF</button>
        </div>

        <div className="controls-row export-audio">
          <label>
            Fichier audio
            <select value={piste} onChange={(e) => setPiste(e.target.value)}>
              <option value="choeur">
                {partition.nomsVoix.length > 1 ? 'Chœur complet' : `Mélodie (${partition.nomsVoix[0]})`}
              </option>
              {partition.nomsVoix.length > 1 && (
                <>
                  <optgroup label="Une voix seule">
                    {partition.nomsVoix.map((nomVoix) => (
                      <option key={nomVoix} value={`seule:${nomVoix}`}>{nomVoix} seule</option>
                    ))}
                  </optgroup>
                  <optgroup label="Une voix mise en avant (piste de travail)">
                    {partition.nomsVoix.map((nomVoix) => (
                      <option key={nomVoix} value={`avant:${nomVoix}`}>{nomVoix} mise en avant</option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </label>
          <button type="button" onClick={telechargerAudio} disabled={preparation}>
            {preparation ? 'Préparation…' : 'Télécharger l’audio (WAV)'}
          </button>
        </div>
        {erreurAudio && <p className="qcm-feedback error">{erreurAudio}</p>}

        <ul className="voice-list">
          {partition.nomsVoix.map((nomVoix) => (
            <li key={nomVoix} className={`voice-list-item ${CLASSE_VOIX[nomVoix]}`}>
              <span className="voice-name">
                <span className="voice-tag" aria-hidden="true">{nomVoix[0]}</span>
                <span>
                  {nomVoix}{' '}
                  <span className="voice-octave">(octave {OCTAVE_PAR_VOIX[nomVoix]})</span>
                </span>
              </span>
              <button type="button" onClick={() => jouerUneVoix(nomVoix)}>
                ▶ Écouter seule
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="partition">
        {partition.titre && <h2 className="partition-titre">{partition.titre}</h2>}
        <p className="partition-infos">Do dia {partition.key} · {partition.mesure}</p>

        {partition.systemes.map((systeme, index) => (
          <section key={index} className="systeme" aria-label={`Système ${index + 1}`}>
            <div className="systeme-entete">
              <span className="systeme-numero">Système {index + 1}</span>
              {systeme.reperes.map((repere) => (
                <span key={repere} className="repere">{repere}</span>
              ))}
              <button type="button" className="systeme-jouer" onClick={() => jouerVoix(systeme.notes)}>
                ▶ Écouter
              </button>
            </div>

            <div className="systeme-defilement">
              <table className="portees">
                <tbody>
                  {systeme.voixPresentes.map((nomVoix) => (
                    <tr key={nomVoix} className={CLASSE_VOIX[nomVoix]}>
                      <th scope="row">
                        <span className="voice-tag" title={nomVoix}>{nomVoix[0]}</span>
                      </th>
                      {Array.from({ length: systeme.nbMesures }, (_, k) => (
                        <td
                          key={k}
                          className={systeme.mesuresSuspectes.includes(k) ? 'mesure suspecte' : 'mesure'}
                        >
                          {systeme.mesures[nomVoix][k]?.texte ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {systeme.paroles.length > 0 && (
              <div className="paroles">
                {systeme.paroles.map((ligne, k) => (
                  <p key={k}>{ligne}</p>
                ))}
              </div>
            )}
          </section>
        ))}

        {partition.couplets.length > 0 && (
          <div className="couplets">
            <p className="systeme-numero">Couplets</p>
            {partition.couplets.map((ligne, k) => (
              <p key={k}>{ligne}</p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
