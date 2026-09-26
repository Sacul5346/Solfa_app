// audioEngine.js
// Pilier 3.2 du cahier des charges — lecture audio
// Joue une fréquence donnée via un oscillateur Web Audio API

// Un seul AudioContext partagé pour toute l'app (les navigateurs limitent le nombre d'instances)
let audioContext = null;

// Sons programmés ou en cours de lecture, pour pouvoir tout arrêter (bouton Stop)
const sonsActifs = new Set();

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Programme un son pur à un instant précis du AudioContext.
 * Petit fondu en entrée/sortie pour éviter les "clics" audio.
 *
 * @param {AudioContext} ctx
 * @param {number} frequency - fréquence en Hz
 * @param {number} startTime - instant de départ (temps du AudioContext)
 * @param {number} duration - durée en secondes
 * @param {number} volume - volume crête (0 à 1)
 * @param {number} finFondu - instant (relatif au départ) où le volume retombe à 0
 */
function programmerSon(ctx, frequency, startTime, duration, volume, finFondu = Math.max(0.02, duration - 0.03)) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine'; // son pur, simple pour commencer
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, startTime + finFondu);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  suivreSon(ctx, oscillator, gainNode);
}

// Seuls les sons joués en direct peuvent être arrêtés (pas ceux d'un export audio)
function suivreSon(ctx, oscillator, gainNode) {
  if (ctx !== audioContext) return;
  const son = { oscillator, gainNode };
  sonsActifs.add(son);
  oscillator.onended = () => sonsActifs.delete(son);
}

/**
 * Arrête immédiatement tout ce qui joue ou est programmé (avec un fondu très court).
 */
export function stopAll() {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  sonsActifs.forEach(({ oscillator, gainNode }) => {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.03);
    oscillator.stop(now + 0.04);
  });
  sonsActifs.clear();
}

/**
 * Joue une note à une fréquence donnée pendant une durée donnée.
 *
 * @param {number} frequency - fréquence en Hz (ex: résultat de solfaToFrequency)
 * @param {number} durationSeconds - durée du son en secondes (défaut 0.8s)
 */
export function playNote(frequency, durationSeconds = 0.8) {
  const ctx = getAudioContext();
  programmerSon(ctx, frequency, ctx.currentTime, durationSeconds, 0.3, durationSeconds);
}

/**
 * Joue une suite de fréquences les unes après les autres (ex: une gamme complète).
 * Utilise le temps interne du AudioContext pour un timing précis,
 * plutôt que des setTimeout qui peuvent dériver.
 * Coupe la lecture en cours avant de commencer.
 *
 * @param {number[]} frequencies - liste de fréquences en Hz, dans l'ordre à jouer
 * @param {number} noteDuration - durée de chaque note en secondes (défaut 0.5s)
 */
export function playSequence(frequencies, noteDuration = 0.5) {
  stopAll();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  frequencies.forEach((frequency, index) => {
    programmerSon(ctx, frequency, now + index * noteDuration, noteDuration, 0.3, noteDuration);
  });
}

/**
 * Programme une voix (suite de notes avec leurs durées, silences compris) à partir de `startTime`.
 */
function programmerVoix(ctx, notes, resolveFrequency, secondsPerBeat, startTime, volume, volumeAccent) {
  let curseur = startTime;

  notes.forEach((note) => {
    const duration = note.beats * secondsPerBeat;

    if (!note.isRest) {
      programmerSon(ctx, resolveFrequency(note), curseur, duration, note.accent ? volumeAccent : volume);
    }

    curseur += duration;
  });
}

/**
 * Joue une séquence de notes avec leurs durées et respecte les silences.
 * Coupe la lecture en cours avant de commencer.
 *
 * @param {{syllable: string|null, octaveShift: number, beats: number, accent?: boolean, isRest?: boolean}[]} notes
 * @param {(note: object) => number} resolveFrequency
 * @param {number} tempoBPM
 */
export function playRhythmicSequence(notes, resolveFrequency, tempoBPM = 90) {
  stopAll();
  const ctx = getAudioContext();
  programmerVoix(ctx, notes, resolveFrequency, 60 / tempoBPM, ctx.currentTime, 0.26, 0.42);
}

/**
 * Joue plusieurs voix en même temps (ex: Soprano, Alto, Ténor, Basse),
 * chacune ayant sa propre séquence de notes — pour former des accords.
 * Toutes les voix démarrent au même instant, chacune suit ensuite son propre rythme.
 * Coupe la lecture en cours avant de commencer.
 *
 * @param {{notes: object[], resolveFrequency: (note: object) => number}[]} voix
 * @param {number} tempoBPM
 */
export function playChoralSequences(voix, tempoBPM = 90) {
  stopAll();
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  voix.forEach(({ notes, resolveFrequency }) => {
    programmerVoix(ctx, notes, resolveFrequency, 60 / tempoBPM, now, 0.2, 0.28);
  });
}

