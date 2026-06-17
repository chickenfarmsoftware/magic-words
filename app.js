// Define Application States
const STATES = {
  INITIALIZING: 'INITIALIZING',
  IDLE_WAITING: 'IDLE_WAITING',
  HEARD: 'HEARD',
  SUMMONING: 'SUMMONING',
  COOLDOWN: 'COOLDOWN'
};

class App {
  constructor() {
    this.state = STATES.INITIALIZING;
    this.recognition = null;
    this.particles = null;
    this.audioCtx = null;
    this.isListeningActive = false;
    this.currentAnimal = null;
    this.cooldownTimer = null;

    // Supported animal keywords mapping to their internal keys (including common toddler pronunciations)
    this.supportedAnimals = {
      'cat': 'cat', 'kitten': 'cat', 'kat': 'cat', 'tat': 'cat', 'cah': 'cat',
      'dog': 'dog', 'puppy': 'dog', 'dah': 'dog', 'gog': 'dog', 'doggy': 'dog',
      'rabbit': 'rabbit', 'bunny': 'rabbit', 'wabbit': 'rabbit', 'wabit': 'rabbit', 'labbit': 'rabbit', 'rabi': 'rabbit', 'bun': 'rabbit',
      'dragon': 'dragon', 'dwagon': 'dragon', 'gagon': 'dragon', 'dagon': 'dragon', 'dagin': 'dragon',
      'lion': 'lion', 'yion': 'lion', 'lili': 'lion', 'line': 'lion', 'lione': 'lion',
      'cow': 'cow', 'caw': 'cow', 'coww': 'cow', 'mow': 'cow', 'moo': 'cow',
      'horse': 'horse', 'hos': 'horse', 'hawse': 'horse', 'horsey': 'horse', 'hose': 'horse',
      'pig': 'pig', 'piddy': 'pig', 'piggy': 'pig', 'pik': 'pig',
      'bear': 'bear', 'beh': 'bear', 'bare': 'bear', 'behr': 'bear',
      'sheep': 'sheep', 'seep': 'sheep', 'heep': 'sheep', 'shee': 'sheep', 'baa': 'sheep',
      'elephant': 'elephant', 'elphant': 'elephant', 'efant': 'elephant', 'ellie': 'elephant', 'elpat': 'elephant', 'elph': 'elephant',
      'chicken': 'chicken', 'chick': 'chicken', 'hen': 'chicken',
      'donkey': 'donkey',
      'giraffe': 'giraffe',
      'tiger': 'tiger',
      'alligator': 'alligator', 'aligator': 'alligator', 'crocodile': 'alligator',
      'rhino': 'rhino', 'rhinoceros': 'rhino',
      'toucan': 'toucan', 'tucan': 'toucan', 'two-can': 'toucan', 'twocan': 'toucan',
      'hippo': 'hippo', 'hippopotamus': 'hippo', 'hipo': 'hippo', 'hepo': 'hippo',
      'lizard': 'lizard', 'lizardy': 'lizard', 'liz': 'lizard', 'wizado': 'lizard',
      'duck': 'duck', 'ducky': 'duck', 'quack': 'duck', 'duk': 'duck',
      'goat': 'goat', 'gote': 'goat', 'got': 'goat', 'billy': 'goat',
      'turkey': 'turkey', 'turki': 'turkey', 'gobble': 'turkey', 'tukey': 'turkey'
    };

    // Cache DOM Elements
    this.setupOverlay = document.getElementById('setup-overlay');
    this.startBtn = document.getElementById('start-btn');
    this.boyFront = document.getElementById('boy-front');
    this.boyAction = document.getElementById('boy-action');
    this.speechBubble = document.getElementById('speech-bubble');
    this.speechText = document.getElementById('speech-text');
    this.speechFeed = document.getElementById('speech-feed');
    this.speechFeedBubble = this.speechFeed.querySelector('.speech-feed-bubble');
    
    this.statusLight = document.getElementById('status-light');
    this.statusLabel = document.getElementById('status-label');
    this.micBtn = document.getElementById('mic-btn');

    // Animal image elements
    this.animalElements = {
      'cat': document.getElementById('animal-cat'),
      'dog': document.getElementById('animal-dog'),
      'rabbit': document.getElementById('animal-rabbit'),
      'dragon': document.getElementById('animal-dragon'),
      'lion': document.getElementById('animal-lion'),
      'cow': document.getElementById('animal-cow'),
      'horse': document.getElementById('animal-horse'),
      'pig': document.getElementById('animal-pig'),
      'bear': document.getElementById('animal-bear'),
      'sheep': document.getElementById('animal-sheep'),
      'elephant': document.getElementById('animal-elephant'),
      'chicken': document.getElementById('animal-chicken'),
      'donkey': document.getElementById('animal-donkey'),
      'giraffe': document.getElementById('animal-giraffe'),
      'tiger': document.getElementById('animal-tiger'),
      'toucan': document.getElementById('animal-toucan'),
      'alligator': document.getElementById('animal-alligator'),
      'rhino': document.getElementById('animal-rhino'),
      'hippo': document.getElementById('animal-hippo'),
      'lizard': document.getElementById('animal-lizard'),
      'duck': document.getElementById('animal-duck'),
      'goat': document.getElementById('animal-goat'),
      'turkey': document.getElementById('animal-turkey')
    };

    // List of core animal keys
    this.coreAnimals = [
      'cat', 'dog', 'rabbit', 'dragon', 'lion', 'cow', 'horse', 'pig', 'bear', 'sheep', 
      'elephant', 'chicken', 'donkey', 'giraffe', 'tiger', 'toucan', 'alligator', 'rhino', 
      'hippo', 'lizard', 'duck', 'goat', 'turkey'
    ];

    // Pre-calculate normalized toddler phonetic keys for all core animals
    this.normalizedCoreAnimals = {};
    this.coreAnimals.forEach(animal => {
      this.normalizedCoreAnimals[animal] = this.normalizeToddlerSpeech(animal);
    });

    this.initEvents();
  }

