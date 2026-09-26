// server/index.js
// Petit serveur de l'application :
//  - POST /api/transcrire : envoie une image de partition à Claude et renvoie la transcription solfa
//  - sert l'application compilée (dist/) pour la mise en ligne
//
// La clé API reste sur le serveur (variable d'environnement ANTHROPIC_API_KEY),
// elle n'est jamais envoyée au navigateur.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

// Code d'accès facultatif : s'il est défini, seules les personnes qui le connaissent peuvent transcrire
const CODE_ACCES = process.env.CODE_ACCES || '';
// Nombre maximum de transcriptions par heure et par adresse IP (chaque image coûte)
const LIMITE_PAR_HEURE = Number(process.env.LIMITE_PAR_HEURE) || 20;

const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAILLE_MAX_BASE64 = 7_000_000; // ≈ 5 Mo d'image, la limite de l'API

const CONSIGNES = `Tu transcris des partitions de chant choral écrites en solfa (tonic sol-fa), souvent des cantiques malgaches, à partir d'une photo ou d'un scan. Tu produis un texte dans le format exact décrit ci-dessous : l'application le lit pour afficher la partition et la jouer.

Format du champ « partition » :
- Ligne 1 : le titre, tel qu'il est écrit.
- Ligne 2 : la tonalité et la mesure, par exemple « Do dia B   4/4 ». Garde « Do dia X » si la partition l'écrit ainsi, sinon écris « Key: X ». Dièse « # », bémol « b » (ex. « Do dia Eb »).
- Puis, pour chaque système (groupe de portées lues ensemble), une ligne de musique par portée écrite, de haut en bas (en général 4 : Soprano, Alto, Ténor, Basse), sans nom de voix devant. Si un passage n'a qu'une portée (unisson), écris une seule ligne.
- Juste sous ces 4 lignes, les lignes de paroles du système, telles qu'elles sont écrites.
- Une ligne vide entre deux systèmes.
- Les repères (DC, DS, S1, DS1, Fin…) sur une ligne à part, juste avant le système au-dessus duquel ils sont écrits.
- À la fin, les couplets écrits après la musique, chacun commençant par son numéro (« 2- », « 3. »).

Notation dans une ligne de musique :
- « | » barre de mesure, « ! » demi-barre, « : » sépare les temps. Place-les exactement là où ils sont sur la partition, y compris les « : » des temps prolongés (« d : - ! - : - »).
- Syllabes en minuscules : d r m f s l t, et les altérées di ri fi si ta. Recopie-les telles qu'elles sont écrites, y compris les formes longues (« te », « fe », « se »…).
- Octave au-dessus : apostrophe après la note (« d' », « d'' »). Octave en dessous : virgule après la note (« s, », « l, »). Un petit trait ou chiffre sous la note sur la partition s'écrit aussi avec la virgule.
- Subdivisions du temps : recopie les « . » et « , » caractère par caractère (« d.r », « d.,r », « d,r.m », « d.,d.d »), sans les corriger ni les réinterpréter.
- « - » prolonge la note précédente ; un temps vide est un silence.
- Dans un système, chaque mesure a le même nombre de temps dans toutes les voix : sers-t'en pour vérifier ta lecture.

Si un passage est illisible, donne ta meilleure lecture et décris le doute dans « remarques » en précisant le système, la voix et la mesure. N'invente aucune note absente de l'image. Ne mets aucun commentaire dans « partition ».
Si l'image n'est pas une partition solfa, mets « lisible » à false et explique pourquoi dans « remarques ».`;

const SCHEMA_REPONSE = {
  type: 'object',
  properties: {
    lisible: { type: 'boolean' },
    partition: { type: 'string' },
    remarques: { type: 'array', items: { type: 'string' } },
  },
  required: ['lisible', 'partition', 'remarques'],
  additionalProperties: false,
};

// --- Limite de débit très simple, en mémoire ---
const demandesParIp = new Map();

function depasseLaLimite(ip) {
  const maintenant = Date.now();
  const recentes = (demandesParIp.get(ip) || []).filter((t) => maintenant - t < 3_600_000);
  if (recentes.length >= LIMITE_PAR_HEURE) {
    demandesParIp.set(ip, recentes);
    return true;
  }
  recentes.push(maintenant);
  demandesParIp.set(ip, recentes);
  return false;
}

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '10mb' }));

app.post('/api/transcrire', async (req, res) => {
  if (CODE_ACCES && req.get('x-code-acces') !== CODE_ACCES) {
    return res.status(401).json({ erreur: 'Code d’accès manquant ou incorrect.', codeRequis: true });
  }

  const { image, typeMedia } = req.body || {};
  if (typeof image !== 'string' || !TYPES_IMAGE.includes(typeMedia)) {
    return res.status(400).json({ erreur: 'Image manquante ou format non pris en charge (JPEG, PNG, WebP ou GIF).' });
  }
  if (image.length > TAILLE_MAX_BASE64) {
    return res.status(413).json({ erreur: 'Image trop lourde (5 Mo au maximum).' });
  }
  if (depasseLaLimite(req.ip)) {
    return res.status(429).json({ erreur: `Limite atteinte : ${LIMITE_PAR_HEURE} images par heure. Réessaie plus tard.` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ erreur: 'Le serveur n’est pas configuré : clé API absente.' });
  }

  try {
    const client = new Anthropic();
    // Streaming : une transcription détaillée peut prendre plus d'une minute
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 32000,
      // Si la demande est refusée par erreur par un filtre de sécurité, l'API la relance sur un autre modèle
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: CONSIGNES,
      output_config: { format: { type: 'json_schema', schema: SCHEMA_REPONSE } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: typeMedia, data: image } },
            { type: 'text', text: 'Transcris cette partition.' },
          ],
        },
      ],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ erreur: 'La transcription de cette image a été refusée. Essaie avec une autre photo.' });
    }
    if (message.stop_reason === 'max_tokens') {
      return res.status(422).json({ erreur: 'La partition est trop longue pour une seule image. Photographie-la en plusieurs parties.' });
    }

    const texte = message.content.find((bloc) => bloc.type === 'text')?.text;
    const resultat = JSON.parse(texte);

    if (!resultat.lisible) {
      return res.status(422).json({
        erreur: 'Aucune partition solfa reconnue sur cette image.',
        remarques: resultat.remarques,
      });
    }

    return res.json({ partition: resultat.partition, remarques: resultat.remarques });
  } catch (erreur) {
    console.error('Transcription impossible :', erreur);

    if (erreur instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ erreur: 'Le serveur n’est pas configuré : clé API absente ou invalide.' });
    }
    if (erreur instanceof Anthropic.RateLimitError) {
      return res.status(503).json({ erreur: 'Le service de lecture est surchargé. Réessaie dans une minute.' });
    }
    if (erreur instanceof Anthropic.APIError) {
      return res.status(502).json({ erreur: 'Le service de lecture a rencontré un problème. Réessaie plus tard.' });
    }
    return res.status(500).json({ erreur: 'La lecture de l’image a échoué. Réessaie.' });
  }
});

// Application compilée (npm run build)
app.use(express.static(path.join(ICI, '..', 'dist')));

app.listen(PORT, () => {
  console.log(`Solfa studio : http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Attention : ANTHROPIC_API_KEY n’est pas définie, la transcription d’images ne marchera pas.');
  }
});
