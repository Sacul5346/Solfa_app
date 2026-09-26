// themes.js
// Thèmes visuels de l'application. Les couleurs et polices de chaque thème
// sont définies dans index.css, sous [data-app-theme='…'].

export const THEMES = [
  {
    id: 'recueil',
    nom: 'Recueil de cantiques',
    description: 'Papier clair, encre bleu nuit et rouge bordeaux, comme un livre de chants.',
  },
  {
    id: 'vitrail',
    nom: 'Vitrail',
    description: 'Bandeau bleu nuit et or, une couleur de vitrail pour chaque voix.',
  },
  {
    id: 'repetition',
    nom: 'Salle de répétition',
    description: 'Sobre et très lisible : gros caractères et boutons faciles à toucher.',
  },
  {
    id: 'tableau',
    nom: 'Tableau noir',
    description: 'Le design d’origine, sombre, façon craie sur ardoise.',
  },
];

export const THEME_PAR_DEFAUT = 'recueil';

const CLE_STOCKAGE = 'solfa-theme';

/**
 * Retourne le thème choisi sur cet appareil, ou le thème par défaut.
 */
export function lireThemeEnregistre() {
  try {
    const id = localStorage.getItem(CLE_STOCKAGE);
    return THEMES.some((theme) => theme.id === id) ? id : THEME_PAR_DEFAUT;
  } catch {
    return THEME_PAR_DEFAUT;
  }
}

/**
 * Applique un thème à toute l'application et le mémorise sur cet appareil.
 */
export function appliquerTheme(id) {
  document.documentElement.dataset.appTheme = id;
  try {
    localStorage.setItem(CLE_STOCKAGE, id);
  } catch {
    // Stockage indisponible (navigation privée…) : le thème s'applique quand même
  }
}