  // Normalize speech to match toddler pronunciation patterns
  normalizeToddlerSpeech(word) {
    let w = word.toLowerCase().trim();
    if (!w) return "";

    // 1. Map stops and fricatives: 'ph' / 'f' -> 'p'
    w = w.replace(/ph/g, 'p').replace(/f/g, 'p');

    // 2. Map 'th' / 'sh' / 'ch' -> 't' or 's'
    w = w.replace(/th/g, 't').replace(/sh/g, 's').replace(/ch/g, 't');

    // 3. Gliding & liquid normalization: map starting/middle 'w', 'y', 'l', 'r' to 'r'
    w = w.replace(/l/g, 'r').replace(/w/g, 'r').replace(/y/g, 'r');

    // 4. Fronting: map back sounds ('c', 'k', 'q', 'g') and front stops ('t', 'd') to single category 'k'
    w = w.replace(/c/g, 'k').replace(/q/g, 'k').replace(/g/g, 'k').replace(/t/g, 'k').replace(/d/g, 'k');

    // 5. Simplify double letters
    w = w.replace(/(.)\1+/g, '$1');

    // 6. Simplify vowels: map all vowels to 'a'
    w = w.replace(/[aeiou]/g, 'a');

    return w;
  }

  initEvents() {
    this.startBtn.addEventListener('click', () => this.startMagic());
    this.micBtn.addEventListener('click', () => this.toggleListening());

    // Screen Touch / Tap listener to summon a random animal
    document.addEventListener('pointerdown', (e) => {
      // Ignore clicks on setup overlay, mic buttons, and start button
      if (e.target.closest('#mic-btn') || e.target.closest('#setup-overlay') || e.target.closest('#start-btn')) return;

      if (this.state === STATES.IDLE_WAITING) {
        this.triggerRandomAnimal("Screen Tap: ");
      }
    });

    // Keyboard press listener to summon a random animal
    window.addEventListener('keydown', (e) => {
      // Ignore if setup overlay is active
      if (this.setupOverlay && !this.setupOverlay.classList.contains('hidden')) return;

      if (this.state === STATES.IDLE_WAITING) {
        this.triggerRandomAnimal(`Key [${e.key.toUpperCase()}]: `);
      }
    });
  }

