// exercicesVocaux.js
// Catalogue des exercices d'échauffement de chorale, dans l'ordre d'une séance :
// corps → souffle → résonance → vocalises → ensemble (10 à 15 minutes en tout).
// Sources : ressourceschorales.fr, choirmate.com, lacordevocale.org, blogs.jwpepper.com.
//
// Types d'exercice :
//  - consigne  : mouvements à faire, sans son
//  - souffle   : guide minuté (étapes avec durée en secondes)
//  - motif     : mélodie en solfa, répétée en montant d'un demi-ton
//                (echo : chaque mesure est suivie d'un silence pour la répéter ;
//                 aleatoire : un motif différent est tiré à chaque répétition)
//  - bourdon   : mélodie en solfa jouée sur un do grave tenu
//  - glissando : sirène continue entre des notes solfa, répétée en montant d'un demi-ton
//  - choeur    : plusieurs voix ensemble (une ligne solfa par voix)
//  - canon     : une mélodie reprise par chaque voix, décalée

function repeter(etapes, fois) {
  return Array.from({ length: fois }, () => etapes).flat();
}

const INSPIRE = (secondes = 4) => ({ texte: 'Inspire par le ventre', secondes, signal: 'inspire' });

export const PHASES = [
  {
    id: 'corps',
    titre: 'Corps',
    duree: '2 à 3 min',
    resume: 'Détendre les muscles du cou, des épaules et de la mâchoire, qui influencent directement la voix.',
    exercices: [
      {
        id: 'posture',
        type: 'consigne',
        titre: 'Posture',
        but: 'Se tenir droit sans raideur, pour que le souffle circule librement.',
        etapes: [
          'Pieds écartés de la largeur des hanches, poids réparti sur les deux pieds.',
          'Genoux souples, jamais bloqués.',
          'Le sommet du crâne tiré vers le haut, le menton parallèle au sol.',
        ],
      },
      {
        id: 'epaules',
        type: 'consigne',
        titre: 'Épaules',
        but: 'Ouvrir la cage thoracique et relâcher le haut du dos.',
        etapes: [
          '8 rotations des épaules vers l’arrière, lentement (3 secondes chacune).',
          '8 rotations vers l’avant.',
          'Monter les épaules vers les oreilles, puis les laisser tomber d’un coup, 3 fois.',
        ],
      },
      {
        id: 'nuque',
        type: 'consigne',
        titre: 'Nuque',
        but: 'Relâcher les muscles du cou, qui tiennent le larynx.',
        etapes: [
          'Pencher la tête vers l’épaule droite, 5 secondes, puis vers la gauche.',
          'Pencher la tête en avant, 5 secondes.',
          'Pas de grands cercles complets avec la tête : ils fatiguent la nuque.',
        ],
      },
      {
        id: 'machoire',
        type: 'consigne',
        titre: 'Mâchoire',
        but: 'Libérer la mâchoire pour des voyelles plus ouvertes.',
        etapes: [
          'Ouvrir grand la bouche 3 secondes, 5 fois.',
          'Masser les joues (muscles masséters) en petits cercles, 15 secondes.',
          'Bouger doucement la mâchoire de gauche à droite.',
        ],
      },
      {
        id: 'secousses',
        type: 'consigne',
        titre: 'Secousses',
        but: 'Chasser les tensions et mettre le groupe en énergie.',
        etapes: [
          'Secouer les mains 10 secondes.',
          'Petits rebonds sur les pieds, tout le corps relâché, 15 secondes.',
          'Finir par un grand souffle « pfff ».',
        ],
      },
    ],
  },
  {
    id: 'souffle',
    titre: 'Souffle',
    duree: '3 à 4 min',
    resume: 'Installer une respiration basse (par le ventre) et un souffle régulier, qui soutient la voix.',
    exercices: [
      {
        id: 'ventrale',
        type: 'souffle',
        titre: 'Respiration ventrale',
        comment: 'Une main sur le ventre, une sur la poitrine : seul le ventre bouge, les épaules restent basses.',
        but: 'La base du contrôle du souffle.',
        etapes: repeter([INSPIRE(4), { texte: 'Expire sur « sss »', secondes: 6, signal: 'expire' }], 6),
      },
      {
        id: 'ch',
        type: 'souffle',
        titre: 'Souffles courts « ch »',
        comment: 'Des « ch » courts et rapides, poussés par le ventre, 8 par série.',
        but: 'Réveiller le diaphragme et le soutien.',
        etapes: repeter(
          [
            { texte: '8 souffles courts « ch-ch-ch »', secondes: 3, signal: 'tics' },
            { texte: 'Inspire lentement', secondes: 3, signal: 'inspire' },
          ],
          4
        ),
      },
      {
        id: 'tenue',
        type: 'souffle',
        titre: 'Tenue de souffle',
        comment: 'Retiens l’air sans serrer la gorge, puis expire le plus régulièrement possible.',
        but: 'Apprendre à économiser l’air pour les longues phrases.',
        etapes: [15, 20, 25].flatMap((secondes) => [
          INSPIRE(4),
          { texte: 'Retiens, gorge ouverte', secondes: 4, signal: 'retiens' },
          { texte: `Expire sur « sss » (${secondes} s)`, secondes, signal: 'expire' },
        ]),
      },
      {
        id: 'staccato',
        type: 'motif',
        titre: 'Staccato « ha »',
        comment: 'Sur « ha », des notes courtes et détachées, chaque « ha » poussé par le ventre.',
        but: 'Relier le souffle à la voix.',
        motif: 'd. : d. : d. : d. | d. : d. : d. : d. | d : - : - : - |',
      },
    ],
  },
  {
    id: 'resonance',
    titre: 'Résonance',
    duree: '3 à 4 min',
    resume: 'Mettre la voix en vibration doucement, et la placer vers l’avant du visage.',
    exercices: [
      {
        id: 'bourdonnement',
        type: 'motif',
        titre: 'Bourdonnement « mmm »',
        comment: 'Lèvres fermées, dents desserrées : les lèvres et le nez doivent vibrer.',
        but: 'Réveiller les cordes vocales sans les fatiguer.',
        motif: 'd : r : m : f | s : f : m : r | d : - : - : - |',
      },
      {
        id: 'trille',
        type: 'glissando',
        titre: 'Trille des lèvres « brrr »',
        comment: 'Les lèvres vibrent comme un cheval qui s’ébroue, avec la voix, en glissant du grave à l’aigu.',
        but: 'Souffle régulier et voix détendue, sans effort de la gorge.',
        points: ['s,', 's', 's,'],
        dureeSegment: 2.5,
      },
      {
        id: 'sirene',
        type: 'glissando',
        titre: 'Sirène « ou – o – a »',
        comment: 'Glisse sans à-coups du plus grave au plus aigu confortable et retour, sur « ou », puis « o », puis « a ».',
        but: 'Relier la voix de poitrine et la voix de tête (passer le « passage »).',
        points: ['s,', "s'", 's,'],
        dureeSegment: 4,
      },
      {
        id: 'paille',
        type: 'glissando',
        titre: 'Paille (ou « vvv »)',
        comment: 'Chante dans une paille fine en glissant, puis retire-la et chante sur « a ». Sans paille : « vvv » lèvres sur les dents.',
        but: 'Équilibrer souffle et vibration : la voix se place sans forcer.',
        points: ['d', "d'", 'd'],
        dureeSegment: 3,
      },
      {
        id: 'voyelles',
        type: 'motif',
        titre: 'Voyelles « a – é – i – o – ou »',
        comment: 'Une voyelle par note tenue, sans changer la couleur du son ni la hauteur.',
        but: 'Des voyelles unifiées : tout le chœur prononce pareil.',
        motif: 'd : - : - : - | d : - : - : - | d : - : - : - | d : - : - : - | d : - : - : - |',
      },
    ],
  },
  {
    id: 'vocalises',
    titre: 'Vocalises',
    duree: '4 à 5 min',
    resume: 'Étendre la voix et travailler la justesse, en montant d’un demi-ton à chaque répétition.',
    exercices: [
      {
        id: 'cinq-descendantes',
        type: 'motif',
        titre: 'Cinq notes descendantes « nou – ni – na »',
        comment: 'Commence par descendre : le « n » place le son vers l’avant. Change de voyelle à chaque répétition.',
        but: 'Le meilleur premier exercice chanté : on part du haut sans forcer.',
        motif: 's : f : m : r | d : - : - : - |',
      },
      {
        id: 'cinq-notes',
        type: 'motif',
        titre: 'Gamme de 5 notes',
        comment: 'Sur « a » ou « o », montée et descente bien liées.',
        but: 'Justesse et régularité du son sur toute la gamme.',
        motif: 'd : r : m : f | s : f : m : r | d : - : - : - |',
      },
      {
        id: 'gamme',
        type: 'motif',
        titre: 'Gamme complète',
        comment: 'Sur « la », en gardant le même volume en haut et en bas.',
        but: 'Parcourir l’octave, repérer les notes fragiles.',
        motif: "d : r : m : f | s : l : t : d' | t : l : s : f | m : r : d : - |",
      },
      {
        id: 'arpege',
        type: 'motif',
        titre: 'Arpège « ma » (1-3-5-3-1)',
        comment: 'Sur « ma », chaque note bien placée : les sauts demandent plus de précision qu’une gamme.',
        but: 'Justesse des intervalles, timbre égal.',
        motif: 'd : m : s : m | d : - : - : - |',
      },
      {
        id: 'arpege-octave',
        type: 'motif',
        titre: 'Arpège à l’octave « ya »',
        comment: 'Sur « ya », en ouvrant la bouche vers le haut, sans pousser.',
        but: 'Monter dans l’aigu en gardant la même voix.',
        motif: "d : m : s : d' | s : m : d : - |",
      },
      {
        id: 'octave',
        type: 'motif',
        titre: 'Saut d’octave « ya »',
        comment: 'Prépare le saut en respirant : pense la note du haut avant de la chanter.',
        but: 'Oser l’aigu, soutenir le souffle.',
        motif: "d : - : d' : - | d : - : - : - |",
      },
      {
        id: 'tierces',
        type: 'motif',
        titre: 'Tierces',
        comment: 'Sur « lo », en gardant les notes liées.',
        but: 'Entendre et chanter juste les tierces, très présentes dans les accords.',
        motif: 'd : m : r : f | m : s : f : l | s : - : - : - |',
      },
      {
        id: 'intervalles',
        type: 'motif',
        titre: 'Intervalles depuis le do',
        comment: 'Reviens au do entre chaque note : seconde, tierce, quarte, quinte, sixte, septième, octave.',
        but: 'Apprendre à situer chaque note par rapport au do, comme en solfa.',
        motif: "d : r : d : m | d : f : d : s | d : l : d : t | d : d' : - : - |",
      },
      {
        id: 'agilite',
        type: 'motif',
        titre: 'Vocalise rapide',
        comment: 'Sur « a », léger et rapide ; commence à un tempo lent si c’est difficile.',
        but: 'Agilité de la voix pour les passages rapides.',
        motif: 'd,r.m,f : s,f.m,r | d : - : - : - |',
      },
      {
        id: 'chromatique',
        type: 'motif',
        titre: 'Gamme chromatique',
        comment: 'Sur « na », tous les demi-tons : très petits écarts, reste bien précis.',
        but: 'Justesse fine, utile pour les altérations (di, fi, ta…).',
        motif: "d : di : r : ri | m : f : fi : s | si : l : ta : t | d' : - : - : - |",
      },
      {
        id: 'grande-gamme',
        type: 'motif',
        titre: 'Grande gamme de 9 notes',
        comment: 'Sur « a », en une seule respiration. Réservé aux voix déjà chaudes.',
        but: 'Étendue et souffle long.',
        motif: "d : r : m : f | s : l : t : d' | r' : d' : t : l | s : f : m : r | d : - : - : - |",
      },
      {
        id: 'messa-di-voce',
        type: 'motif',
        titre: 'Son filé (messa di voce)',
        comment: 'Sur « a », une seule note : commence très doucement, enfle jusqu’à fort, puis reviens à très doux.',
        but: 'Contrôle du souffle et des nuances.',
        motif: 'd : - : - : - | - : - : - : - |',
      },
    ],
  },
  {
    id: 'justesse',
    titre: 'Justesse',
    duree: '3 à 5 min',
    resume:
      'Chanter juste en nommant les notes, comme en solfège : l’application joue, tu répètes dans le silence qui suit. Les notes s’affichent pendant la lecture.',
    exercices: [
      {
        id: 'intervalles-echo',
        type: 'motif',
        echo: true,
        titre: 'Intervalles depuis le do, en écho',
        comment:
          'Écoute « do – ré – do », puis chante-le en disant le nom des notes. Chaque intervalle s’agrandit : seconde, tierce… jusqu’à l’octave.',
        but: 'Situer chaque note par rapport au do : la base de la justesse en solfège.',
        motif: "d : r : d | d : m : d | d : f : d | d : s : d | d : l : d | d : t : d | d : d' : d |",
      },
      {
        id: 'intervalles-descendants',
        type: 'motif',
        echo: true,
        titre: 'Intervalles vers le bas, en écho',
        comment: 'Même principe en partant du do aigu : on descend vers chaque note, puis on remonte au do.',
        but: 'Les intervalles descendants sont souvent chantés trop bas : on les travaille à part.',
        motif: "d' : t : d' | d' : l : d' | d' : s : d' | d' : f : d' | d' : m : d' | d' : r : d' | d' : d : d' |",
      },
      {
        id: 'accord-echo',
        type: 'motif',
        echo: true,
        titre: 'Do – mi – sol dans tous les sens, en écho',
        comment: 'Les trois notes de l’accord de do, dans des ordres différents. Répète chaque motif en nommant les notes.',
        but: 'Reconnaître et chanter juste les notes de l’accord, qui reviennent sans cesse dans les cantiques.',
        motif: "d : m : s | s : m : d | d : s : m | m : d : s | s : d' : s | d : - : - |",
      },
      {
        id: 'retour-au-do',
        type: 'motif',
        echo: true,
        titre: 'Revenir au do, en écho',
        comment: 'De chaque note, reviens au do : garde le do bien en tête pendant tout l’exercice.',
        but: 'Ne jamais perdre la tonalité, même après un saut.',
        motif: 'm : d | s : d | r : d | l : d | f : d | t, : d |',
      },
      {
        id: 'motifs-aleatoires',
        type: 'motif',
        echo: true,
        aleatoire: true,
        titre: 'Motifs surprises, en écho',
        comment:
          'Un motif de 4 notes tiré au hasard, différent à chaque fois : écoute, puis chante-le en nommant les notes. Le nombre de motifs suit le réglage « Répétitions ».',
        but: 'Une vraie dictée chantée : on ne peut pas le chanter par cœur.',
      },
      {
        id: 'quartes-marche',
        type: 'motif',
        titre: 'Quartes en marche',
        comment: 'Sur le nom des notes : do-fa, ré-sol, mi-la… chaque saut de quarte monte d’un degré.',
        but: 'Justesse des quartes, fréquentes dans les basses et les départs de phrase.',
        motif: "d : f | r : s | m : l | f : t | s : d' | d : - |",
      },
      {
        id: 'quintes-marche',
        type: 'motif',
        titre: 'Quintes en marche',
        comment: 'Sur le nom des notes : do-sol, ré-la, mi-si… puis retour au do.',
        but: 'Justesse des quintes, l’intervalle qui sonne le plus « creux » quand il est faux.',
        motif: "d : s | r : l | m : t | f : d' | d : - |",
      },
      {
        id: 'arpeges-degres',
        type: 'motif',
        titre: 'Arpèges des accords I – IV – V',
        comment: 'Les trois accords principaux, note par note : do-mi-sol, fa-la-do, sol-si-ré, puis retour au do.',
        but: 'Entendre les accords qu’on chante à plusieurs voix, pour mieux trouver sa note dans l’harmonie.',
        motif: "d : m : s : m | f : l : d' : l | s : t : r' : t | d : - : - : - |",
      },
      {
        id: 'pentatonique',
        type: 'motif',
        titre: 'Gamme pentatonique',
        comment: 'Cinq notes seulement (do, ré, mi, sol, la) : pas de fa ni de si.',
        but: 'La gamme de très nombreux chants populaires : facile à chanter juste.',
        motif: "d : r : m : s | l : d' : l : s | m : r : d : - |",
      },
      {
        id: 'mineure',
        type: 'motif',
        titre: 'Gamme mineure (sur la)',
        comment: 'La gamme mineure part du la : la, si, do, ré, mi, fa, sol, la. Écoute sa couleur plus sombre.',
        but: 'Chanter juste les passages en mineur, où l’on a tendance à chanter faux les tierces.',
        motif: 'l, : t, : d : r | m : f : s : l | s : f : m : r | d : t, : l, : - |',
      },
      {
        id: 'bourdon',
        type: 'bourdon',
        titre: 'Justesse sur un bourdon',
        comment:
          'Un do grave est tenu pendant que la gamme monte et descend lentement : écoute chaque note sonner avec le bourdon, puis chante avec.',
        but: 'Sentir la justesse par rapport à une note fixe, comme dans un chœur où une voix tient.',
        motif: "d : - : r : - | m : - : f : - | s : - : l : - | t : - : d' : - | d : - : - : - |",
      },
    ],
  },
  {
    id: 'ensemble',
    titre: 'Ensemble',
    duree: '2 à 3 min',
    resume: 'Chanter à plusieurs voix, s’écouter et s’accorder. Chaque voix chante sa ligne.',
    exercices: [
      {
        id: 'accord-construit',
        type: 'choeur',
        titre: 'Accord construit voix par voix',
        comment: 'Les basses commencent, puis ténors, altos et sopranos entrent un temps après l’autre. Tenez l’accord en l’écoutant.',
        but: 'Construire un accord juste en s’appuyant sur les basses.',
        voix: {
          Basse: 'd : - : - : - | - : - : - : - |',
          Ténor: '  : s : - : - | - : - : - : - |',
          Alto: '  :   : m : - | - : - : - : - |',
          Soprano: '  :   :   : d | - : - : - : - |',
        },
      },
      {
        id: 'cadence',
        type: 'choeur',
        titre: 'Accords I – IV – V – I',
        comment: 'Chaque voix chante sa ligne sur « lou » ; changez d’accord ensemble, sans glisser.',
        but: 'La justesse des accords les plus fréquents des cantiques.',
        voix: {
          Soprano: 'm : - | f : - | r : - | m : - |',
          Alto: 's : - | l : - | s : - | s : - |',
          Ténor: "d' : - | d' : - | t : - | d' : - |",
          Basse: 'd : - | f : - | s : - | d : - |',
        },
      },
      {
        id: 'canon',
        type: 'canon',
        titre: 'Canon « Frère Jacques »',
        comment: 'Les sopranos commencent, chaque voix entre deux mesures plus tard sur la même mélodie.',
        but: 'Tenir sa ligne en entendant les autres.',
        motif:
          'd : r : m : d | d : r : m : d | m : f : s : - | m : f : s : - | ' +
          's.l : s.f : m : d | s.l : s.f : m : d | d : s, : d : - | d : s, : d : - |',
        decalage: 8, // en temps : deux mesures
        // La mélodie descend jusqu'au s, : on la chante un peu plus haut que les octaves habituelles des voix
        octaves: { Soprano: 5, Alto: 4, Ténor: 4, Basse: 3 },
      },
    ],
  },
];