/**
 * Joue des glissandos (sirènes) les uns après les autres : chaque glissando passe
 * en continu par ses fréquences, avec une pause entre deux.
 * Coupe la lecture en cours avant de commencer.
 *
 * @param {{frequences: number[], dureeSegment: number}[]} glissandos
 * @param {number} pause - silence entre deux glissandos, en secondes
 * @returns {number} durée totale en secondes
 */
export function playGlides(glissandos, pause = 0.8) {
  stopAll();
  const ctx = getAudioContext();
  const debut = ctx.currentTime + 0.05;
  let curseur = debut;

  glissandos.forEach(({ frequences, dureeSegment }) => {
    const duree = dureeSegment * (frequences.length - 1);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequences[0], curseur);
    frequences.slice(1).forEach((frequence, i) => {
      oscillator.frequency.exponentialRampToValueAtTime(frequence, curseur + dureeSegment * (i + 1));
    });

    gainNode.gain.setValueAtTime(0, curseur);
    gainNode.gain.linearRampToValueAtTime(0.25, curseur + 0.1);
    gainNode.gain.setValueAtTime(0.25, curseur + duree - 0.15);
    gainNode.gain.linearRampToValueAtTime(0, curseur + duree);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(curseur);
    oscillator.stop(curseur + duree);
    suivreSon(ctx, oscillator, gainNode);

    curseur += duree + pause;
  });

  return curseur - debut;
}

/**
 * Joue le do de la tonalité (référence), un court silence, puis la note à reconnaître.
 * En solfa, une syllabe se reconnaît par rapport au do : sans cette référence,
 * il faudrait l'oreille absolue pour la retrouver.
 *
 * @param {number} referenceFrequency - fréquence du do de la tonalité
 * @param {number} frequency - fréquence de la note à reconnaître
 * @param {number} tempoBPM
 */
export function playNoteWithReference(referenceFrequency, frequency, tempoBPM = 80) {
  playRhythmicSequence(
    [
      { frequency: referenceFrequency, beats: 1 },
      { isRest: true, beats: 0.5 },
      { frequency, beats: 1.5 },
    ],
    (note) => note.frequency,
    tempoBPM
  );
}

/**
 * Produit un fichier audio (WAV) de plusieurs voix jouées ensemble, sans les faire sonner :
 * le navigateur calcule le son en accéléré (OfflineAudioContext).
 *
 * @param {{notes: object[], resolveFrequency: (note: object) => number, volume: number, volumeAccent: number}[]} voix
 * @param {number} tempoBPM
 * @returns {Promise<Blob>} fichier WAV mono
 */
export async function renderVoicesToWav(voix, tempoBPM = 90, sampleRate = 22050) {
  const secondsPerBeat = 60 / tempoBPM;
  const nbTemps = Math.max(...voix.map(({ notes }) => notes.reduce((total, note) => total + note.beats, 0)));
  const duree = nbTemps * secondsPerBeat + 0.5;

  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineContext(1, Math.ceil(duree * sampleRate), sampleRate);

  voix.forEach(({ notes, resolveFrequency, volume, volumeAccent }) => {
    programmerVoix(ctx, notes, resolveFrequency, secondsPerBeat, 0, volume, volumeAccent);
  });

  const buffer = await ctx.startRendering();
  return encoderWav(buffer.getChannelData(0), sampleRate);
}

/**
 * Encode des échantillons en WAV 16 bits mono. Le volume est ramené sous le maximum
 * si les voix additionnées le dépassent, pour éviter la saturation.
 */
function encoderWav(echantillons, sampleRate) {
  let crete = 0;
  for (let i = 0; i < echantillons.length; i += 1) {
    crete = Math.max(crete, Math.abs(echantillons[i]));
  }
  const gain = crete > 0.9 ? 0.9 / crete : 1;

  const vue = new DataView(new ArrayBuffer(44 + echantillons.length * 2));
  const ecrireTexte = (position, texte) => {
    for (let i = 0; i < texte.length; i += 1) vue.setUint8(position + i, texte.charCodeAt(i));
  };

  ecrireTexte(0, 'RIFF');
  vue.setUint32(4, 36 + echantillons.length * 2, true);
  ecrireTexte(8, 'WAVE');
  ecrireTexte(12, 'fmt ');
  vue.setUint32(16, 16, true); // taille du bloc fmt
  vue.setUint16(20, 1, true); // PCM
  vue.setUint16(22, 1, true); // mono
  vue.setUint32(24, sampleRate, true);
  vue.setUint32(28, sampleRate * 2, true); // octets par seconde
  vue.setUint16(32, 2, true); // octets par échantillon
  vue.setUint16(34, 16, true); // bits par échantillon
  ecrireTexte(36, 'data');
  vue.setUint32(40, echantillons.length * 2, true);

  for (let i = 0; i < echantillons.length; i += 1) {
    const valeur = Math.max(-1, Math.min(1, echantillons[i] * gain));
    vue.setInt16(44 + i * 2, valeur < 0 ? valeur * 0x8000 : valeur * 0x7fff, true);
  }

  return new Blob([vue], { type: 'audio/wav' });
}
