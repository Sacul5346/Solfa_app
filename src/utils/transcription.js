// transcription.js
// Envoi d'une image de partition au serveur, qui la fait lire par Claude
// et renvoie le texte solfa (voir server/index.js).

const CLE_CODE_ACCES = 'solfa-code-acces';

/**
 * Prépare une image pour l'envoi : réduite si elle est très grande (les photos de téléphone
 * dépassent vite la limite de 5 Mo), posée sur fond blanc et convertie en JPEG.
 */
export async function preparerImage(fichier, coteMax = 2400) {
  const bitmap = await createImageBitmap(fichier);
  const echelle = Math.min(1, coteMax / Math.max(bitmap.width, bitmap.height));
  const largeur = Math.round(bitmap.width * echelle);
  const hauteur = Math.round(bitmap.height * echelle);

  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, largeur, hauteur);
  ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { image: dataUrl.slice(dataUrl.indexOf(',') + 1), typeMedia: 'image/jpeg' };
}

/**
 * Envoie l'image au serveur et retourne { partition, remarques }.
 * En cas d'échec, l'erreur porte un message à afficher, et `codeRequis` si un code d'accès est demandé.
 */
export async function transcrireImage(imagePreparee, codeAcces) {
  let reponse;
  try {
    reponse = await fetch('/api/transcrire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(codeAcces ? { 'x-code-acces': codeAcces } : {}),
      },
      body: JSON.stringify(imagePreparee),
    });
  } catch (e) {
    throw new Error('Le serveur de lecture est injoignable. Vérifie ta connexion internet.', { cause: e });
  }

  let donnees = {};
  try {
    donnees = await reponse.json();
  } catch {
    // Réponse sans JSON (serveur absent, page d'erreur…) : message générique ci-dessous
  }

  if (!reponse.ok) {
    // Sans message de notre serveur, c'est qu'il n'a pas répondu (arrêté, en panne, ou pas encore lancé)
    const message = donnees.erreur
      || (reponse.status >= 500
        ? 'Le serveur de lecture ne répond pas. S’il tourne sur ton ordinateur, vérifie que « npm run server » est lancé.'
        : `Le serveur a répondu avec une erreur (${reponse.status}).`);
    const erreur = new Error(message);
    erreur.codeRequis = Boolean(donnees.codeRequis);
    erreur.remarques = donnees.remarques || [];
    throw erreur;
  }
  return donnees;
}

export function lireCodeAcces() {
  try {
    return localStorage.getItem(CLE_CODE_ACCES) || '';
  } catch {
    return '';
  }
}

export function enregistrerCodeAcces(code) {
  try {
    localStorage.setItem(CLE_CODE_ACCES, code);
  } catch {
    // Stockage indisponible : le code devra être ressaisi
  }
}