  // Helper to summon a random animal from the active list
  triggerRandomAnimal(prefixText = "Magic Summon: ") {
    if (this.state !== STATES.IDLE_WAITING) return;

    const activeAnimals = Object.keys(this.animalElements);
    const randomIndex = Math.floor(Math.random() * activeAnimals.length);
    const randomAnimal = activeAnimals[randomIndex];

    this.currentAnimal = randomAnimal;
    this.transitionTo(STATES.HEARD);

    this.speechFeedBubble.classList.add('recognized');
    this.speechFeedBubble.innerText = `${prefixText}${randomAnimal.toUpperCase()}!`;
    this.speechFeed.classList.add('visible');

    setTimeout(() => {
      this.transitionTo(STATES.SUMMONING);
    }, 400);
  }

  // Calculate Levenshtein distance between two strings
  levenshtein(s1, s2) {
    if (s1.length < s2.length) {
      return this.levenshtein(s2, s1);
    }
    if (s2.length === 0) {
      return s1.length;
    }
    let previousRow = Array.from(Array(s2.length + 1).keys());
    for (let i = 0; i < s1.length; i++) {
      let currentRow = [i + 1];
      for (let j = 0; j < s2.length; j++) {
        let insertions = previousRow[j + 1] + 1;
        let deletions = currentRow[j] + 1;
        let substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
        currentRow.push(Math.min(insertions, deletions, substitutions));
      }
      previousRow = currentRow;
    }
    return previousRow[s2.length];
  }

  // Set up Audio Context for synthesizer sound effects
  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Synthesize a magical wand chime sound
  playWandSound() {
    this.initAudio();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    
    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (index * 0.08));
      
