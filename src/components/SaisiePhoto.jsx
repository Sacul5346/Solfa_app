import { useEffect, useState } from 'react';
import Partition from './Partition';
import { enregistrerCodeAcces, lireCodeAcces } from '../utils/transcription';
import {
  choisirImage,
  lirePartition,
  marquerResultatVu,
  mettreAJourPartition,
  modifierTempo,
  modifierTexte,
  usePhotoStore,
} from '../utils/photoStore';

function formaterDuree(ms) {
  const secondes = Math.floor(ms / 1000);
  const minutes = Math.floor(secondes / 60);
  return minutes > 0 ? `${minutes} min ${String(secondes % 60).padStart(2, '0')} s` : `${secondes} s`;
}

/** Mode « Importer une photo » de la page Partition. La lecture continue si on change d'onglet. */
export default function SaisiePhoto() {
  const photo = usePhotoStore();
  const [agrandie, setAgrandie] = useState(false);
  const [codeAcces, setCodeAcces] = useState(lireCodeAcces);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  // On est sur la page : le résultat éventuel est vu, le bandeau des autres onglets disparaît
  useEffect(() => {
    marquerResultatVu();
  }, [photo.nouveauResultat]);

  // Chronomètre pendant la lecture
  useEffect(() => {
    if (!photo.lecture) return undefined;
    const minuteur = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuteur);
  }, [photo.lecture]);

  const afficherCode = photo.codeRequis || codeAcces !== '';

  const choisirFichier = (event) => {
    const choisi = event.target.files?.[0];
    if (!choisi) return;
    setAgrandie(false);
    choisirImage(choisi);
  };

  return (
    <>
      <p className="page-intro">
        Prends en photo ou scanne une partition solfa. L'application la lit, l'affiche sous forme de partition,
        et tu peux l'écouter. Pendant la lecture, tu peux utiliser les autres onglets.
      </p>

      <div className="photo-import">
        <label className={photo.lecture ? 'photo-choisir desactive' : 'photo-choisir'}>
          <input type="file" accept="image/*" onChange={choisirFichier} disabled={photo.lecture} />
          <span>{photo.fichier ? 'Choisir une autre image' : 'Choisir une image'}</span>
        </label>

        {photo.apercu && (
          <figure className={agrandie ? 'photo-apercu agrandie' : 'photo-apercu'}>
            <div className="photo-cadre">
              <img src={photo.apercu} alt="Partition importée" />
            </div>
            <figcaption>
              <span>{photo.fichier.name}</span>
              <button type="button" onClick={() => setAgrandie((v) => !v)}>
                {agrandie ? 'Ajuster à la largeur' : 'Taille réelle'}
              </button>
            </figcaption>
          </figure>
        )}

        {afficherCode && (
          <div className="controls-row">
            <label>
              Code d'accès de la chorale
              <input
                type="password"
                value={codeAcces}
                onChange={(e) => {
                  setCodeAcces(e.target.value);
                  enregistrerCodeAcces(e.target.value);
                }}
              />
            </label>
          </div>
        )}

        {photo.fichier && (
          <div className="lecture-actions">
            <button
              type="button"
              className="qcm-listen"
              onClick={() => lirePartition(codeAcces)}
              disabled={photo.lecture}
            >
              {photo.lecture ? 'Lecture de la partition…' : photo.texte === null ? 'Lire la partition' : 'Relire l’image'}
            </button>
          </div>
        )}

        {photo.lecture && (
          <p className="page-intro" aria-live="polite">
            Lecture en cours depuis {formaterDuree(maintenant - photo.debutLecture)}. Elle prend en général
            2 à 3 minutes : tu peux aller sur les autres onglets, un bandeau t'indiquera quand elle est finie.
          </p>
        )}

        {photo.erreur && <p className="qcm-feedback error">{photo.erreur}</p>}

        {photo.remarques.length > 0 && (
          <div className="avertissements">
            <strong>Points à vérifier sur l'image</strong>
            <ul>
              {photo.remarques.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {photo.texte !== null && (
        <div className="choir-layout">
          <div className="choir-editor">
            <p className="systeme-numero">Transcription (tu peux la corriger)</p>
            <textarea
              className="solfa-input"
              rows={14}
              wrap="off"
              spellCheck={false}
              aria-label="Transcription solfa"
              value={photo.texte}
              onChange={(e) => modifierTexte(e.target.value)}
            />

            <div className="controls-row">
              <label>
                Tempo (BPM)
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={photo.tempo}
                  onChange={(e) => modifierTempo(Number(e.target.value))}
                />
              </label>
              <button type="button" onClick={mettreAJourPartition}>
                Mettre à jour la partition
              </button>
            </div>
          </div>

          {photo.erreurAnalyse && <p className="qcm-feedback error">{photo.erreurAnalyse}</p>}
          {photo.partition && <Partition partition={photo.partition} tempo={photo.tempo} />}
        </div>
      )}
    </>
  );
}
