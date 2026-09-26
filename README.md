# Solfa studio — Oreille & voix

Application web d'entraînement au **solfa (tonic sol-fa)** : écouter, reconnaître et chanter les notes, et faire jouer des chants à une ou quatre voix à partir de leur notation solfa.

Tout le son est généré dans le navigateur (Web Audio API) ; la reconnaissance de la voix utilise le micro et la bibliothèque [pitchy](https://github.com/ianprime0509/pitchy). Aucun serveur n'est nécessaire.

## Pages

| Onglet | Rôle |
|---|---|
| **Partition** (accueil) | Ajouter une partition de 1 à 4 voix, en **collant le texte** ou en **important une photo** (lue par l'IA Claude, et la lecture continue si on change d'onglet). Puis la voir par systèmes, l'écouter en entier, par système ou voix par voix, l'exporter en PDF, et télécharger l'audio (chœur complet, une voix seule, ou une voix mise en avant pour répéter) |
| **Chanter** | Entendre le do puis une note cible, la chanter au micro et voir l'écart de justesse |
| **Oreille** | Entraînement de l’oreille en 4 exercices (note, intervalle, petite dictée, accord), avec niveaux, réponses sur l’échelle du solfa et score gardé |
| **Échauffement** | Une séance de chorale en 6 étapes (corps, souffle, résonance, vocalises, justesse, ensemble), 40 exercices : consignes de détente, guides de respiration minutés, sirènes et trilles en glissando, vocalises qui montent d'un demi-ton à chaque répétition, exercices de justesse en solfège **en écho** (l'application joue, on répète dans le silence, les notes s'affichent en grand), motifs surprises, bourdon, accords à 4 voix et canon. Note de départ adaptée à chaque voix |
| **◐ Thème** | Choisir l'apparence : Recueil de cantiques (par défaut), Vitrail, Salle de répétition ou Tableau noir. Le choix est gardé sur l'appareil |

## Syntaxe solfa

```
Key: G            (ou « Do dia G »)
4/4
| d : r ! m : d | m : f ! s : - |
| s.l : s.f ! m : d | d : s, ! d : - |
```

- `Key: G` ou `Do dia G` : tonalité ; dièses et bémols acceptés (`F#`, `Bb`, `E♭`…). La mesure (`4/4`) peut être sur la même ligne.
- `|` sépare les mesures, `:` sépare les temps, `!` marque la demi-barre (temps accentué)
- Syllabes : `d r m f s l t`, et les altérées `di ri fi si ta`

Dans un temps :

| Écriture | Signification |
|---|---|
| `d.r` | deux demi-temps |
| `d,r.m` / `d.r,m` | quart + quart + demi / demi + quart + quart |
| `d.,r` | pointé : ¾ + ¼ de temps |
| `d.,r.m` | quart + quart + demi (écriture courante des partitions malgaches) |
| `d.r.m` | triolet |
| `-` | prolonge la note précédente (même d'une ligne à l'autre) |
| vide | silence |
| `d'` / `d''` | une / deux octaves au-dessus |
| `s,` / `s,,` | une / deux octaves en dessous (`,s` en début de temps est aussi accepté) |
| `te`, `fe`, `se`, `de`, `ma`, `ra` | écritures anglaises (Curwen) de `t`, `fi`, `si`, `di`, et de mi et ré baissés |

## Partition chorale (onglet Partition)

On colle la partition comme sur papier :

```
Gloria
Do dia C   4/4

m : m ! f : m | r : - ! m : - |      ← Soprano
d : d ! d : d | t, : - ! d : - |     ← Alto
s : s ! l : s | s : - ! s : - |      ← Ténor
d : d ! f : d | s : - ! d : - |      ← Basse
Al - le - lu - ia,  A - men

S1
(système suivant…)

2. Couplets en fin de partition
```

- Chaque groupe de **1 à 4 lignes de musique** forme un système, lu dans l'ordre Soprano, Alto, Ténor, Basse. Une **ligne vide** sépare deux systèmes. On peut aussi préfixer les lignes (`Soprano: …`, `Alto: …`, `Ténor: …`, `Basse: …`).
- Une mélodie seule est jouée en Soprano ; pour une autre voix, préfixer ses lignes (`Ténor: …`). Une voix absente d'un système (passage à l'unisson) se tait le temps de ce système.
- Les lignes de texte sous un système sont ses **paroles** ; la première ligne de texte en haut est le **titre**.
- `DC`, `DS1`, `S1`, `Fin` sont affichés comme **repères** au-dessus du système suivant (les reprises ne sont pas encore jouées).
- Une ligne qui commence par un numéro (`2.`, `3-`) après la musique commence les **couplets**.
- L'application signale les mesures où les voix n'ont pas le même nombre de temps, et chaque erreur indique le système, la voix et la mesure.

## Développement

Prérequis : Node.js 22.9 ou plus récent.

```bash
npm install      # installer les dépendances
cp .env.example .env   # puis mettre la clé API dans .env
npm run dev      # l'application, avec rechargement (http://localhost:5173)
npm run server   # le serveur de lecture d'images, à lancer en même temps (port 3001)
npm run lint     # vérifier le code
```

En développement, Vite renvoie les appels `/api` vers le serveur (port 3001).

## Mise en ligne

L'application et le serveur tournent dans un seul programme Node :

```bash
npm install
npm run build    # compile l'application dans dist/
npm start        # sert l'application et l'API sur le port PORT (3001 par défaut)
```

Variables d'environnement (fichier `.env` ou réglages de l'hébergeur, voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | **Obligatoire** pour la page Photo. Clé API Anthropic, gardée sur le serveur, jamais envoyée au navigateur |
| `CODE_ACCES` | Facultatif. Si défini, seules les personnes qui connaissent ce code peuvent faire lire des images |
| `LIMITE_PAR_HEURE` | Facultatif. Images par heure et par adresse IP (20 par défaut) |
| `PORT` | Facultatif. Port d'écoute (3001 par défaut) |

Chaque image lue est facturée sur le compte Anthropic (modèle `claude-opus-5`). Le code d'accès et la limite horaire évitent qu'un inconnu consomme le crédit.

## Organisation du code

- `src/pages/` — une page par onglet (`PartitionPage`, `VoicePage`, `ExercisePage`, `WarmupPage`, `ThemePage`)
- `src/components/SaisieTexte.jsx`, `SaisiePhoto.jsx` — les deux façons d'ajouter une partition
- `src/components/Partition.jsx` — affichage, écoute et exports d'une partition
- `src/pages/ExercisePage.jsx`, `src/components/Modulateur.jsx`, `src/utils/oreille.js` — l'entraînement de l'oreille (page, échelle, questions et sons)
- `src/utils/partitionStore.js`, `photoStore.js` — état de l'onglet Partition, gardé quand on change d'onglet
- `src/utils/solfaParser.js` — lecture du texte solfa
- `src/utils/notesDatabase.js` — syllabes, tonalités, conversions note ↔ fréquence
- `src/utils/audioEngine.js` — lecture audio, arrêt, et export WAV
- `src/utils/transcription.js` — préparation de l'image et appel au serveur
- `src/utils/pitchDetector.js` — détection de la note chantée au micro
- `src/utils/themes.js` — liste des thèmes et mémorisation du choix
- `src/utils/exercicesVocaux.js` — catalogue des exercices d'échauffement ; `echauffement.js` les joue
- `src/components/GuideSouffle.jsx` — guide minuté des exercices de respiration
- `src/components/SuiviSolfa.jsx` — affichage en grand de la note jouée et des notes à répéter
- `server/index.js` — serveur : lecture des images par Claude, et service de l'application