      gain.gain.setValueAtTime(0.15, now + (index * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.08) + 0.4);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start(now + (index * 0.08));
      osc.stop(now + (index * 0.08) + 0.4);
    });
  }

  // Synthesize a magical poof explosion sound
  playPoofSound() {
    this.initAudio();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.4; // 0.4 seconds
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with random white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.35);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.4);
  }

  // Speak a phrase using the Web Speech Synthesis API
  speak(phrase) {
    if ('speechSynthesis' in window) {
      // Cancel active voice to avoid stacking
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      utterance.rate = 1.15; // slightly faster
      utterance.pitch = 1.4; // high pitch for kid-like voice
      
      // Attempt to pick a cute/high-pitched voice if available
      const voices = window.speechSynthesis.getVoices();
      const childVoice = voices.find(v => v.name.toLowerCase().includes('google US English') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('kid') || v.name.toLowerCase().includes('toy'));
      if (childVoice) {
        utterance.voice = childVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }

  // Start the experience after overlay click
  startMagic() {
    this.initAudio();
    this.particles = new ParticleSystem('particle-canvas');
    this.setupOverlay.classList.add('hidden');
    
    // Small chime to confirm audio initialized
    this.playWandSound();
    
    // Init speech recognition
    this.initSpeechRecognition();
  }

  // Initialize Speech Recognition
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateHUDState(STATES.COOLDOWN, "Mic Unavail.");
      this.speechFeedBubble.innerText = "Speech Recognition not supported in this browser. Please use Safari on iOS, or Chrome/Edge on Desktop.";
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListeningActive = true;
      if (this.state === STATES.INITIALIZING || this.state === STATES.RESET) {
        this.transitionTo(STATES.IDLE_WAITING);
      }
    };

    this.recognition.onresult = (event) => {
      if (this.state !== STATES.IDLE_WAITING) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentSpeech = (finalTranscript || interimTranscript).toLowerCase().trim();
      if (!currentSpeech) return;

      const words = currentSpeech.split(/\s+/);
      let matchedAnimal = null;
      let isExact = false;

      for (const word of words) {
        if (word.length < 2) continue; // skip single letter noise

        // 1. Direct exact or explicit toddler map check
        if (this.supportedAnimals[word]) {
          matchedAnimal = this.supportedAnimals[word];
          isExact = true;
          break;
        }

        // 2. Custom toddler phonetic normalization check
        const normalizedWord = this.normalizeToddlerSpeech(word);
        if (!normalizedWord || normalizedWord.length < 2) continue;

        for (const target of this.coreAnimals) {
          const normalizedTarget = this.normalizedCoreAnimals[target];

          // Exact phonetic match
          if (normalizedWord === normalizedTarget) {
            matchedAnimal = target;
            break;
          }

          // Substring phonetic match (e.g. "gator" -> "alligator", "hippo" -> "hippopotamus")
          if (normalizedWord.length >= 3 && (normalizedTarget.includes(normalizedWord) || normalizedWord.includes(normalizedTarget))) {
            matchedAnimal = target;
            break;
          }

          // Levenshtein phonetic distance
          const distance = this.levenshtein(normalizedWord, normalizedTarget);
          let threshold = 1;
          if (normalizedTarget.length >= 6) threshold = 2;

          if (distance <= threshold) {
            matchedAnimal = target;
            break;
          }
        }
        if (matchedAnimal) break;
      }

      // 3. If matched, update bubble, show overlay, and trigger summon; otherwise remain silent
      if (matchedAnimal) {
        this.speechFeedBubble.classList.add('recognized');
        if (isExact) {
          this.speechFeedBubble.innerText = `Summoning: ${matchedAnimal.toUpperCase()}!`;
        } else {
          this.speechFeedBubble.innerText = `Best Guess: ${matchedAnimal.toUpperCase()}!`;
        }
        this.speechFeed.classList.add('visible'); // Show speech feed on match
        this.handleAnimalTrigger(matchedAnimal);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        this.updateHUDState(STATES.COOLDOWN, "Blocked Mic");
        this.speechFeedBubble.innerText = "Microphone access blocked. Please enable it in browser settings.";
        this.isListeningActive = false;
      }
    };

    this.recognition.onend = () => {
      this.isListeningActive = false;
      // Auto-restart if we are in IDLE_WAITING state
      if (this.state === STATES.IDLE_WAITING) {
        this.startListening();
      }
    };

    this.startListening();
  }

  startListening() {
    if (this.recognition && !this.isListeningActive) {
      try {
        this.recognition.start();
        this.isListeningActive = true;
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
        this.isListeningActive = false;
      } catch (e) {
        console.error("Failed to stop speech recognition", e);
      }
    }
  }

  toggleListening() {
    if (this.state !== STATES.IDLE_WAITING && this.state !== STATES.INITIALIZING) return;

    if (this.isListeningActive) {
      this.stopListening();
      this.updateHUDState(STATES.COOLDOWN, "Muted");
      this.speechFeedBubble.innerText = "Paused listening. Tap indicator to resume.";
      this.speechFeed.classList.add('visible'); // Show pause status
    } else {
      this.startListening();
      this.updateHUDState(STATES.IDLE_WAITING, "Listening...");
      this.speechFeedBubble.innerText = "";
      this.speechFeed.classList.remove('visible'); // Hide when listening resumes
    }
  }

  // State Transitions Manager
  transitionTo(nextState) {
    this.state = nextState;
    console.log(`Transitioned to state: ${nextState}`);

    switch (nextState) {
      case STATES.IDLE_WAITING:
        this.updateHUDState(STATES.IDLE_WAITING, "Listening...");
        this.speechFeedBubble.innerText = "";
        this.speechFeedBubble.classList.remove('recognized');
        this.speechFeed.classList.remove('visible'); // Hide speech feed
        this.boyFront.classList.add('active');
        this.boyAction.classList.remove('active');
        this.speechBubble.classList.remove('active');
        this.startListening();
        break;

      case STATES.HEARD:
        this.updateHUDState(STATES.HEARD, "Heard Word!");
        // Stop listening temporarily during summon sequence
        this.stopListening();
        break;

      case STATES.SUMMONING:
        this.updateHUDState(STATES.SUMMONING, "Magic Wave!");
        this.executeSummon();
        break;

      case STATES.COOLDOWN:
        this.updateHUDState(STATES.COOLDOWN, "Resting (2s)");
        this.cooldownTimer = setTimeout(() => {
          this.resetStage();
        }, 2000);
        break;
    }
  }

  updateHUDState(stateType, label) {
    this.statusLabel.innerText = label;
    this.micBtn.className = "mic-status-container"; // reset classes

    if (stateType === STATES.IDLE_WAITING) {
      this.micBtn.classList.add('listening');
    } else if (stateType === STATES.HEARD || stateType === STATES.SUMMONING) {
      this.micBtn.classList.add('listening');
    } else {
      this.micBtn.classList.add('cooldown');
    }
  }

  // Triggered when animal keyword is matched
  handleAnimalTrigger(animalName) {
    this.currentAnimal = animalName;
    this.transitionTo(STATES.HEARD);
    
    // Short delay for anticipation, then start summon
    setTimeout(() => {
      this.transitionTo(STATES.SUMMONING);
    }, 400);
  }

  // The boy character turns, waves wand, speaks, and summons animal
  executeSummon() {
    // 1. Turn boy character (swap active image)
    this.boyFront.classList.remove('active');
    this.boyAction.classList.add('active');

    // 2. Say abracadabra!
    const spokenText = `Abracadabra! ${this.currentAnimal}!`;
    this.speechText.innerText = `Abracadabra! ${this.currentAnimal.toUpperCase()}!`;
    this.speechBubble.classList.add('active');
    this.speak(spokenText);

    // 3. Play chime sound and emit wand particles
    this.playWandSound();
    this.emitWandStream();

    // 4. Time the arrival of magic particles at the animal pedestal
    setTimeout(() => {
      // Create magic explosion
      const animalPed = document.querySelector('.animal-wrapper');
      const rect = animalPed.getBoundingClientRect();
      const stageRect = document.querySelector('.diorama-stage').getBoundingClientRect();
      
      const explosionX = rect.left + rect.width / 2 - stageRect.left;
      const explosionY = rect.bottom - 45 - stageRect.top; // centered vertically near pedestal body

      this.playPoofSound();
      this.particles.createSummonExplosion(explosionX, explosionY);

      // 5. Reveal animal
      const animalEl = this.animalElements[this.currentAnimal];
      if (animalEl) {
        // Hide all other animal elements
        Object.values(this.animalElements).forEach(el => {
          el.className = "animal-img";
        });
        animalEl.classList.add('summon-pop');
      }

      // 6. Turn boy back to front view, hide bubble
      setTimeout(() => {
        this.boyFront.classList.add('active');
        this.boyAction.classList.remove('active');
        this.speechBubble.classList.remove('active');
        
        // Go to cooldown state
        this.transitionTo(STATES.COOLDOWN);
      }, 800);

    }, 850); // Particle travel time
  }

  // Compute exact coordinates to fire particle stream
  emitWandStream() {
    const stage = document.querySelector('.diorama-stage');
    const stageRect = stage.getBoundingClientRect();
    
    // Wand tip coordinate
    const wandTip = document.getElementById('wand-tip');
    const wandRect = wandTip.getBoundingClientRect();
    const startX = wandRect.left - stageRect.left;
    const startY = wandRect.top - stageRect.top;

    // Animal Pedestal center target coordinate
    const animalPed = document.querySelector('.animal-wrapper');
    const pedRect = animalPed.getBoundingClientRect();
    const endX = pedRect.left + pedRect.width / 2 - stageRect.left;
    const endY = pedRect.bottom - 60 - stageRect.top;

    // Emit stream
    this.particles.createWandStream(startX, startY, endX, endY);
  }

  // Clean stage after 5 second cooldown
  resetStage() {
    if (this.currentAnimal) {
      const animalEl = this.animalElements[this.currentAnimal];
      if (animalEl) {
        animalEl.classList.remove('summon-pop');
        animalEl.classList.add('dismiss-pop');
        
        // Let dismissal animation finish
        setTimeout(() => {
          animalEl.classList.remove('dismiss-pop');
          this.currentAnimal = null;
          this.state = STATES.RESET;
          this.transitionTo(STATES.IDLE_WAITING);
        }, 500);
      } else {
        this.currentAnimal = null;
        this.state = STATES.RESET;
        this.transitionTo(STATES.IDLE_WAITING);
      }
    } else {
      this.state = STATES.RESET;
      this.transitionTo(STATES.IDLE_WAITING);
    }
  }
}

// Initialise App once page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  window.magicApp = new App();

  // Register Service Worker for PWA offline capabilities
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }
});
